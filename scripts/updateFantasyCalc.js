// scripts/updateFantasyCalc.js

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const OUT_PATH = path.join(__dirname, "../public/fantasycalc_cache.json");

const combinations = [
  { isDynasty: true, numQbs: 1, key: "Dynasty_1QB" },
  { isDynasty: true, numQbs: 2, key: "Dynasty_SF" },
  { isDynasty: false, numQbs: 1, key: "Redraft_1QB" },
  { isDynasty: false, numQbs: 2, key: "Redraft_SF" },
];

(async () => {
  try {
    const results = {};

    for (const { isDynasty, numQbs, key } of combinations) {
      const url = `https://api.fantasycalc.com/values/current?isDynasty=${isDynasty}&numQbs=${numQbs}&numTeams=12&ppr=1`;
      console.log("Fetching:", url);
      const res = await axios.get(url);
      results[key] = res.data;
    }

    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
    console.log("✅ fantasycalc_cache.json updated.");
  } catch (err) {
    console.error("❌ Failed to update FantasyCalc cache:", err.message);
    process.exit(1);
  }
})();
