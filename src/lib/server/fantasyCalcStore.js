// src/lib/server/fantasyCalcStore.js
import fs from 'fs';
import path from 'path';

const CACHE_PATH = path.join(process.cwd(), 'public', 'fantasycalc_cache.json');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function saveFantasyCalcData(data) {
  const payload = {
    timestamp: Date.now(),
    data,
  };
  fs.writeFileSync(CACHE_PATH, JSON.stringify(payload, null, 2));
}
