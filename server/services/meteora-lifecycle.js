export function migrationStage(state, thresholdLamports) {
  const progress = Number(state.migrationProgress);
  const finished = BigInt(state.quoteReserve.toString()) >= BigInt(thresholdLamports.toString());
  if (progress === 3) return "created-pool";
  if (progress === 2) return "locked-vesting";
  if (progress === 1) return "post-bonding";
  if (progress === 0) return finished ? "curve-complete" : "bonding";
  return "unknown";
}

export function hasLockedVesting(config) {
  const vesting = config.lockedVestingConfig;
  if (!vesting) return false;
  return ["amountPerPeriod", "cliffUnlockAmount"].some((field) => BigInt(vesting[field]?.toString() || "0") > 0n);
}

export function migrationReady(state, config) {
  const stage = migrationStage(state, config.migrationQuoteThreshold);
  return Number(config.migrationOption) === 1
    && !hasLockedVesting(config)
    && Number(state.isMigrated) === 0
    && BigInt(state.quoteReserve.toString()) >= BigInt(config.migrationQuoteThreshold.toString())
    && (stage === "curve-complete" || stage === "locked-vesting");
}
