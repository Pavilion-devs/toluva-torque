import { ComputeBudgetProgram, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getInjectedWalletProvider } from "./walletAdapter";
import { postJson } from "./toluvaApi";

const DEVNET_RPC = "https://api.devnet.solana.com";
const DBC_PROGRAM = new PublicKey("dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN");

function transactionFromBase64(value) {
  return Transaction.from(Uint8Array.from(atob(value), (character) => character.charCodeAt(0)));
}

function assertBuiltTransaction(transaction, walletAddress, extraSigner) {
  const wallet = new PublicKey(walletAddress);
  if (!transaction.feePayer?.equals(wallet)) throw new Error("Transaction fee payer differs from the connected wallet.");
  if (!transaction.signatures.some(({ publicKey }) => publicKey.equals(wallet))) throw new Error("Connected wallet is not a required signer.");
  if (!transaction.signatures.some(({ publicKey }) => publicKey.equals(extraSigner.publicKey))) throw new Error("Generated account is not a required signer.");
  if (!transaction.instructions.some(({ programId }) => programId.equals(DBC_PROGRAM))) throw new Error("Transaction does not invoke Meteora DBC.");
}

async function signAndSend(connection, provider, walletAddress, built, extraSigner) {
  const transaction = transactionFromBase64(built.transaction);
  assertBuiltTransaction(transaction, walletAddress, extraSigner);
  transaction.partialSign(extraSigner);
  const signed = await provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3, skipPreflight: false });
  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash: built.blockhash,
    lastValidBlockHeight: built.lastValidBlockHeight,
  }, "confirmed");
  if (confirmation.value.err) throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  return signature;
}

export async function launchMeteoraToken({ wallet, launch, configAddress, onConfigConfirmed, onPoolConfirmed, onStage }) {
  if (!wallet?.address || wallet.source !== "injected") throw new Error("Connect a Solana wallet to launch a token.");
  const provider = getInjectedWalletProvider();
  if (!provider?.signTransaction || provider.publicKey?.toString() !== wallet.address) {
    throw new Error("The connected wallet cannot sign this launch. Reconnect your wallet.");
  }
  const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL || DEVNET_RPC, "confirmed");
  let selectedConfig = configAddress || null;
  let configSignature = null;

  if (!selectedConfig) {
    onStage?.("Building your DBC configuration…");
    const configSigner = Keypair.generate();
    const builtConfig = await postJson("/api/meteora/config/build", {
      payer: wallet.address,
      config: configSigner.publicKey.toBase58(),
      migrationThresholdSol: launch.migrationThresholdSol,
    });
    if (builtConfig.config !== configSigner.publicKey.toBase58() || builtConfig.terms?.feeClaimer !== wallet.address) {
      throw new Error("Config transaction does not match the disclosed creator terms.");
    }
    onStage?.("Approve the DBC configuration in your wallet…");
    configSignature = await signAndSend(connection, provider, wallet.address, builtConfig, configSigner);
    selectedConfig = builtConfig.config;
    onConfigConfirmed?.({ address: selectedConfig, signature: configSignature, terms: builtConfig.terms });
  }

  onStage?.("Building your token pool…");
  const mintSigner = Keypair.generate();
  const builtPool = await postJson("/api/meteora/pool/build", {
    payer: wallet.address,
    config: selectedConfig,
    baseMint: mintSigner.publicKey.toBase58(),
    name: launch.name,
    symbol: launch.symbol,
    uri: launch.uri,
    migrationThresholdSol: launch.migrationThresholdSol,
  });
  if (builtPool.config !== selectedConfig || builtPool.mint !== mintSigner.publicKey.toBase58()) {
    throw new Error("Pool transaction does not match the selected config and mint.");
  }
  if (builtPool.onchainConfig?.feeClaimer !== wallet.address
      || builtPool.onchainConfig?.leftoverReceiver !== wallet.address
      || builtPool.onchainConfig?.migrationQuoteThreshold !== String(Math.round(Number(launch.migrationThresholdSol) * 1_000_000_000))) {
    throw new Error("On-chain launch terms differ from the review. Do not sign this pool.");
  }
  onStage?.("Approve the token launch in your wallet…");
  const signature = await signAndSend(connection, provider, wallet.address, builtPool, mintSigner);
  const proof = {
    signature,
    config: selectedConfig,
    mint: builtPool.mint,
    pool: builtPool.pool,
    creator: wallet.address,
    name: launch.name,
    symbol: launch.symbol,
    uri: launch.uri,
  };
  onPoolConfirmed?.(proof);
  onStage?.("Confirming the launch in Toluva…");
  const { launch: registered } = await postJson("/api/meteora/launches", proof);
  return { ...proof, configSignature, launch: registered };
}

export async function registerConfirmedMeteoraLaunch(proof) {
  return postJson("/api/meteora/launches", proof);
}

