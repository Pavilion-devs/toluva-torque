import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { getAccount, NATIVE_MINT, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import {
  ActivationType,
  BaseFeeMode,
  buildCurve,
  CollectFeeMode,
  DammV2DynamicFeeMode,
  DAMM_V2_MIGRATION_FEE_ADDRESS,
  deriveDbcPoolAddress,
  deriveDammV2PoolAddress,
  derivePositionNftAccount,
  DynamicBondingCurveClient,
  createDammV2Program,
  MigratedCollectFeeMode,
  MigrationFeeOption,
  MigrationOption,
  SwapMode,
  TokenAuthorityOption,
  TokenDecimal,
  TokenType,
  validateConfigParameters,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { config } from "../config.js";
import { hasLockedVesting, migrationReady, migrationStage } from "./meteora-lifecycle.js";

export const METEORA_DBC_PROGRAM = "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN";
export const CONVICTION_RECIPE_VERSION = 1;
export const DEFAULT_THRESHOLD_SOL = 5;

const connection = new Connection(config.solana.rpcUrl, config.solana.commitment);
const client = DynamicBondingCurveClient.create(connection, config.solana.commitment);
const dammProgram = createDammV2Program(connection, config.solana.commitment);

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function key(value, label) {
  try {
    return new PublicKey(value);
  } catch {
    return badRequest(`${label} must be a Solana public key.`);
  }
}

function text(value, label, maxLength) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.length > maxLength) badRequest(`${label} is required and must be at most ${maxLength} characters.`);
  return normalized;
}

function threshold(value) {
  const amount = Number(value ?? DEFAULT_THRESHOLD_SOL);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100) {
    badRequest("Migration threshold must be between 1 and 100 SOL for this recipe.");
  }
  return amount;
}

export function convictionTerms(input = {}) {
  return {
    recipe: "Conviction",
    version: CONVICTION_RECIPE_VERSION,
    cluster: config.solana.cluster,
    quoteMint: NATIVE_MINT.toBase58(),
    quoteSymbol: "SOL",
    tokenSupply: 1_000_000_000,
    migrationSupplyPercentage: 20,
    tokenDecimals: 6,
    tokenAuthority: "immutable",
    migrationThresholdSol: threshold(input.migrationThresholdSol),
    curveFeeBps: 100,
    creatorTradingFeePercentage: 0,
    partnerTradingFeePercentage: 0,
    poolCreationFeeSol: 0,
    migrationTarget: "DAMM v2",
    migratedPoolFeeBps: 30,
    liquidity: {
      creatorPermanentLockedPercentage: 50,
      creatorUnlockedPercentage: 50,
      partnerPercentage: 0,
    },
  };
}

export function buildConvictionConfig(input = {}) {
  const terms = convictionTerms(input);
  const curve = buildCurve({
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: TokenDecimal.NINE,
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: terms.tokenSupply,
      leftover: 0,
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: {
          startingFeeBps: terms.curveFeeBps,
          endingFeeBps: terms.curveFeeBps,
          numberOfPeriod: 0,
          totalDuration: 0,
        },
      },
      dynamicFeeEnabled: false,
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: 0,
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.Customizable,
      migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
      migratedPoolFee: {
        collectFeeMode: MigratedCollectFeeMode.QuoteToken,
        dynamicFee: DammV2DynamicFeeMode.Disabled,
        poolFeeBps: terms.migratedPoolFeeBps,
      },
    },
    liquidityDistribution: {
      partnerLiquidityPercentage: 0,
      partnerPermanentLockedLiquidityPercentage: 0,
      creatorLiquidityPercentage: 50,
      creatorPermanentLockedLiquidityPercentage: 50,
    },
    lockedVesting: {
      totalLockedVestingAmount: 0,
      numberOfVestingPeriod: 0,
      cliffUnlockAmount: 0,
      totalVestingDuration: 0,
      cliffDurationFromMigrationTime: 0,
    },
    activationType: ActivationType.Timestamp,
    percentageSupplyOnMigration: terms.migrationSupplyPercentage,
    migrationQuoteThreshold: terms.migrationThresholdSol,
  });
  return { curve, terms };
}

