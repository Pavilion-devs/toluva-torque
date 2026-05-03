import { config } from "../config.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import BN from "bn.js";

function publicKeyFrom(value, fieldName) {
  try {
    return new PublicKey(String(value || "").trim());
  } catch {
    const error = new Error(`${fieldName} must be a valid Solana public key.`);
    error.status = 400;
    throw error;
  }
}

function optionalPublicKeyFrom(value, fieldName) {
  if (!value) {
    return null;
  }

  return publicKeyFrom(value, fieldName);
}

function positiveIntegerString(value, fieldName) {
  const raw = String(value || "").trim();

  if (!/^[1-9]\d*$/.test(raw)) {
    const error = new Error(`${fieldName} must be a positive integer string in raw token units.`);
    error.status = 400;
    throw error;
  }

  return raw;
}

function maybePositiveIntegerString(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return positiveIntegerString(value, fieldName);
}

function launchpadProgramId() {
  return publicKeyFrom(config.raydium.launchpadProgramId, "RAYDIUM_LAUNCHPAD_PROGRAM_ID");
}

function quoteMint() {
  return optionalPublicKeyFrom(config.raydium.quoteMint, "RAYDIUM_QUOTE_MINT") || NATIVE_MINT;
}

function serializablePublicKey(value) {
  return value?.toBase58?.() || null;
}

function txVersionFrom(value) {
  return String(value || "V0").toUpperCase() === "LEGACY" ? "LEGACY" : "V0";
}

function requiredSignerPubkeys(transaction) {
  if (transaction.message?.staticAccountKeys && transaction.message?.header) {
    return transaction.message.staticAccountKeys
      .slice(0, transaction.message.header.numRequiredSignatures)
      .map((key) => key.toBase58());
  }

  return (transaction.signatures || []).map((signature) => signature.publicKey?.toBase58?.()).filter(Boolean);
}

function serializeTransactions(result, fallbackVersion) {
  const transactions = result.transactions || (result.transaction ? [result.transaction] : []);

  return transactions.map((transaction, index) => ({
    index,
    version: transaction.version ?? fallbackVersion,
    base64: Buffer.from(transaction.serialize()).toString("base64"),
    requiredSigners: requiredSignerPubkeys(transaction),
  }));
}

async function resolveLaunchTransactionInputs(input) {
  const draft = prepareLaunchDraft(input);
  const { getPdaLaunchpadAuth, getPdaLaunchpadConfigId, getPdaLaunchpadPoolId, getPdaLaunchpadVaultId } = await import(
    "@raydium-io/raydium-sdk-v2"
  );

  const programId = launchpadProgramId();
  const mintA = publicKeyFrom(input.mintA, "mintA");
  const mintB = optionalPublicKeyFrom(input.mintB || input.quoteMint, "mintB") || quoteMint();
  const creatorWallet = publicKeyFrom(input.creatorWallet || input.creator || input.wallet, "creatorWallet");
  const platformId = optionalPublicKeyFrom(input.platformId || config.raydium.platformId || config.raydium.defaultPlatformId, "platformId");
  const configId =
    optionalPublicKeyFrom(input.configId || config.raydium.configId, "configId") ||
    getPdaLaunchpadConfigId(programId, mintB, config.raydium.curveType, config.raydium.configIndex).publicKey;
  const poolId = getPdaLaunchpadPoolId(programId, mintA, mintB).publicKey;
  const auth = getPdaLaunchpadAuth(programId).publicKey;
  const vaultA = getPdaLaunchpadVaultId(programId, poolId, mintA).publicKey;
  const vaultB = getPdaLaunchpadVaultId(programId, poolId, mintB).publicKey;
  const buyAmount = positiveIntegerString(input.buyAmount, "buyAmount");
  const supply = positiveIntegerString(input.supply, "supply");
  const totalSellA = positiveIntegerString(input.totalSellA, "totalSellA");
  const totalFundRaisingB = positiveIntegerString(input.totalFundRaisingB, "totalFundRaisingB");
  const totalLockedAmount = maybePositiveIntegerString(input.totalLockedAmount, "totalLockedAmount") || "0";
  const cliffPeriod = maybePositiveIntegerString(input.cliffPeriod, "cliffPeriod") || "0";
  const unlockPeriod = maybePositiveIntegerString(input.unlockPeriod, "unlockPeriod") || "0";
  const missingToBuild = [];

  if (!platformId) {
    missingToBuild.push("platformId or RAYDIUM_PLATFORM_ID");
  }

  return {
    draft,
    programId,
    mintA,
    mintB,
    creatorWallet,
    platformId,
    configId,
    poolId,
    auth,
    vaultA,
    vaultB,
    buyAmount,
    supply,
    totalSellA,
    totalFundRaisingB,
    totalLockedAmount,
    cliffPeriod,
    unlockPeriod,
    missingToBuild,
    txVersion: txVersionFrom(input.txVersion),
  };
}

