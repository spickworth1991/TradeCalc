import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const BUCKET = "avatars";

const nameOverrides = {
  "brian thomas": "brian thomas jr"
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

const fetchAndUpload = async (slug) => {
  const url = `https://www.fantasycalc.com/players/${slug}`;
  const page = await fetch(url);
  const html = await page.text();
  const $ = cheerio.load(html);
  const img = $("img.rounded-full").attr("src");
  if (!img) return { slug, success: false, reason: "No image found" };

  const imgRes = await fetch(img);
  const buffer = await imgRes.arrayBuffer();
  const upload = await supabase.storage
    .from(BUCKET)
    .upload(`${slug}.png`, buffer, {
      contentType: "image/png",
      upsert: true
    });

  if (upload.error) {
    return { slug, success: false, reason: upload.error.message };
  }

  return { slug, success: true };
};

export async function POST(req) {
  const { slugs = [] } = await req.json();
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return new Response(JSON.stringify({ error: "No slugs provided" }), {
      status: 400
    });
  }

  const uniqueSlugs = [...new Set(slugs.map(toNflSlug))];
  const results = [];

  for (const slug of uniqueSlugs) {
    const { data } = await supabase.storage.from(BUCKET).list("", {
      search: `${slug}.png`,
    });

    const alreadyExists = data?.some(item => item.name === `${slug}.png`);
    if (alreadyExists) {
      results.push({ slug, success: true, cached: true });
    } else {
      const result = await fetchAndUpload(slug);
      results.push(result);
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}