async function serializeUnsigned(transaction, payer) {
  const latest = await connection.getLatestBlockhash(config.solana.commitment);
  transaction.feePayer = payer;
  transaction.recentBlockhash = latest.blockhash;
  if (!(transaction instanceof Transaction)) badRequest("DBC SDK returned an unsupported transaction type.");
  return {
    transaction: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  };
}

export async function buildConfigTransaction(input) {
  if (config.solana.cluster !== "devnet") badRequest("New Meteora configs are currently enabled on devnet only.");
  const payer = key(input.payer, "Payer");
  const configKey = key(input.config, "Config");
  const { curve, terms } = buildConvictionConfig(input);
  const params = {
    config: configKey,
    payer,
    feeClaimer: payer,
    leftoverReceiver: payer,
    quoteMint: NATIVE_MINT,
    ...curve,
  };
  validateConfigParameters(params);
  const transaction = await client.partner.createConfig(params);
  return {
    ...(await serializeUnsigned(transaction, payer)),
    config: configKey.toBase58(),
    terms: { ...terms, feeClaimer: payer.toBase58(), leftoverReceiver: payer.toBase58() },
  };
}

export async function getConfigTerms(address) {
  const configKey = key(address, "Config");
  const state = await client.state.getPoolConfig(configKey);
  if (!state) badRequest("The selected DBC config was not found on this network.");
  if (!state.quoteMint.equals(NATIVE_MINT)) badRequest("This launch flow currently supports SOL quote configs only.");
  return { address: configKey.toBase58(), state };
}

export function summarizeConfig(address, state) {
  return {
    address: String(address),
    quoteMint: state.quoteMint.toBase58(),
    feeClaimer: state.feeClaimer.toBase58(),
    leftoverReceiver: state.leftoverReceiver.toBase58(),
    migrationQuoteThreshold: state.migrationQuoteThreshold.toString(),
    migrationOption: state.migrationOption,
    tokenType: state.tokenType,
    tokenDecimal: state.tokenDecimal,
    tokenUpdateAuthority: state.tokenUpdateAuthority,
    fixedTokenSupply: state.fixedTokenSupplyFlag === 1,
    curveFeeBps: Number(state.poolFees.baseFee.cliffFeeNumerator.toString()) / 100_000,
    migratedPoolFeeBps: state.migratedPoolFeeBps,
    creatorLiquidityPercentage: state.creatorLiquidityPercentage,
    creatorPermanentLockedLiquidityPercentage: state.creatorPermanentLockedLiquidityPercentage,
    partnerLiquidityPercentage: state.partnerLiquidityPercentage,
    partnerPermanentLockedLiquidityPercentage: state.partnerPermanentLockedLiquidityPercentage,
  };
}

