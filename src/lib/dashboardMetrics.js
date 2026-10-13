const LAMPORTS_PER_SOL = 1_000_000_000n;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function verifiedDbcTrades(registry) {
  const launches = new Map((registry.launches || [])
    .filter((launch) => launch.dbc?.pool && launch.dbc?.mint)
    .map((launch) => [launch.sym, launch]));
  const seen = new Set();

  return (registry.eventReceipts || []).flatMap((event) => {
    const direction = event.type === "dbc_buy_verified" ? "buy"
      : event.type === "dbc_sell_verified" ? "sell" : null;
    const launch = launches.get(event.token);
    const payload = event.payload || {};
    const timestamp = validDate(event.createdAt);
    if (!direction || event.status !== "finalized" || !launch || !timestamp
      || payload.direction !== direction || payload.pool !== launch.dbc.pool
      || payload.mint !== launch.dbc.mint || !payload.signature
      || payload.commitment !== "finalized" || seen.has(payload.signature)) return [];

    let lamports;
    try { lamports = BigInt(payload.quoteLamports); } catch { return []; }
    if (lamports <= 0n) return [];
    seen.add(payload.signature);
    return [{
      id: event.id || payload.signature,
      direction,
      symbol: launch.dbc.symbol,
      signature: payload.signature,
      wallet: event.wallet,
      createdAt: timestamp.toISOString(),
      amountSol: Number(lamports / LAMPORTS_PER_SOL)
        + Number(lamports % LAMPORTS_PER_SOL) / Number(LAMPORTS_PER_SOL),
    }];
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function sevenDayTradeVolume(trades, now = new Date()) {
  const current = validDate(now) || new Date();
  const todayUtc = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
  const byDay = new Map();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayUtc - (6 - index) * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    byDay.set(key, { date: key, dayLabel: DAY_LABELS[date.getUTCDay()], value: 0, count: 0 });
    return byDay.get(key);
  });
  for (const trade of trades) {
    const point = byDay.get(trade.createdAt.slice(0, 10));
    if (point) { point.value += trade.amountSol; point.count += 1; }
  }
  return { days, totalSol: days.reduce((total, day) => total + day.value, 0),
    tradeCount: days.reduce((total, day) => total + day.count, 0) };
}

export function graduated(launch) {
  return launch.dbc?.liveStatus?.migrationProgress === 3
    || launch.dbc?.liveStatus?.dammV2?.verified === true;
}

export function migrationSpotlight(launches) {
  const readable = launches.filter((launch) => launch.dbc?.pool && launch.dbc?.liveStatus);
  const active = readable.filter((launch) => !graduated(launch));
  const byProgress = (a, b) => Number(b.dbc.liveStatus.progressPercent || 0)
    - Number(a.dbc.liveStatus.progressPercent || 0);
  return [...(active.length ? active : readable)].sort(byProgress)[0] || null;
}
