// app/api/values/route.js
import axios from "axios";

const cache = {};
const lastFetch = {};
const TTL = 1000 * 60 * 60; // 1 hour

const BUCKET_URL =
  "https://supabase.com/dashboard/project/eqjonrlwomiznmxblvuv/storage/buckets/avatars";

// Update this with your actual Supabase project domain
// You can also inject this with env if you want to keep it cleaner

const nameOverrides = {
  "brian thomas": "brian thomas jr",
};

function toNflSlug(name) {
  const raw = name.toLowerCase().trim();
  const corrected = nameOverrides[raw] || raw;

  return corrected
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req) {
  const url = new URL(req.url);
  const format =
    url.searchParams.get("format") === "redraft" ? "redraft" : "dynasty";
  const isSuperflex = url.searchParams.get("superflex") === "true";

  const key = `${format}-${isSuperflex ? "sf" : "1qb"}`;
  const now = Date.now();

  if (!cache[key] || now - lastFetch[key] > TTL) {
    try {
      const res = await axios.get(
        `https://api.fantasycalc.com/values/current?isDynasty=${format === "dynasty"}&numQbs=${isSuperflex ? 2 : 1}&numTeams=12&ppr=1`,
      );
      const data = res.data;

      // Attach avatar URLs to each player
      const enriched = data.map((entry) => {
        const name = entry?.player?.name || "";
        const slug = toNflSlug(name);
        return {
          ...entry,
          avatar: `${BUCKET_URL}/${slug}.jpg`,
        };
      });

      cache[key] = enriched;
      lastFetch[key] = now;
      console.log(`✅ Fetched and enriched FantasyCalc data for ${key}`);
    } catch (err) {
      console.error(`❌ Error fetching FantasyCalc ${key} data:`, err);
      return new Response(JSON.stringify({ error: "FantasyCalc API error" }), {
        status: 500,
      });
    }
  } else {
    console.log(`⏳ Using cached FantasyCalc data for ${key}`);
  }

  // Inject avatar URLs directly from Supabase bucket
  const enriched = cache[key].map((entry) => {
    const raw = entry?.player?.name?.toLowerCase() || "";
    const slug = raw
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return {
      ...entry,
      avatarUrl: `https://eqjonrlwomiznmxblvuv.supabase.co/storage/v1/object/public/avatars/${slug}.jpg`,
    };
  });

  return new Response(JSON.stringify(enriched), {
    headers: { "Content-Type": "application/json" },
  });
}