export async function tradeMeteoraToken({ wallet, reviewedQuote }) {
  if (!wallet?.address || wallet.source !== "injected") throw new Error("Connect a Solana wallet before trading.");
  const provider = getInjectedWalletProvider();
  if (!provider?.signTransaction || provider.publicKey?.toString() !== wallet.address) throw new Error("Reconnect the wallet used for this trade.");
  const built = await postJson("/api/meteora/swap/build", {
    owner: wallet.address,
    pool: reviewedQuote.pool,
    direction: reviewedQuote.direction,
    amount: reviewedQuote.amountInDisplay,
    slippageBps: reviewedQuote.slippageBps,
  });
  if (built.quote.pool !== reviewedQuote.pool
      || built.quote.direction !== reviewedQuote.direction
      || built.quote.amountIn !== reviewedQuote.amountIn
      || BigInt(built.quote.outputAmount) < BigInt(reviewedQuote.minimumAmountOut)) {
    throw new Error("The quote moved beyond your review. Get a fresh quote before signing.");
  }
  const transaction = transactionFromBase64(built.transaction);
  const walletKey = new PublicKey(wallet.address);
  if (!transaction.feePayer?.equals(walletKey)
      || !transaction.signatures.some(({ publicKey }) => publicKey.equals(walletKey))
      || !transaction.instructions.some(({ programId }) => programId.equals(DBC_PROGRAM))) {
    throw new Error("Trade transaction does not match your wallet and DBC pool.");
  }
  const signed = await provider.signTransaction(transaction);
  const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL || DEVNET_RPC, "confirmed");
  const signature = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3, skipPreflight: false });
  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash: built.blockhash,
    lastValidBlockHeight: built.lastValidBlockHeight,
  }, "confirmed");
  if (confirmation.value.err) throw new Error(`Trade failed: ${JSON.stringify(confirmation.value.err)}`);
  return { signature, quote: built.quote };
}

export async function migrateMeteoraPool({ wallet, status }) {
  if (!wallet?.address || wallet.source !== "injected") throw new Error("Connect a Solana wallet before migrating.");
  if (!status?.migrationReady || !status?.dammV2?.pool) throw new Error("Refresh the pool status before migrating.");
  const provider = getInjectedWalletProvider();
  if (!provider?.signTransaction || provider.publicKey?.toString() !== wallet.address) throw new Error("Reconnect your Solana wallet.");
  const built = await postJson("/api/meteora/migration/build", { payer: wallet.address, pool: status.pool });
  if (built.pool !== status.pool || built.dammPool !== status.dammV2.pool || built.dammConfig !== status.dammV2.config) {
    throw new Error("The migration destination changed. Refresh before signing.");
  }
  const transaction = transactionFromBase64(built.transaction);
  const walletKey = new PublicKey(wallet.address);
  const migrationInstructions = transaction.instructions.filter(({ programId }) => programId.equals(DBC_PROGRAM));
  const ix = migrationInstructions[0];
  const expectedDiscriminator = [156, 169, 230, 103, 53, 228, 80, 64];
  if (!transaction.feePayer?.equals(walletKey)
      || !transaction.signatures.some(({ publicKey }) => publicKey.equals(walletKey))
      || migrationInstructions.length !== 1
      || transaction.instructions.some(({ programId }) => !programId.equals(DBC_PROGRAM) && !programId.equals(ComputeBudgetProgram.programId))
      || !expectedDiscriminator.every((byte, index) => ix.data[index] === byte)
      || ix.keys[0]?.pubkey.toBase58() !== status.pool
      || ix.keys[4]?.pubkey.toBase58() !== status.dammV2.pool
      || ix.keys[19]?.pubkey.toBase58() !== wallet.address
      || !ix.keys.some(({ pubkey }) => pubkey.toBase58() === status.dammV2.config)
      || built.positionNftMints?.length !== 2
      || ix.keys[5]?.pubkey.toBase58() !== built.positionNftMints[0]
      || ix.keys[8]?.pubkey.toBase58() !== built.positionNftMints[1]
      || !built.positionNftMints.every((mint) => transaction.signatures.some(({ publicKey, signature }) => publicKey.toBase58() === mint && signature))) {
    throw new Error("Migration transaction differs from the reviewed pool and signer accounts.");
  }
  const signed = await provider.signTransaction(transaction);
  if (!signed.verifySignatures()) throw new Error("The wallet did not preserve all required migration signatures.");
  const connection = new Connection(import.meta.env.VITE_SOLANA_RPC_URL || DEVNET_RPC, "confirmed");
  const signature = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3, skipPreflight: false });
  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash: built.blockhash,
    lastValidBlockHeight: built.lastValidBlockHeight,
  }, "confirmed");
  if (confirmation.value.err) throw new Error(`Migration failed: ${JSON.stringify(confirmation.value.err)}`);
  return { signature, dammPool: built.dammPool, positionNftMints: built.positionNftMints };
}
