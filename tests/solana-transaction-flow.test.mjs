import test from "node:test";
import assert from "node:assert/strict";
import bs58 from "bs58";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
  ExpiredTransactionError,
  UnconfirmedTransactionError,
  signAndSendWalletTransaction,
} from "../src/lib/solanaTransactionFlow.js";
import { friendlyError } from "../src/lib/userErrors.js";

function blockhash() { return Keypair.generate().publicKey.toBase58(); }

function unsignedTransaction(wallet, extraSigner) {
  const transaction = new Transaction({ feePayer: wallet.publicKey, recentBlockhash: blockhash() });
  transaction.add(SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: extraSigner?.publicKey || Keypair.generate().publicKey,
    lamports: 1,
  }));
  if (extraSigner) {
    transaction.add(SystemProgram.transfer({
      fromPubkey: extraSigner.publicKey,
      toPubkey: wallet.publicKey,
      lamports: 1,
    }));
  }
  return transaction;
}

function walletProvider(wallet) {
  return { async signTransaction(transaction) { transaction.partialSign(wallet); return transaction; } };
}

test("unsigned launch transactions receive a fresh blockhash before both signatures", async () => {
  const wallet = Keypair.generate();
  const config = Keypair.generate();
  const transaction = unsignedTransaction(wallet, config);
  const staleHash = transaction.recentBlockhash;
  const freshHash = blockhash();
  let sent;
  const connection = {
    async getLatestBlockhashAndContext() { return { context: { slot: 100 }, value: { blockhash: freshHash, lastValidBlockHeight: 500 } }; },
    async getBlockHeight() { return 450; },
    async sendRawTransaction(raw, options) { sent = { transaction: Transaction.from(raw), options }; return "launch-signature"; },
    async confirmTransaction(strategy) { assert.deepEqual(strategy, { signature: "launch-signature", blockhash: freshHash, lastValidBlockHeight: 500 }); return { value: { err: null } }; },
  };
  const signature = await signAndSendWalletTransaction({ connection, provider: walletProvider(wallet), transaction, extraSigners: [config] });
  assert.equal(signature, "launch-signature");
  assert.notEqual(sent.transaction.recentBlockhash, staleHash);
  assert.equal(sent.transaction.recentBlockhash, freshHash);
  assert.equal(sent.transaction.verifySignatures(), true);
  assert.equal(sent.options.minContextSlot, 100);
});

test("pre-signed migration transactions retain their original blockhash and signer", async () => {
  const wallet = Keypair.generate();
  const nftSigner = Keypair.generate();
  const transaction = unsignedTransaction(wallet, nftSigner);
  const originalHash = transaction.recentBlockhash;
  transaction.partialSign(nftSigner);
  const connection = {
    async getLatestBlockhashAndContext() { throw new Error("must not refresh a pre-signed transaction"); },
    async getBlockHeight() { return 400; },
    async sendRawTransaction(raw) { assert.equal(Transaction.from(raw).verifySignatures(), true); return "migration-signature"; },
    async confirmTransaction(strategy) { assert.equal(strategy.blockhash, originalHash); return { value: { err: null } }; },
  };
  assert.equal(await signAndSendWalletTransaction({
    connection, provider: walletProvider(wallet), transaction,
    lastValidBlockHeight: 500, refreshBlockhash: false,
  }), "migration-signature");
});

test("expired approval stops before broadcasting", async () => {
  const wallet = Keypair.generate();
  let sent = false;
  const connection = {
    async getLatestBlockhashAndContext() { return { context: { slot: 100 }, value: { blockhash: blockhash(), lastValidBlockHeight: 500 } }; },
    async getBlockHeight() { return 500; },
    async sendRawTransaction() { sent = true; },
  };
  await assert.rejects(signAndSendWalletTransaction({ connection, provider: walletProvider(wallet), transaction: unsignedTransaction(wallet) }), ExpiredTransactionError);
  assert.equal(sent, false);
});

test("uncertain broadcast retains the signed transaction ID for chain lookup", async () => {
  const wallet = Keypair.generate();
  let sentSignature;
  const connection = {
    async getLatestBlockhashAndContext() { return { context: { slot: 100 }, value: { blockhash: blockhash(), lastValidBlockHeight: 500 } }; },
    async getBlockHeight() { return 450; },
    async sendRawTransaction(raw) { sentSignature = bs58.encode(Transaction.from(raw).signature); throw new Error("fetch failed"); },
  };
  await assert.rejects(signAndSendWalletTransaction({ connection, provider: walletProvider(wallet), transaction: unsignedTransaction(wallet) }), (error) => {
    assert.ok(error instanceof UnconfirmedTransactionError);
    assert.equal(error.signature, sentSignature);
    return true;
  });
});

test("uncertain confirmation keeps the RPC transaction ID", async () => {
  const wallet = Keypair.generate();
  const connection = {
    async getLatestBlockhashAndContext() { return { context: { slot: 100 }, value: { blockhash: blockhash(), lastValidBlockHeight: 500 } }; },
    async getBlockHeight() { return 450; },
    async sendRawTransaction() { return "submitted-signature"; },
    async confirmTransaction() { throw new Error("RPC timeout"); },
  };
  await assert.rejects(signAndSendWalletTransaction({ connection, provider: walletProvider(wallet), transaction: unsignedTransaction(wallet) }), (error) => {
    assert.ok(error instanceof UnconfirmedTransactionError);
    assert.equal(error.signature, "submitted-signature");
    return true;
  });
});

test("public errors explain recovery without exposing RPC or simulation details", () => {
  assert.match(friendlyError(new Error("Simulation failed. Message: Transaction simulation failed: Blockhash not found. Logs: []"), "launch"), /try again/i);
  assert.doesNotMatch(friendlyError(new Error("Simulation failed. Message: Transaction simulation failed: Blockhash not found. Logs: []"), "launch"), /simulation|blockhash|logs/i);
  assert.match(friendlyError(new Error("Minimum context slot has not been reached"), "launch"), /try again/i);
  assert.match(friendlyError(new Error("fetch failed"), "data"), /temporarily unavailable/i);
  assert.match(friendlyError(new Error("User rejected the request"), "wallet"), /cancelled/i);
  assert.match(friendlyError({ code: "CONFIRMATION_UNKNOWN" }, "trade"), /check its status/i);
});
