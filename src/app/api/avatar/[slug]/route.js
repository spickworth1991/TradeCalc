import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const cache = new Map(); // In-memory cache

function toNflSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const BUCKET = "avatars";

export async function GET(request, context) {
  const { slug: orig } = await context.params;
  const original = orig?.toLowerCase();
  if (!original) return NextResponse.redirect("/default-avatar.png");
  const slug = toNflSlug(original);

  if (cache.has(slug)) {
    const cachedUrl = cache.get(slug);
    console.log(`✅ Using cached image for ${slug}: ${cachedUrl}`);
    return NextResponse.redirect(cachedUrl);
  }

  // Supabase check using list()
  const { data: list, error: listErr } = await supabase
    .storage
    .from(BUCKET)
    .list('', { search: `${slug}.jpg`, limit: 1 });

  if (listErr) console.warn("Supabase list error:", listErr);
  if (list?.length > 0) {
    const { data: { publicUrl } } = supabase
      .storage
      .from(BUCKET)
      .getPublicUrl(`${slug}.jpg`);
    console.log(`✅ Found existing file in Supabase: ${publicUrl}`);
    cache.set(slug, publicUrl);
    return NextResponse.redirect(publicUrl);
  }


  try {
    const nflUrl = `https://www.nfl.com/players/${slug}/`;
    console.log(`📦 Fetching NFL player page: ${nflUrl}`);

    const res = await fetch(nflUrl, {
      headers: { "User-Agent": "Mozilla/5.0 ..." },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("NFL page fetch failed");

    const html = await res.text();
    const $ = cheerio.load(html);

    let imgUrl = $('img.img-responsive').first().attr("src");
    if (imgUrl?.includes("upload/")) {
      imgUrl = imgUrl.replace(/\/t_[^/]+/, "");
    }

    console.log(`🖼️ Found image for ${slug}: ${imgUrl}`);


    if (imgUrl && imgUrl.startsWith("https")) {
        cache.set(slug, imgUrl); // Save to memory cache
        return NextResponse.redirect(imgUrl);
    }
    if (!imgUrl || !imgUrl.startsWith("https")) {
        throw new Error("Image not found in HTML");
    }
    

    // ✅ Download & upload to Supabase
    const imgRes = await fetch(imgUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const { error: uploadErr } = await supabase
      .storage
      .from(BUCKET)
      .upload(`${slug}.jpg`, buffer, {
        contentType: imgRes.headers.get("Content-Type") || "image/jpeg",
        upsert: true,
      });

    if (uploadErr) throw new Error("Supabase upload failed");

    const { data: uploaded } = supabase
      .storage
      .from(BUCKET)
      .getPublicUrl(`${slug}.jpg`);

    cache.set(slug, uploaded.publicUrl);
    console.log(`✅ Uploaded to Supabase for ${slug}: ${uploaded.publicUrl}`);

    return NextResponse.redirect(uploaded.publicUrl,imgUrl);
  } catch (err) {
    console.warn(`⚠️ Avatar fetch failed for ${slug}:`, err.message);
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/default-avatar.png`);
  }
}