function transactionPlanFromResolved(resolved) {
  return {
    mode: "wallet_signed_transaction_plan",
    readyToBuildTransaction: resolved.missingToBuild.length === 0,
    missingToBuild: resolved.missingToBuild,
    note:
      resolved.missingToBuild.length === 0
        ? "Use these parameters client-side with Raydium.load({ owner: creatorWallet }) and launchpad.createLaunchpad; the creator wallet and mint keypair must sign."
        : "Set the missing Raydium platform input before building a signed devnet LaunchLab transaction.",
    raydium: getLaunchLabConfig(),
    launchParams: {
      ...resolved.draft.launchParams,
      creatorWallet: resolved.creatorWallet.toBase58(),
      mintA: resolved.mintA.toBase58(),
      mintB: resolved.mintB.toBase58(),
      platformId: resolved.platformId?.toBase58?.() || null,
      configId: resolved.configId.toBase58(),
      buyAmount: resolved.buyAmount,
      supply: resolved.supply,
      totalSellA: resolved.totalSellA,
      totalFundRaisingB: resolved.totalFundRaisingB,
      totalLockedAmount: resolved.totalLockedAmount,
      cliffPeriod: resolved.cliffPeriod,
      unlockPeriod: resolved.unlockPeriod,
      txVersion: resolved.txVersion,
    },
    derivedAddresses: {
      programId: resolved.programId.toBase58(),
      auth: resolved.auth.toBase58(),
      poolId: resolved.poolId.toBase58(),
      vaultA: resolved.vaultA.toBase58(),
      vaultB: resolved.vaultB.toBase58(),
      configId: resolved.configId.toBase58(),
    },
    signerResponsibilities: {
      creatorWallet: "Pays fees, owns the launch, signs the LaunchLab transaction.",
      mintA: "Token mint keypair for the launched token; must sign the mint initialization transaction.",
      backend: "Does not hold creator or mint private keys.",
    },
  };
}

async function resolveBuyTransactionInputs(input) {
  const programId = launchpadProgramId();
  const mintA = publicKeyFrom(input.mintA, "mintA");
  const mintB = optionalPublicKeyFrom(input.mintB || input.quoteMint, "mintB") || quoteMint();
  const buyerWallet = publicKeyFrom(input.buyerWallet || input.wallet || input.creatorWallet, "buyerWallet");
  const buyAmount = positiveIntegerString(input.buyAmount, "buyAmount");

  return {
    programId,
    mintA,
    mintB,
    buyerWallet,
    buyAmount,
    txVersion: txVersionFrom(input.txVersion),
  };
}

export function getLaunchLabConfig() {
  return {
    cluster: config.raydium.cluster,
    launchpadProgramId: config.raydium.launchpadProgramId,
    platformId: config.raydium.platformId || null,
    effectivePlatformId: config.raydium.platformId || config.raydium.defaultPlatformId || null,
    configId: config.raydium.configId || null,
    quoteMint: config.raydium.quoteMint || null,
    curveType: config.raydium.curveType,
    configIndex: config.raydium.configIndex,
    sdkPackage: config.raydium.sdkPackage,
  };
}

