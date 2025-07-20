import { saveFantasyCalcData } from "@/lib/server/fantasyCalcStore";
import axios from "axios";

let cache = null;
let lastFetch = 0;
const TTL = 1000 * 60 * 60; // 1 hour

const combinations = [
  { isDynasty: true, numQbs: 1, key: "Dynasty_1QB" },
  { isDynasty: true, numQbs: 2, key: "Dynasty_SF" },
  { isDynasty: false, numQbs: 1, key: "Redraft_1QB" },
  { isDynasty: false, numQbs: 2, key: "Redraft_SF" },
];

export async function GET() {
  const now = Date.now();

  if (!cache || now - lastFetch > TTL) {
    try {
      const results = {};

      for (const { isDynasty, numQbs, key } of combinations) {
        const url = `https://api.fantasycalc.com/values/current?isDynasty=${isDynasty}&numQbs=${numQbs}&numTeams=12&ppr=1`;
        console.log("Fetching:", url);
        const res = await axios.get(url);
        results[key] = res.data;
      }

      cache = results;
      lastFetch = now;
      saveFantasyCalcData(cache);
    } catch (e) {
      console.error("FantasyCalc fetch failed:", e.message);
      return new Response(JSON.stringify({ error: "Fetch failed" }), { status: 500 });
    }
  }

  return new Response(JSON.stringify(cache), {
    headers: { "Content-Type": "application/json" },
  });
}
