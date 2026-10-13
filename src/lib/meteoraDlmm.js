import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getInjectedWalletProvider } from "./walletAdapter";
import { getJson, postJson } from "./toluvaApi";
import { signAndSendWalletTransaction } from "./solanaTransactionFlow";

const DEVNET_RPC = "https://api.devnet.solana.com";
const DLMM_PROGRAM = new PublicKey("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");

function walletProvider(wallet, message = false) {
  if (!wallet?.connected || wallet.source !== "injected" || !wallet.address) throw new Error("Connect a Solana wallet first.");
  const provider = getInjectedWalletProvider();
  if (!provider?.signTransaction || provider.publicKey?.toString() !== wallet.address || (message && !provider.signMessage)) {
    throw new Error("Reconnect a Solana wallet that can approve this action.");
  }
  return provider;
}

function readTransaction(value, wallet, extraSigner = null) {
  const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  const transaction = Transaction.from(bytes);
  if (!transaction.feePayer?.equals(new PublicKey(wallet.address))
    || !transaction.signatures.some((item) => item.publicKey.toBase58() === wallet.address)
    || (extraSigner && !transaction.signatures.some((item) => item.publicKey.equals(extraSigner.publicKey)))
    || !transaction.instructions.some((instruction) => instruction.programId.equals(DLMM_PROGRAM))) {
    throw new Error("The liquidity transaction differs from the reviewed wallet, position, or Meteora program.");
  }
  return transaction;
}

function connection() {
  return new Connection(import.meta.env.VITE_SOLANA_RPC_URL || DEVNET_RPC, "confirmed");
}

async function approveLink(wallet, dbcPool, dlmmPool, mint, onStage) {
  const provider = walletProvider(wallet, true);
  onStage?.("Review the pool link in your wallet…");
  const challenge = await postJson("/api/meteora/dlmm/link/challenge", { dbcPool, pool: dlmmPool, wallet: wallet.address });
  const expectedMessage = [
    "Toluva DLMM pool link", "Network: devnet", `DBC pool: ${dbcPool}`,
    `Token mint: ${mint}`, `DLMM pool: ${dlmmPool}`, `Creator: ${wallet.address}`,
    `Expires: ${challenge.expiresAt}`,
  ].join("\n");
  if (challenge.pool !== dlmmPool || challenge.wallet !== wallet.address
    || !Number.isInteger(challenge.expiresAt)
    || challenge.expiresAt < Math.floor(Date.now() / 1000)
    || challenge.expiresAt > Math.floor(Date.now() / 1000) + 300
    || challenge.message !== expectedMessage) {
    throw new Error("The pool link differs from the reviewed launch. Nothing was signed.");
  }
  const result = await provider.signMessage(new TextEncoder().encode(challenge.message));
  const bytes = result?.signature || result;
  if (!(bytes instanceof Uint8Array) || bytes.length !== 64) throw new Error("Wallet did not return a valid pool approval.");
  onStage?.("Verifying the linked pool on chain…");
  return postJson("/api/meteora/dlmm/link", {
    dbcPool, wallet: wallet.address, pool: dlmmPool, expiresAt: challenge.expiresAt,
    message: challenge.message, signature: btoa(String.fromCharCode(...bytes)),
  });
}

export async function createAndLinkDlmmPool({ wallet, dbcPool, onStage }) {
  const provider = walletProvider(wallet, true);
  onStage?.("Preparing a DLMM pool at the current DAMM v2 reference price…");
  const built = await postJson("/api/meteora/dlmm/pool/build", { dbcPool, payer: wallet.address });
  const before = await getJson(`/api/meteora/dlmm/plan?dbcPool=${encodeURIComponent(dbcPool)}`);
  if (built.programId !== DLMM_PROGRAM.toBase58() || built.plan.address !== before.plan.address
    || built.plan.referencePool !== before.plan.referencePool
    || built.plan.activeId !== before.plan.activeId || built.plan.exists) {
    throw new Error("The liquidity pool plan changed. Refresh and review it again.");
  }
  const transaction = readTransaction(built.transaction, wallet);
  onStage?.("Approve the new DLMM pool in your wallet…");
  const signature = await signAndSendWalletTransaction({ connection: connection(), provider, transaction });
  const linked = await approveLink(wallet, dbcPool, built.plan.address, built.plan.tokenX, onStage);
  return { signature, pool: built.plan.address, launch: linked.launch };
}