export async function getLaunchLabStatus(poolId) {
  const base = {
    ok: Boolean(config.raydium.launchpadProgramId),
    config: getLaunchLabConfig(),
    poolId: poolId || null,
  };

  try {
    const { LaunchpadPool } = await import("@raydium-io/raydium-sdk-v2");

    if (poolId) {
      const poolPublicKey = publicKeyFrom(poolId, "poolId");
      const connection = new Connection(config.solana.rpcUrl, config.solana.commitment);
      const account = await connection.getAccountInfo(poolPublicKey, config.solana.commitment);

      if (!account) {
        return {
          ...base,
          ok: false,
          status: "pool_not_found",
          note: `No LaunchLab pool account found for ${poolPublicKey.toBase58()} on ${config.solana.cluster}.`,
        };
      }

      const poolInfo = LaunchpadPool.decode(account.data);

      return {
        ...base,
        status: "pool_read",
        owner: account.owner.toBase58(),
        lamports: account.lamports,
        pool: {
          poolId: poolPublicKey.toBase58(),
          mintA: serializablePublicKey(poolInfo.mintA),
          mintB: serializablePublicKey(poolInfo.mintB),
          configId: serializablePublicKey(poolInfo.configId),
          platformId: serializablePublicKey(poolInfo.platformId),
          creator: serializablePublicKey(poolInfo.creator),
          vaultA: serializablePublicKey(poolInfo.vaultA),
          vaultB: serializablePublicKey(poolInfo.vaultB),
          supply: poolInfo.supply?.toString?.() || null,
          totalSellA: poolInfo.totalSellA?.toString?.() || null,
          totalFundRaisingB: poolInfo.totalFundRaisingB?.toString?.() || null,
          realA: poolInfo.realA?.toString?.() || null,
          realB: poolInfo.realB?.toString?.() || null,
          virtualA: poolInfo.virtualA?.toString?.() || null,
          virtualB: poolInfo.virtualB?.toString?.() || null,
          migrateType: poolInfo.migrateType,
          status: poolInfo.status,
        },
      };
    }
  } catch (error) {
    if (error?.status) {
      throw error;
    }

    return {
      ...base,
      ok: false,
      status: poolId ? "pool_read_failed" : "sdk_unavailable",
      reason: error?.code === "ERR_MODULE_NOT_FOUND" ? "missing_dependency" : poolId ? "pool_read_failed" : "sdk_unavailable",
      dependency: config.raydium.sdkPackage,
      note:
        error?.code === "ERR_MODULE_NOT_FOUND"
          ? "Install the Raydium SDK before building signed LaunchLab transactions."
          : error?.message || "Unable to read Raydium LaunchLab state.",
    };
  }

  return {
    ...base,
    status: "sdk_available",
    note: "Pass a poolId to read live LaunchLab pool state, or POST /api/raydium/launches/transaction-plan to prepare wallet-signed launch inputs.",
  };
}

export function prepareLaunchDraft(input) {
  const name = String(input.name || "").trim();
  const symbol = String(input.symbol || input.sym || "").trim().toUpperCase();
  const uri = String(input.uri || input.metadataUri || "").trim();

  if (!name || !symbol || !uri) {
    const error = new Error("Raydium launch prep requires `name`, `symbol`/`sym`, and `uri`.");
    error.status = 400;
    throw error;
  }

  return {
    mode: "transaction_prep",
    readyToBuildTransaction: false,
    reason: "wallet_signed_launch_not_enabled_yet",
    requiredNextInputs: ["creatorWallet", "mintA", "buyAmount", "supply", "totalSellA", "totalFundRaisingB"],
    raydium: getLaunchLabConfig(),
    launchParams: {
      name,
      symbol,
      uri,
      decimals: Number.isFinite(Number(input.decimals)) ? Number(input.decimals) : 6,
      migrateType: input.migrateType || "cpmm",
      supply: input.supply || null,
      totalSellA: input.totalSellA || null,
      totalFundRaisingB: input.totalFundRaisingB || null,
      createOnly: input.createOnly !== false,
    },
  };
}

export async function prepareLaunchTransactionPlan(input) {
  return transactionPlanFromResolved(await resolveLaunchTransactionInputs(input));
}

