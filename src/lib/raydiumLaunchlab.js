import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { getInjectedWalletProvider } from "./walletAdapter";
import { postJson } from "./toluvaApi";

const DEVNET_RPC = "https://api.devnet.solana.com";
const MIN_CREATOR_LAMPORTS = 50_000_000;

function createDiagnostics(wallet, rpcUrl) {
  return {
    stage: "init",
    rpcUrl,
    wallet: wallet?.address || null,
    walletSource: wallet?.source || null,
    provider: null,
    balanceSol: null,
    mint: null,
    build: null,
    transaction: null,
    simulation: null,
    phantom: null,
    send: null,
  };
}

function publicKeyList(transaction) {
  return (transaction.message?.staticAccountKeys || []).map((key) => key.toBase58());
}

function requiredSignerPubkeys(transaction) {
  if (!transaction.message?.staticAccountKeys || !transaction.message?.header) {
    return [];
  }

  return transaction.message.staticAccountKeys
    .slice(0, transaction.message.header.numRequiredSignatures)
    .map((key) => key.toBase58());
}

function throwWithDiagnostics(message, diagnostics) {
  const error = new Error(message);
  error.diagnostics = diagnostics;
  throw error;
}

function transactionFromBase64(base64) {
  return VersionedTransaction.deserialize(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
}

function assertInjectedSigner(wallet) {
  if (!wallet?.address || wallet.source !== "injected") {
    throw new Error("Connect an injected Solana wallet before launching on Raydium devnet.");
  }

  const provider = getInjectedWalletProvider();

  if (!provider?.signTransaction) {
    throw new Error("Connected wallet does not expose signTransaction.");
  }

  return provider;
}

const ATA_RENT_LAMPORTS = 2_039_280;
const FEE_BUFFER_LAMPORTS = 1_000_000;

function simulationErrorMessage(simulation) {
  const err = simulation?.value?.err;
  const logs = simulation?.value?.logs || [];

  if (!err) {
    return null;
  }

  const insufficientMatch = logs.join(" ").match(/insufficient lamports (\d+), need (\d+)/);
  if (insufficientMatch) {
    const has = (Number(insufficientMatch[1]) / 1_000_000_000).toFixed(4);
    const need = (Number(insufficientMatch[2]) / 1_000_000_000).toFixed(4);
    return `Insufficient devnet SOL: wallet has ${has} SOL but this transaction needs ${need} SOL. Top up your devnet wallet or choose a smaller amount.`;
  }

  return `Raydium transaction simulation failed: ${JSON.stringify(err)}`;
}

async function assertDevnetWalletReady(connection, address, diagnostics, requiredLamports = MIN_CREATOR_LAMPORTS) {
  const pubkey = new PublicKey(address);
  diagnostics.stage = "wallet_check";
  const account = await connection.getAccountInfo(pubkey, "confirmed");

  if (!account) {
    throwWithDiagnostics(
      "This wallet has no devnet SOL account yet. Switch Phantom to Solana devnet and fund this wallet with devnet SOL before launching.",
      diagnostics,
    );
  }

  diagnostics.balanceSol = account.lamports / 1_000_000_000;
  const needed = Math.max(MIN_CREATOR_LAMPORTS, requiredLamports);

  if (account.lamports < needed) {
    const hasSol = (account.lamports / 1_000_000_000).toFixed(4);
    const needSol = (needed / 1_000_000_000).toFixed(4);
    throwWithDiagnostics(
      `Insufficient devnet SOL: wallet has ${hasSol} SOL but this transaction needs ~${needSol} SOL. Top up your devnet wallet or choose a smaller amount.`,
      diagnostics,
    );
  }
}

async function assertTransactionSimulates(connection, transaction, diagnostics) {
  diagnostics.stage = "simulate_local";
  const simulation = await connection.simulateTransaction(transaction, {
    sigVerify: false,
    replaceRecentBlockhash: true,
  });
  diagnostics.simulation = {
    err: simulation.value?.err || null,
    logs: simulation.value?.logs || [],
    unitsConsumed: simulation.value?.unitsConsumed || null,
  };
  const message = simulationErrorMessage(simulation);

  if (message) {
    throwWithDiagnostics(message, diagnostics);
  }
}

export async function launchDevnetToken({ wallet, launch }) {
  const provider = assertInjectedSigner(wallet);
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || DEVNET_RPC;
  const diagnostics = createDiagnostics(wallet, rpcUrl);
  diagnostics.provider = {
    isPhantom: Boolean(provider.isPhantom),
    isBackpack: Boolean(provider.isBackpack),
    isSolflare: Boolean(provider.isSolflare),
    publicKey: provider.publicKey?.toString?.() || null,
  };
  const connection = new Connection(rpcUrl, "confirmed");

  await assertDevnetWalletReady(connection, wallet.address, diagnostics);

  diagnostics.stage = "generate_mint";
  const mint = Keypair.generate();
  diagnostics.mint = mint.publicKey.toBase58();
  diagnostics.stage = "build_transaction";
  const build = await postJson("/api/raydium/launches/build-transaction", {
    ...launch,
    creatorWallet: wallet.address,
    mintA: mint.publicKey.toBase58(),
  });
  const [builtTransaction] = build.transactions || [];
  diagnostics.build = {
    readyToSubmit: build.readyToSubmit,
    mode: build.mode,
    poolId: build.extInfo?.poolId || build.derivedAddresses?.poolId || null,
    requiredSigners: builtTransaction?.requiredSigners || [],
    instructionTypes: build.instructionTypes || [],
    derivedAddresses: build.derivedAddresses || null,
  };

  if (!build.readyToSubmit || !builtTransaction?.base64) {
    throwWithDiagnostics("Raydium transaction was not ready to submit.", diagnostics);
  }

  diagnostics.stage = "deserialize_transaction";
  const transaction = transactionFromBase64(builtTransaction.base64);
  diagnostics.transaction = {
    version: transaction.version,
    requiredSigners: requiredSignerPubkeys(transaction),
    accountKeys: publicKeyList(transaction),
    instructions: transaction.message?.compiledInstructions?.length || 0,
  };

  if (!diagnostics.transaction.requiredSigners.includes(wallet.address)) {
    throwWithDiagnostics("Built transaction does not list the connected wallet as a required signer.", diagnostics);
  }

  if (!diagnostics.transaction.requiredSigners.includes(mint.publicKey.toBase58())) {
    throwWithDiagnostics("Built transaction does not list the generated mint as a required signer.", diagnostics);
  }

  diagnostics.stage = "sign_mint";
  transaction.sign([mint]);

  await assertTransactionSimulates(connection, transaction, diagnostics);

  let signed;
  try {
    diagnostics.stage = "phantom_sign";
    signed = await provider.signTransaction(transaction);
    diagnostics.phantom = { signed: true };
  } catch (error) {
    diagnostics.phantom = {
      signed: false,
      name: error?.name || null,
      code: error?.code ?? null,
      message: error?.message || String(error),
    };
    throwWithDiagnostics(`Wallet rejected or blocked signing: ${diagnostics.phantom.message}`, diagnostics);
  }

  let signature;
  try {
    diagnostics.stage = "send_transaction";
    signature = await connection.sendRawTransaction(signed.serialize(), {
      maxRetries: 3,
      skipPreflight: false,
    });
    diagnostics.send = { signature };
  } catch (error) {
    diagnostics.send = {
      message: error?.message || String(error),
      logs: error?.logs || [],
    };
    throwWithDiagnostics(`Devnet send failed: ${diagnostics.send.message}`, diagnostics);
  }

  diagnostics.stage = "confirm_transaction";
  await connection.confirmTransaction(signature, "confirmed");

  const poolId = build.extInfo?.poolId || build.derivedAddresses?.poolId;
  const launchRecord = await postJson("/api/launches", {
    sym: launch.symbol,
    name: launch.name,
    description: launch.description || "",
    image: launch.image || null,
    status: "bonding",
    bonded: 0,
    campaign: null,
    buyers: 0,
    pool: poolId,
    age: "now",
    migrationTime: "New",
    migrationState: "bonding",
    creator: wallet.address,
    raydium: {
      cluster: "devnet",
      mint: mint.publicKey.toBase58(),
      poolId,
      signature,
    },
  });

  const eventReceipt = await postJson("/api/events", {
    type: "token_launch_created",
    token: launch.symbol,
    wallet: wallet.address,
    launchId: launchRecord.launch?.sym || launch.symbol,
    payload: {
      poolState: poolId,
      verified: true,
    },
  });

  return {
    signature,
    mint: mint.publicKey.toBase58(),
    poolId,
    build,
    diagnostics,
    launch: launchRecord.launch,
    event: eventReceipt.event,
  };
}

export async function buyDevnetToken({ wallet, launch, buyAmount }) {
  const provider = assertInjectedSigner(wallet);
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || DEVNET_RPC;
  const diagnostics = createDiagnostics(wallet, rpcUrl);
  diagnostics.provider = {
    isPhantom: Boolean(provider.isPhantom),
    isBackpack: Boolean(provider.isBackpack),
    isSolflare: Boolean(provider.isSolflare),
    hasSignTransaction: Boolean(provider.signTransaction),
  };
  diagnostics.stage = "buy_init";

  const connection = new Connection(rpcUrl, "confirmed");
  const mintA = launch.raydium?.mint;
  const poolId = launch.raydium?.poolId || launch.pool;

  if (!mintA || !poolId) {
    throwWithDiagnostics("This launch is missing Raydium mint or pool data.", diagnostics);
  }

  const requiredLamports = Number(buyAmount) + ATA_RENT_LAMPORTS + FEE_BUFFER_LAMPORTS;
  await assertDevnetWalletReady(connection, wallet.address, diagnostics, requiredLamports);

  diagnostics.stage = "build_buy_transaction";
  const build = await postJson("/api/raydium/launches/build-buy-transaction", {
    buyerWallet: wallet.address,
    mintA,
    buyAmount,
  });
  diagnostics.build = {
    mode: build.mode,
    readyToSubmit: build.readyToSubmit,
    transactionCount: build.transactions?.length || 0,
    extInfo: build.extInfo || null,
  };

  if (!build.readyToSubmit || !build.transactions?.length) {
    throwWithDiagnostics("Raydium buy transaction was not ready to submit.", diagnostics);
  }

  const signatures = [];

  for (const builtTransaction of build.transactions) {
    diagnostics.stage = `deserialize_buy_transaction_${builtTransaction.index}`;
    const transaction = transactionFromBase64(builtTransaction.base64);
    diagnostics.transaction = {
      version: transaction.version,
      requiredSigners: requiredSignerPubkeys(transaction),
      accountKeys: publicKeyList(transaction),
    };

    await assertTransactionSimulates(connection, transaction, diagnostics);

    diagnostics.stage = `wallet_sign_buy_transaction_${builtTransaction.index}`;
    let signed;

    try {
      signed = await provider.signTransaction(transaction);
    } catch (error) {
      diagnostics.phantom = {
        name: error?.name || null,
        message: error?.message || String(error),
        code: error?.code || null,
      };
      throwWithDiagnostics(error?.message || "Wallet rejected the buy transaction.", diagnostics);
    }

    diagnostics.stage = `send_buy_transaction_${builtTransaction.index}`;
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      maxRetries: 3,
      skipPreflight: false,
    });

    diagnostics.send = { signature };
    diagnostics.stage = `confirm_buy_transaction_${builtTransaction.index}`;
    await connection.confirmTransaction(signature, "confirmed");
    signatures.push(signature);
  }

  const finalSignature = signatures[signatures.length - 1];
  diagnostics.stage = "record_buy_event";
  const eventReceipt = await postJson(`/api/launches/${encodeURIComponent(launch.sym)}/buy-events`, {
    wallet: wallet.address,
    poolState: poolId,
    amount: Number(buyAmount),
    amountUsd: 0,
    txSignature: finalSignature,
  });

  return {
    signatures,
    signature: finalSignature,
    build,
    diagnostics,
    event: eventReceipt.event,
    torque: eventReceipt.torque,
  };
}