export async function linkExistingDlmmPool({ wallet, dbcPool, dlmmPool, onStage }) {
  const result = await getJson(`/api/meteora/dlmm/plan?dbcPool=${encodeURIComponent(dbcPool)}`);
  if (!result.plan.exists || result.plan.address !== dlmmPool) throw new Error("Refresh this launch and review its DLMM pool again.");
  return approveLink(wallet, dbcPool, dlmmPool, result.plan.tokenX, onStage);
}

export async function prepareDlmmLiquidity({ wallet, dbcPool, dlmmPool, baseAmount, quoteAmount, onStage }) {
  walletProvider(wallet);
  const signer = Keypair.generate();
  onStage?.("Preparing your DLMM position…");
  const built = await postJson("/api/meteora/dlmm/position/build", {
    dbcPool, wallet: wallet.address, position: signer.publicKey.toBase58(), baseAmount, quoteAmount,
  });
  if (built.programId !== DLMM_PROGRAM.toBase58() || built.pool !== dlmmPool
    || built.position !== signer.publicKey.toBase58()
    || built.baseAmount !== baseAmount || built.quoteAmount !== quoteAmount) {
    throw new Error("The liquidity position differs from the reviewed amounts. Nothing was signed.");
  }
  const transaction = readTransaction(built.transaction, wallet, signer);
  return {
    transaction, signer, walletAddress: wallet.address, pool: dlmmPool,
    position: signer.publicKey.toBase58(), baseAmount, quoteAmount,
    minBinId: built.minBinId, maxBinId: built.maxBinId,
  };
}

export async function signPreparedDlmmLiquidity({ wallet, prepared, onStage }) {
  const provider = walletProvider(wallet);
  if (prepared.walletAddress !== wallet.address || !prepared.transaction.feePayer?.equals(new PublicKey(wallet.address))) {
    throw new Error("The connected wallet changed. Review the deposit again.");
  }
  onStage?.("Approve your DLMM liquidity deposit in your wallet…");
  const signature = await signAndSendWalletTransaction({
    connection: connection(), provider, transaction: prepared.transaction, extraSigners: [prepared.signer],
  });
  return { signature, position: prepared.position, pool: prepared.pool };
}

export async function prepareDlmmWithdrawal({ wallet, dbcPool, dlmmPool, position, onStage }) {
  walletProvider(wallet);
  onStage?.("Preparing your position withdrawal…");
  const built = await postJson("/api/meteora/dlmm/position/remove/build", {
    dbcPool, wallet: wallet.address, position,
  });
  if (built.pool !== dlmmPool || built.position !== position || built.wallet !== wallet.address
    || built.withdrawBps !== 10_000 || built.closePosition !== true
    || !Array.isArray(built.transactions) || !built.transactions.length
    || built.transactions.some((item) => item.programId !== DLMM_PROGRAM.toBase58())) {
    throw new Error("The withdrawal differs from the selected position. Nothing was signed.");
  }
  return {
    walletAddress: wallet.address, pool: dlmmPool, position,
    transactions: built.transactions.map((item) => readTransaction(item.transaction, wallet)),
  };
}

export async function signPreparedDlmmWithdrawal({ wallet, prepared, onStage }) {
  const provider = walletProvider(wallet);
  if (prepared.walletAddress !== wallet.address || prepared.transactions.some((transaction) =>
    !transaction.feePayer?.equals(new PublicKey(wallet.address)))) {
    throw new Error("The connected wallet changed. Review the withdrawal again.");
  }
  const signatures = [];
  for (let index = 0; index < prepared.transactions.length; index += 1) {
    onStage?.(`Approve withdrawal step ${index + 1} of ${prepared.transactions.length} in your wallet…`);
    try {
      signatures.push(await signAndSendWalletTransaction({
        connection: connection(), provider, transaction: prepared.transactions[index],
      }));
    } catch (error) {
      error.completedSignatures = signatures;
      throw error;
    }
  }
  return { signatures, position: prepared.position, pool: prepared.pool };
}