export function assertConvictionConfig(address, state, payer, requestedThresholdSol) {
  const { curve, terms } = buildConvictionConfig({ migrationThresholdSol: requestedThresholdSol });
  const summary = summarizeConfig(address, state);
  const differences = [];
  const expect = (field, actual, value) => {
    if (String(actual) !== String(value)) differences.push(field);
  };
  expect("quote mint", summary.quoteMint, NATIVE_MINT.toBase58());
  expect("fee claimer", summary.feeClaimer, payer.toBase58());
  expect("leftover receiver", summary.leftoverReceiver, payer.toBase58());
  expect("graduation target", summary.migrationQuoteThreshold, curve.migrationQuoteThreshold);
  expect("migration destination", summary.migrationOption, curve.migrationOption);
  expect("migration fee option", state.migrationFeeOption, curve.migrationFeeOption);
  expect("migration fee", state.migrationFeePercentage, curve.migrationFee.feePercentage);
  expect("creator migration fee", state.creatorMigrationFeePercentage, curve.migrationFee.creatorFeePercentage);
  expect("token type", summary.tokenType, curve.tokenType);
  expect("token decimals", summary.tokenDecimal, curve.tokenDecimal);
  expect("token update authority", summary.tokenUpdateAuthority, curve.tokenUpdateAuthority);
  expect("fixed supply", state.fixedTokenSupplyFlag, 1);
  expect("pre-migration supply", state.preMigrationTokenSupply, curve.tokenSupply.preMigrationTokenSupply);
  expect("post-migration supply", state.postMigrationTokenSupply, curve.tokenSupply.postMigrationTokenSupply);
  expect("activation type", state.activationType, curve.activationType);
  expect("DBC fee collection", state.collectFeeMode, curve.collectFeeMode);
  expect("creator DBC fee share", state.creatorTradingFeePercentage, curve.creatorTradingFeePercentage);
  expect("pool creation fee", state.poolCreationFee, curve.poolCreationFee);
  expect("minimum first-swap fee", Number(state.enableFirstSwapWithMinFee), Number(curve.enableFirstSwapWithMinFee));
  for (const field of ["cliffFeeNumerator", "firstFactor", "secondFactor", "thirdFactor", "baseFeeMode"]) {
    expect(`DBC ${field}`, state.poolFees.baseFee[field], curve.poolFees.baseFee[field]);
  }
  if (curve.poolFees.dynamicFee !== null || state.poolFees.dynamicFee?.initialized !== 0) differences.push("dynamic DBC fee");
  expect("DAMM v2 fee collection", state.migratedCollectFeeMode, curve.migratedPoolFee.collectFeeMode);
  expect("DAMM v2 dynamic fee", state.migratedDynamicFee, curve.migratedPoolFee.dynamicFee);
  expect("DAMM v2 fee", state.migratedPoolFeeBps, curve.migratedPoolFee.poolFeeBps);
  expect("DAMM v2 fee mode", state.migratedPoolBaseFeeMode, curve.migratedPoolBaseFeeMode);
  expect("DAMM v2 compounding fee", state.migratedCompoundingFeeBps, curve.compoundingFeeBps);
  for (const field of [
    "partnerLiquidityPercentage",
    "partnerPermanentLockedLiquidityPercentage",
    "creatorLiquidityPercentage",
    "creatorPermanentLockedLiquidityPercentage",
  ]) expect(field, state[field], curve[field]);
  for (const field of ["amountPerPeriod", "cliffDurationFromMigrationTime", "frequency", "numberOfPeriod", "cliffUnlockAmount"]) {
    expect(`locked vesting ${field}`, state.lockedVestingConfig[field], curve.lockedVesting[field]);
  }
  expect("starting price", state.sqrtStartPrice, curve.sqrtStartPrice);
  for (let index = 0; index < state.curve.length; index += 1) {
    expect(`curve point ${index} price`, state.curve[index].sqrtPrice, curve.curve[index]?.sqrtPrice ?? 0);
    expect(`curve point ${index} liquidity`, state.curve[index].liquidity, curve.curve[index]?.liquidity ?? 0);
  }
  if (differences.length) badRequest(`Selected config differs from Conviction v${terms.version}: ${differences.join(", ")}.`);
  return summary;
}

