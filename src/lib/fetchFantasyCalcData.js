// src/lib/fetchFantasyCalcData.js

const globalKey = "__fantasy_calc_cache__";
const TTL = 1000 * 60 * 60 * 24; // 24 hours

// Setup global cache object once
if (!globalThis[globalKey]) {
  globalThis[globalKey] = {
    data: null,
    lastFetch: 0,
  };
}

export async function fetchFantasyCalcData() {
  const now = Date.now();
  const cache = globalThis[globalKey];

  // ✅ Return cached data if still valid
  if (cache.data && now - cache.lastFetch < TTL) {
    return cache.data;
  }

  // ❌ Stale or empty → fetch once
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/values`);
  if (!res.ok) throw new Error("Failed to fetch FantasyCalc values");

  const json = await res.json();

  // Save to global cache
  cache.data = json;
  cache.lastFetch = now;

  return json;
}
