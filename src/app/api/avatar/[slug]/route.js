// /api/avatar/[slug]/route.js

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = "avatars";

// Temporary in-memory cache (only helps locally or in a single server instance)
const memoryCache = new Map();

// Manual name overrides
const nameOverrides = {
  "brian thomas": "brian thomas jr",
};

function toSlug(name) {
  const raw = name.toLowerCase().trim();
  const corrected = nameOverrides[raw] || raw;
  return corrected
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

  export async function GET(request, context) {
    const { slug: orig } = await context.params;
    const baseUrl = request.nextUrl.origin;
    if (!orig) return NextResponse.redirect(`${baseUrl}/default-avatar.png`);

  const slug = toSlug(orig.toLowerCase());

  // ✅ 1. Check in-memory cache (only useful locally or short-term)
  if (memoryCache.has(slug)) {
    const cachedUrl = memoryCache.get(slug);
    console.log(`✅ Using cached image for ${slug}: ${cachedUrl}`);
    return NextResponse.redirect(cachedUrl);
  }

  // ✅ 2. Try direct Supabase public URL (no need for .list())
  const {
    data: { publicUrl }
  } = supabase.storage.from(BUCKET).getPublicUrl(`${slug}.jpg`);

  // ✅ 3. Test if URL actually works (HEAD check)
  try {
    const test = await fetch(publicUrl, { method: "HEAD" });
    if (test.ok) {
      memoryCache.set(slug, publicUrl);
      console.log(`✅ Found in Supabase: ${publicUrl}`);
      return NextResponse.redirect(publicUrl);
    }
  } catch {
    console.warn(`⚠️ Supabase HEAD check failed for: ${slug}`);
  }

  // ✅ 4. Scrape from NFL as LAST resort
  try {
    const nflUrl = `https://www.nfl.com/players/${slug}/`;
    console.log(`📦 Fetching NFL page: ${nflUrl}`);

    const res = await fetch(nflUrl, {
      headers: { "User-Agent": "Mozilla/5.0 ..." },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("NFL page fetch failed");

    const html = await res.text();
    const $ = cheerio.load(html);
    let imgUrl = $("img.img-responsive").first().attr("src");

    if (imgUrl?.includes("upload/")) {
      imgUrl = imgUrl.replace(/\/t_[^/]+/g, "");
    }

    if (!imgUrl || !imgUrl.startsWith("https")) {
      throw new Error("Image not found in HTML");
    }

    // ✅ 5. Upload to Supabase
    const imgRes = await fetch(imgUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(`${slug}.jpg`, buffer, {
        contentType: imgRes.headers.get("Content-Type") || "image/jpeg",
        upsert: true,
      });

    if (uploadErr) throw new Error("Supabase upload failed");

    const {
      data: { publicUrl: finalUrl }
    } = supabase.storage.from(BUCKET).getPublicUrl(`${slug}.jpg`);

    memoryCache.set(slug, finalUrl);
    console.log(`✅ Uploaded to Supabase for ${slug}: ${finalUrl}`);
    return NextResponse.redirect(finalUrl);

  } catch (err) {
    console.warn(`⚠️ Avatar fetch failed for ${slug}:`, err.message);
    return NextResponse.redirect(`${baseUrl}/default-avatar.png`);
  }
}