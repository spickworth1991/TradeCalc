// app/api/values/route.js
import axios from 'axios'

const cache = {}
const lastFetch = {}
const TTL = 1000 * 60 * 60 // 1 hour

export async function GET(req) {
  const url = new URL(req.url)
  const format = url.searchParams.get("format") === "redraft" ? "redraft" : "dynasty"
  const isSuperflex = url.searchParams.get("superflex") === "true"

  const key = `${format}-${isSuperflex ? "sf" : "1qb"}`
  const now = Date.now()

  if (!cache[key] || now - lastFetch[key] > TTL) {
    try {
      const res = await axios.get(
        `https://api.fantasycalc.com/values/current?isDynasty=${format === "dynasty"}&numQbs=${isSuperflex ? 2 : 1}&numTeams=12&ppr=1`
      )
      cache[key] = res.data
      lastFetch[key] = now
      console.log(`✅ Fetched new FantasyCalc data for ${key}`)
    } catch (err) {
      console.error(`❌ Error fetching FantasyCalc ${key} data:`, err)
      return new Response(JSON.stringify({ error: 'FantasyCalc API error' }), { status: 500 })
    }
  } else {
    console.log(`⏳ Using cached FantasyCalc data for ${key}`)
  }

  return new Response(JSON.stringify(cache[key]), {
    headers: { 'Content-Type': 'application/json' },
  })
}
