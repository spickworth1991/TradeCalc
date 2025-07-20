import { promises as fs } from "fs";
import path from "path";

const globalKey = "__fantasy_calc_cache__";
const TTL = 1000 * 60 * 60 * 24; // 24 hours

// Initialize global cache
if (!globalThis[globalKey]) {
  globalThis[globalKey] = {
    data: null,
    lastFetch: 0,
  };
}

export async function fetchFantasyCalcData() {
  const now = Date.now();
  const cache = globalThis[globalKey];

  // ✅ Return in-memory cache if valid
  if (cache.data && now - cache.lastFetch < TTL) {
    return cache.data;
  }

  const fallbackPath = path.join(process.cwd(), "public", "fantasycalc_cache.json");

  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/values`);

    if (res.ok) {
      const json = await res.json();
      cache.data = json;
      cache.lastFetch = now;

      // ✅ Save to local fallback file
      await fs.writeFile(fallbackPath, JSON.stringify(json, null, 2), "utf-8");

      return json;
    } else {
      throw new Error(`Fetch failed with status ${res.status}`);
    }
  } catch (err) {
    console.warn("⚠️ FantasyCalc fetch failed, using fallback:", err.message);

    try {
      const contents = await fs.readFile(fallbackPath, "utf-8");
      const fallbackData = JSON.parse(contents);
      cache.data = fallbackData;
      cache.lastFetch = now;
      return fallbackData;
    } catch (fileErr) {
      console.error("❌ Could not read fallback file:", fileErr.message);
      return {}; // Graceful fallback
    }
  }
}
