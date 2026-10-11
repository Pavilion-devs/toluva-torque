const DEFAULT_ACTIONS = {
  launch: "complete the launch",
  trade: "complete the trade",
  migration: "complete the migration",
  quote: "get a current quote",
  wallet: "connect your wallet",
  data: "load live data",
};

export function friendlyError(error, action = "data") {
  const raw = String(error?.message || error || "");
  const message = raw.toLowerCase();

  if (error?.code === "CONFIRMATION_UNKNOWN") {
    return "Your transaction was sent, but we couldn't confirm its result yet. Check its status before trying again.";
  }
  if (error?.code === "BLOCKHASH_EXPIRED" || /blockhash not found|blockhash.*expir|block height exceeded|blockheight exceeded|transactionexpiredblockheight/.test(message)) {
    if (action === "trade") return "The wallet approval expired. Review a fresh quote and try again.";
    if (action === "migration") return "The wallet approval expired. Try the migration again with a new wallet request.";
    return "The wallet approval expired before Solana accepted it. Your completed steps are saved; try again with the button below.";
  }
  if (/user rejected|user declined|rejected the request|request rejected|cancelled by user|canceled by user|4001/.test(message)) {
    return "The wallet request was cancelled. You can try again when you're ready.";
  }
  if (/insufficient funds|insufficient lamports|not enough sol|insufficient balance/.test(message)) {
    return "Your wallet doesn't have enough devnet SOL or tokens for this action. Check your balance and amount, then try again.";
  }
  if (/quote moved|slippage|minimum.*(receive|amount|output)/.test(message)) {
    return "The price changed since your review. Get a fresh quote before signing.";
  }
  if (/wallet.*(not connected|cannot sign|can't sign)|connect.*wallet|no wallet provider/.test(message)) {
    return "Connect a Solana wallet and try again.";
  }
  if (/wallet.*(did not fully sign|did not preserve|changed)|missing.*signature/.test(message)) {
    return "Your wallet couldn't sign this request. Reconnect it and try again.";
  }
  if (/invalid.*amount|amount.*invalid|amount.*positive|excess precision/.test(message)) {
    return "Enter a valid amount and try again.";
  }
  if (/migration.*not ready|not ready.*migration/.test(message)) {
    return "This pool isn't ready to migrate yet. Refresh its status and try again.";
  }
  if (/failed to fetch|fetch failed|networkerror|network request failed|rpc.*unreachable|timeout|timed out|429|503|502/.test(message)) {
    return "Live data is temporarily unavailable. Check your connection and try again in a moment.";
  }
  if (/simulation failed|transaction failed|custom program error|instructionerror/.test(message)) {
    return action === "trade"
      ? "Solana couldn't accept this trade. Review a fresh quote and check your wallet balance before trying again."
      : action === "migration"
        ? "Solana couldn't accept the migration. Refresh the pool status before trying again."
        : "Solana couldn't accept this launch step. Any confirmed steps are saved; try again in a moment.";
  }

  return `We couldn't ${DEFAULT_ACTIONS[action] || DEFAULT_ACTIONS.data} right now. Please try again in a moment.`;
}
