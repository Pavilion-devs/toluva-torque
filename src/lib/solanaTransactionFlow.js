import bs58 from "bs58";

export class ExpiredTransactionError extends Error {
  constructor() {
    super("The transaction expired before it could be submitted.");
    this.name = "ExpiredTransactionError";
    this.code = "BLOCKHASH_EXPIRED";
  }
}

export class UnconfirmedTransactionError extends Error {
  constructor(signature, cause) {
    super("The transaction was sent, but its result could not be confirmed.", { cause });
    this.name = "UnconfirmedTransactionError";
    this.code = "CONFIRMATION_UNKNOWN";
    this.signature = signature;
  }
}

// Launch and swap builders return unsigned transactions. Replace the builder's
// blockhash immediately before wallet approval so server work does not spend
// the short Solana validity window. Migration transactions contain server-side
// signer signatures, so callers must keep their original blockhash instead.
export async function signAndSendWalletTransaction({
  connection,
  provider,
  transaction,
  lastValidBlockHeight,
  extraSigners = [],
  refreshBlockhash = true,
}) {
  let validity = { blockhash: transaction.recentBlockhash, lastValidBlockHeight };
  let minContextSlot;

  if (refreshBlockhash) {
    const latest = await connection.getLatestBlockhashAndContext("confirmed");
    validity = latest.value;
    minContextSlot = latest.context.slot;
    transaction.recentBlockhash = validity.blockhash;
  }

  if (!validity.blockhash || !Number.isInteger(validity.lastValidBlockHeight)) {
    throw new Error("A valid Solana blockhash was not available.");
  }
  if (extraSigners.length) transaction.partialSign(...extraSigners);

  const signed = await provider.signTransaction(transaction);
  if (signed.recentBlockhash !== validity.blockhash || !signed.verifySignatures()) {
    throw new Error("The wallet changed or did not fully sign the transaction.");
  }
  const currentBlockHeight = await connection.getBlockHeight("confirmed");
  if (currentBlockHeight >= validity.lastValidBlockHeight) throw new ExpiredTransactionError();

  const signedSignature = signed.signature ? bs58.encode(signed.signature) : null;
  let signature;
  try {
    signature = await connection.sendRawTransaction(signed.serialize(), {
      maxRetries: 3,
      skipPreflight: false,
      ...(minContextSlot === undefined ? {} : { minContextSlot }),
    });
  } catch (cause) {
    // A network failure can happen after the RPC receives the signed bytes.
    // Keep the signature so the user can check the chain before signing again.
    if (signedSignature && /fetch|network|timeout|timed out|connection|503|502/i.test(String(cause?.message || cause))) {
      throw new UnconfirmedTransactionError(signedSignature, cause);
    }
    throw cause;
  }
  let confirmation;
  try {
    confirmation = await connection.confirmTransaction({ signature, ...validity }, "confirmed");
  } catch (cause) {
    throw new UnconfirmedTransactionError(signature, cause);
  }
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }
  return signature;
}