export async function buildLaunchTransaction(input) {
  const resolved = await resolveLaunchTransactionInputs(input);
  const plan = transactionPlanFromResolved(resolved);

  if (!plan.readyToBuildTransaction) {
    return {
      ...plan,
      mode: "wallet_signed_transaction_build_blocked",
    };
  }

  const { Raydium, TxVersion } = await import("@raydium-io/raydium-sdk-v2");
  const connection = new Connection(config.solana.rpcUrl, config.solana.commitment);
  const txVersion = resolved.txVersion === "LEGACY" ? TxVersion.LEGACY : TxVersion.V0;
  const raydium = await Raydium.load({
    connection,
    cluster: config.raydium.cluster,
    owner: resolved.creatorWallet,
    disableLoadToken: true,
    disableFeatureCheck: true,
  });
  const result = await raydium.launchpad.createLaunchpad({
    programId: resolved.programId,
    mintA: resolved.mintA,
    name: plan.launchParams.name,
    symbol: plan.launchParams.symbol,
    uri: plan.launchParams.uri,
    decimals: plan.launchParams.decimals,
    migrateType: plan.launchParams.migrateType,
    configId: resolved.configId,
    platformId: resolved.platformId,
    buyAmount: new BN(resolved.buyAmount),
    supply: new BN(resolved.supply),
    totalSellA: new BN(resolved.totalSellA),
    totalFundRaisingB: new BN(resolved.totalFundRaisingB),
    totalLockedAmount: new BN(resolved.totalLockedAmount),
    cliffPeriod: new BN(resolved.cliffPeriod),
    unlockPeriod: new BN(resolved.unlockPeriod),
    createOnly: plan.launchParams.createOnly,
    txVersion,
  });

  return {
    ...plan,
    mode: "wallet_signed_transaction_build",
    readyToSubmit: true,
    transactionFormat: "base64",
    transactions: serializeTransactions(result, plan.launchParams.txVersion),
    instructionTypes: result.instructionTypes || [],
    extInfo: {
      poolId: serializablePublicKey(result.extInfo?.address?.poolId) || plan.derivedAddresses.poolId,
      mintA: serializablePublicKey(result.extInfo?.address?.mintA) || plan.launchParams.mintA,
      mintB: serializablePublicKey(result.extInfo?.address?.mintB) || plan.launchParams.mintB,
      platformId: serializablePublicKey(result.extInfo?.address?.platformId) || plan.launchParams.platformId,
      configId: serializablePublicKey(result.extInfo?.address?.configId) || plan.launchParams.configId,
    },
  };
}

export async function buildBuyTransaction(input) {
  const resolved = await resolveBuyTransactionInputs(input);
  const { Raydium, TxVersion } = await import("@raydium-io/raydium-sdk-v2");
  const connection = new Connection(config.solana.rpcUrl, config.solana.commitment);
  const txVersion = resolved.txVersion === "LEGACY" ? TxVersion.LEGACY : TxVersion.V0;
  const raydium = await Raydium.load({
    connection,
    cluster: config.raydium.cluster,
    owner: resolved.buyerWallet,
    disableLoadToken: true,
    disableFeatureCheck: true,
  });
  const result = await raydium.launchpad.buyToken({
    programId: resolved.programId,
    mintA: resolved.mintA,
    mintB: resolved.mintB,
    buyAmount: new BN(resolved.buyAmount),
    txVersion,
  });

  return {
    mode: "wallet_signed_buy_transaction_build",
    readyToSubmit: true,
    transactionFormat: "base64",
    buyParams: {
      buyerWallet: resolved.buyerWallet.toBase58(),
      mintA: resolved.mintA.toBase58(),
      mintB: resolved.mintB.toBase58(),
      buyAmount: resolved.buyAmount,
      txVersion: resolved.txVersion,
    },
    transactions: serializeTransactions(result, resolved.txVersion),
    instructionTypes: result.instructionTypes || [],
    extInfo: {
      amountA: result.extInfo?.amountA?.amount?.toString?.() || null,
      amountB: result.extInfo?.amountB?.toString?.() || resolved.buyAmount,
      minAmountA: result.extInfo?.minDecimalOutAmount?.toString?.() || null,
    },
  };
}
