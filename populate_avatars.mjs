// Run this with: node populate_avatars.js

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ENV — replace with your values
const SUPABASE_URL = 'https://eqjonrlwomiznmxblvuv.supabase.co/';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxam9ucmx3b21pem5teGJsdnV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgwNzQxOSwiZXhwIjoyMDY4MzgzNDE5fQ.kMw5EVTqCajsOrVo2rQ8mT4XxidzsF5jQYbjEj2ENK0';
const BUCKET = 'avatars';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);




  // Your actual slugify logic
  const nameOverrides = {
    'brian thomas': 'brian thomas jr',
    'de\'von achane': 'devon achane',
    'josh palmer': 'joshua palmer',
    'luther burden': 'Luther Burden III',
    'michael penix': 'Michael Penix Jr.',
    'tyrone tracy': 'Tyrone Tracy Jr.',
    'marvin mims': 'Marvin Mims Jr.',
    'hollywood brown': 'Marquise Brown',
    'donte thornton': "Dont'e Thornton Jr.",
    'harold fannin': 'Harold Fannin Jr.',
    'ollie gordon': 'Ollie Gordon II',
    'calvin austin': 'Calvin Austin III',
    'joe milton': 'Joe Milton III',
    'efton chism': 'efton chism iii',
    'jimmy horn': 'Jimmy Horn Jr.',
    'thomas fidone': 'Thomas Fidone II',
    'chris rodriguez': 'Chris Rodriguez Jr.',
    'ricky white': 'Ricky White III',

  };
  // Lowercase before checking override
  export function toNflSlug(name) {
    const cleaned = name.toLowerCase();
    const override = nameOverrides[cleaned] || name;

    return override
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")     // keep apostrophes until here
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Get FantasyCalc player names from both redraft and dynasty
  async function getAllPlayers() {
    const urls = [
      'https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=1&numTeams=12&ppr=1',
      'https://api.fantasycalc.com/values/current?isDynasty=false&numQbs=1&numTeams=12&ppr=1',
    ];

    const names = new Set();

    for (const url of urls) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`📥 Fetched ${data.length} players from: ${url}`);

        for (const player of data) {
          const name = player.player?.name;
          if (name) names.add(name);
        }
      } catch (e) {
        console.warn(`⚠️ Failed to fetch ${url}:`, e.message);
      }
    }

    console.log(`🔍 Total unique player names: ${names.size}`);
    return [...names];
  }



  // Scrape avatar from NFL.com
  async function getNflImage(slug) {
    const url = `https://www.nfl.com/players/${slug}/`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    let img = $('img.img-responsive').first().attr('src');
    if (img?.includes("upload/") || img?.includes("image/private/")) {
      img = img.replace(/\/t_[^/]+/g, '');
    }
    console.log(`🖼️ Scraped image for ${slug}: ${img}`);
    return img?.startsWith('https') ? img : null;
  }

  // Upload to Supabase
  async function uploadImage(slug, imgUrl) {
    const res = await fetch(imgUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('Content-Type') || 'image/jpeg';

    const { error } = await supabase.storage.from(BUCKET).upload(
      `${slug}.jpg`,
      buffer,
      {
        contentType,
        upsert: true,
      }
    );
    console.log(`⬆️ Uploading ${slug}.jpg to Supabase...`);

    if (error) throw new Error(error.message);
  }

  // Run the full process
  async function run() {
    const names = await getAllPlayers();
    const results = [];

    for (const name of names) {
      const slug = toNflSlug(name);
      console.log(`🔁 Processing: ${name} → ${slug}`);


      try {
        const { data } = await supabase.storage.from(BUCKET).list('', {
          search: `${slug}.jpg`,
          limit: 1,
        });

        if (data?.length > 0) {
          results.push({ slug, status: 'cached' });
          continue;
        }

        const imgUrl = await getNflImage(slug);
        if (!imgUrl) throw new Error('No image found');

        await uploadImage(slug, imgUrl);
        results.push({ slug, status: 'uploaded' });
      } catch (e) {
        results.push({ slug, status: 'error', reason: e.message });
      }
    }

    fs.writeFileSync('avatar_upload_log.json', JSON.stringify(results, null, 2));
    console.log('✅ Done. Check avatar_upload_log.json');
  }

  run();