export async function buildPoolTransaction(input) {
  if (config.solana.cluster !== "devnet") badRequest("New Meteora pools are currently enabled on devnet only.");
  const payer = key(input.payer, "Payer");
  const configKey = key(input.config, "Config");
  const baseMint = key(input.baseMint, "Base mint");
  const name = text(input.name, "Token name", 32);
  const symbol = text(input.symbol, "Symbol", 10).toUpperCase();
  const uri = text(input.uri, "Metadata URI", 200);
  if (!/^https:\/\//.test(uri)) badRequest("Metadata URI must be an HTTPS URL.");
  const { state } = await getConfigTerms(configKey);
  const onchainConfig = assertConvictionConfig(configKey.toBase58(), state, payer, input.migrationThresholdSol);
  const transaction = await client.creator.createPool({
    baseMint,
    config: configKey,
    name,
    symbol,
    uri,
    payer,
    poolCreator: payer,
  });
  const pool = deriveDbcPoolAddress(NATIVE_MINT, baseMint, configKey);
  return {
    ...(await serializeUnsigned(transaction, payer)),
    pool: pool.toBase58(),
    mint: baseMint.toBase58(),
    config: configKey.toBase58(),
    onchainConfig,
    cluster: config.solana.cluster,
  };
}

export async function verifyPoolLaunch(input) {
  const poolKey = key(input.pool, "Pool");
  const mintKey = key(input.mint, "Mint");
  const configKey = key(input.config, "Config");
  const creator = key(input.creator, "Creator");
  const expectedPool = deriveDbcPoolAddress(NATIVE_MINT, mintKey, configKey);
  if (!poolKey.equals(expectedPool)) badRequest("Pool does not match mint and config.");
  const [poolState, configState, transaction] = await Promise.all([
    client.state.getPool(poolKey),
    client.state.getPoolConfig(configKey),
    connection.getParsedTransaction(text(input.signature, "Signature", 100), { commitment: "confirmed", maxSupportedTransactionVersion: 0 }),
  ]);
  if (!poolState || !configState || !transaction || transaction.meta?.err) badRequest("Confirmed DBC pool and launch transaction are required.");
  const state = poolState.poolState;
  if (!state.config.equals(configKey) || !state.baseMint.equals(mintKey) || !state.creator.equals(creator)) {
    badRequest("Pool accounts do not match the submitted launch.");
  }
  const accountKeys = transaction.transaction.message.accountKeys;
  if (!accountKeys.some((account) => account.pubkey.equals(creator) && account.signer)) badRequest("Creator did not sign the launch transaction.");
  if (!accountKeys.some((account) => account.pubkey.equals(mintKey) && account.signer)) badRequest("Base mint did not sign the launch transaction.");
  const launchInstruction = transaction.transaction.message.instructions.find((instruction) => {
    if (!instruction.programId.equals(new PublicKey(METEORA_DBC_PROGRAM)) || !instruction.data || !instruction.accounts) return false;
    const decoded = client.creator.program.coder.instruction.decode(instruction.data, "base58");
    return decoded?.name === "initializeVirtualPoolWithSplToken"
      && instruction.accounts[0]?.equals(configKey)
      && instruction.accounts[2]?.equals(creator)
      && instruction.accounts[3]?.equals(mintKey)
      && instruction.accounts[5]?.equals(poolKey);
  });
  if (!launchInstruction) badRequest("Transaction did not create this DBC pool.");
  const decoded = client.creator.program.coder.instruction.decode(launchInstruction.data, "base58");
  const metadata = decoded.data.params;
  if (!metadata?.name || !metadata?.symbol || !metadata?.uri) badRequest("Token metadata was not found in the launch transaction.");
  return {
    poolState,
    configState,
    pool: poolKey.toBase58(),
    mint: mintKey.toBase58(),
    config: configKey.toBase58(),
    metadata: { name: metadata.name, symbol: metadata.symbol, uri: metadata.uri },
  };
}

export async function getPoolStatus(poolAddress) {
  const poolKey = key(poolAddress, "Pool");
  const pool = await client.state.getPool(poolKey);
  if (!pool) badRequest("DBC pool was not found on this network.");
  const state = pool.poolState;
  const configState = await client.state.getPoolConfig(state.config);
  if (!configState) badRequest("DBC config was not found on this network.");
  if (Number(configState.migrationOption) !== MigrationOption.MET_DAMM_V2) badRequest("This pool does not migrate to DAMM v2.");
  const dammConfig = DAMM_V2_MIGRATION_FEE_ADDRESS[Number(configState.migrationFeeOption)];
  if (!dammConfig) badRequest("Unsupported DAMM v2 migration fee option.");
  const dammPool = deriveDammV2PoolAddress(dammConfig, state.baseMint, configState.quoteMint);
  const stage = migrationStage(state, configState.migrationQuoteThreshold);
  const progress = stage === "bonding" ? await client.state.getPoolQuoteTokenCurveProgress(poolKey) : 1;
  const dammV2 = {
    config: dammConfig.toBase58(),
    pool: dammPool.toBase58(),
    verified: false,
    positions: [],
  };
  if (stage === "created-pool") {
    const migrated = await dammProgram.account.pool.fetchNullable(dammPool);
    const baseIsTokenA = migrated?.tokenAMint.equals(state.baseMint) && migrated?.tokenBMint.equals(configState.quoteMint);
    const baseIsTokenB = migrated?.tokenBMint.equals(state.baseMint) && migrated?.tokenAMint.equals(configState.quoteMint);
    if (!baseIsTokenA && !baseIsTokenB) {
      throw new Error("DBC reports migration, but the expected DAMM v2 pool cannot be verified.");
    }
    dammV2.verified = true;
    dammV2.tokenAMint = migrated.tokenAMint.toBase58();
    dammV2.tokenBMint = migrated.tokenBMint.toBase58();
    dammV2.liquidity = migrated.liquidity.toString();
    dammV2.permanentLockLiquidity = migrated.permanentLockLiquidity.toString();
    dammV2.tokenAAmount = migrated.tokenAAmount.toString();
    dammV2.tokenBAmount = migrated.tokenBAmount.toString();
    dammV2.poolStatus = migrated.poolStatus;
    const baseFeeBytes = Buffer.from(migrated.poolFees.baseFee.baseFeeInfo.data);
    dammV2.initialBaseFeeBps = Number(baseFeeBytes.readBigUInt64LE(0)) / 100_000;
    dammV2.collectFeeMode = migrated.collectFeeMode;
    try {
      const positions = await dammProgram.account.position.all([{ memcmp: { offset: 8, bytes: dammPool.toBase58() } }]);
      dammV2.positions = await Promise.all(positions.filter(({ account }) => account.pool.equals(dammPool)).map(async ({ publicKey, account }) => {
        const nftAccount = derivePositionNftAccount(account.nftMint);
        const position = {
          address: publicKey.toBase58(),
          nftMint: account.nftMint.toBase58(),
          nftAccount: nftAccount.toBase58(),
          unlockedLiquidity: account.unlockedLiquidity.toString(),
          vestedLiquidity: account.vestedLiquidity.toString(),
          permanentLockedLiquidity: account.permanentLockedLiquidity.toString(),
          pendingBaseFee: decimalAmount(baseIsTokenA ? account.feeAPending : account.feeBPending, configState.tokenDecimal),
          pendingQuoteFee: decimalAmount(baseIsTokenA ? account.feeBPending : account.feeAPending, 9),
        };
        try {
          const token = await getAccount(connection, nftAccount, config.solana.commitment, TOKEN_2022_PROGRAM_ID);
          if (!token.mint.equals(account.nftMint) || token.amount !== 1n) throw new Error("Position NFT account does not hold its expected mint.");
          position.nftHolder = token.owner.toBase58();
        } catch (error) {
          position.ownerError = error.message || "Position NFT holder could not be verified.";
        }
        return position;
      }));
    } catch (error) {
      dammV2.positionError = error.message || "Position accounts are unavailable.";
    }
  }
  return {
    pool: poolKey.toBase58(),
    config: state.config.toBase58(),
    mint: state.baseMint.toBase58(),
    creator: state.creator.toBase58(),
    migrationProgress: state.migrationProgress,
    migrationStage: stage,
    migrationReady: migrationReady(state, configState),
    lockedVesting: hasLockedVesting(configState),
    isMigrated: Number(state.isMigrated) === 1,
    finishCurveTimestamp: state.finishCurveTimestamp.toString(),
    migrationQuoteThresholdLamports: configState.migrationQuoteThreshold.toString(),
    quoteReserveLamports: state.quoteReserve.toString(),
    progressPercent: Math.round(progress * 10000) / 100,
    dammV2,
  };
}

export async function buildMigrationTransaction(input) {
  if (config.solana.cluster !== "devnet") badRequest("Manual DAMM v2 migration is currently enabled on devnet only.");
  const payer = key(input.payer, "Payer");
  const poolKey = key(input.pool, "Pool");
  const status = await getPoolStatus(poolKey);
  if (!status.migrationReady) badRequest("This DBC pool is not ready for DAMM v2 migration.");
  const dammConfig = key(status.dammV2.config, "DAMM v2 config");
  await dammProgram.account.config.fetch(dammConfig);
  const built = await client.migration.migrateToDammV2({ payer, pool: poolKey, dammConfig });
  const signers = [built.firstPositionNftKeypair, built.secondPositionNftKeypair];
  if (!built.transaction.instructions.some((instruction) => instruction.programId.toBase58() === METEORA_DBC_PROGRAM
    && instruction.keys.some((account) => account.pubkey.equals(poolKey))
    && instruction.keys.some((account) => account.pubkey.toBase58() === status.dammV2.pool)
    && signers.every((signer) => instruction.keys.some((account) => account.pubkey.equals(signer.publicKey) && account.isSigner)))) {
    throw new Error("Meteora SDK returned an unexpected migration transaction.");
  }
  const latest = await connection.getLatestBlockhash(config.solana.commitment);
  built.transaction.feePayer = payer;
  built.transaction.recentBlockhash = latest.blockhash;
  built.transaction.partialSign(...signers);
  return {
    transaction: built.transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64"),
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
    pool: status.pool,
    dammPool: status.dammV2.pool,
    dammConfig: status.dammV2.config,
    positionNftMints: signers.map((signer) => signer.publicKey.toBase58()),
  };
}

export function amountInBaseUnits(value, decimals) {
  const raw = String(value || "").trim();
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`).test(raw)) badRequest(`Amount must be a positive number with at most ${decimals} decimal places.`);
  const [whole, fractional = ""] = raw.split(".");
  const amount = BigInt(whole) * 10n ** BigInt(decimals) + BigInt((fractional + "0".repeat(decimals)).slice(0, decimals));
  if (amount <= 0n || amount > 18_446_744_073_709_551_615n) badRequest("Amount is outside the supported token range.");
  return new BN(amount.toString());
}

function decimalAmount(value, decimals) {
  const digits = value.toString().padStart(decimals + 1, "0");
  const whole = digits.slice(0, -decimals);
  const fractional = digits.slice(-decimals).replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole;
}

export async function quoteDbcSwap(input) {
  const poolKey = key(input.pool, "Pool");
  const direction = String(input.direction || "").toLowerCase();
  if (direction !== "buy" && direction !== "sell") badRequest("Direction must be buy or sell.");
  const slippageBps = Number(input.slippageBps ?? 100);
  if (!Number.isInteger(slippageBps) || slippageBps < 10 || slippageBps > 500) badRequest("Slippage must be between 0.1% and 5%.");
  const virtualPool = await client.state.getPool(poolKey);
  if (!virtualPool) badRequest("DBC pool was not found.");
  const configState = await client.state.getPoolConfig(virtualPool.poolState.config);
  if (!configState) badRequest("DBC config was not found.");
  if (virtualPool.poolState.migrationProgress !== 0) badRequest("DBC trading has ended for this pool.");
  if (!configState.quoteMint.equals(NATIVE_MINT)) badRequest("This trade flow supports SOL quote pools only.");
  const inputDecimals = direction === "buy" ? 9 : configState.tokenDecimal;
  const outputDecimals = direction === "buy" ? configState.tokenDecimal : 9;
  const amountIn = amountInBaseUnits(input.amount, inputDecimals);
  const currentPoint = configState.activationType === ActivationType.Slot
    ? new BN(await connection.getSlot(config.solana.commitment))
    : new BN(Math.floor(Date.now() / 1000));
  const quote = client.pool.swapQuote2({
    virtualPool,
    config: configState,
    swapBaseForQuote: direction === "sell",
    swapMode: SwapMode.ExactIn,
    amountIn,
    slippageBps,
    hasReferral: false,
    eligibleForFirstSwapWithMinFee: false,
    currentPoint,
  });
  if (!quote.minimumAmountOut || quote.minimumAmountOut.lten(0) || quote.outputAmount.lten(0)) badRequest("This amount cannot be quoted on the current curve.");
  return {
    pool: poolKey.toBase58(),
    direction,
    amountIn: amountIn.toString(),
    amountInDisplay: decimalAmount(amountIn, inputDecimals),
    outputAmount: quote.outputAmount.toString(),
    outputAmountDisplay: decimalAmount(quote.outputAmount, outputDecimals),
    minimumAmountOut: quote.minimumAmountOut.toString(),
    minimumAmountOutDisplay: decimalAmount(quote.minimumAmountOut, outputDecimals),
    tradingFee: quote.tradingFee.toString(),
    protocolFee: quote.protocolFee.toString(),
    slippageBps,
    quoteMint: NATIVE_MINT.toBase58(),
    baseMint: virtualPool.poolState.baseMint.toBase58(),
    inputSymbol: direction === "buy" ? "SOL" : "TOKEN",
    outputSymbol: direction === "buy" ? "TOKEN" : "SOL",
    quotedAt: new Date().toISOString(),
  };
}

export async function buildSwapTransaction(input) {
  if (config.solana.cluster !== "devnet") badRequest("DBC trading is currently enabled on devnet only.");
  const owner = key(input.owner, "Owner");
  const quote = await quoteDbcSwap(input);
  const transaction = await client.pool.swap2({
    owner,
    payer: owner,
    pool: key(quote.pool, "Pool"),
    swapBaseForQuote: quote.direction === "sell",
    swapMode: SwapMode.ExactIn,
    amountIn: new BN(quote.amountIn),
    minimumAmountOut: new BN(quote.minimumAmountOut),
    referralTokenAccount: null,
  });
  return { ...(await serializeUnsigned(transaction, owner)), quote };
}
