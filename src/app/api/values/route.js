// app/api/values/route.js
import axios from 'axios'

let cache = {
  dynasty: null,
  redraft: null,
}
let lastFetch = {
  dynasty: 0,
  redraft: 0,
}
const TTL = 1000 * 60 * 60 // 1 hour

export async function GET(req) {
  const url = new URL(req.url)
  const format = url.searchParams.get("format") === "redraft" ? "redraft" : "dynasty"

  const now = Date.now()
  if (!cache[format] || now - lastFetch[format] > TTL) {
    try {
      const res = await axios.get(
        `https://api.fantasycalc.com/values/current?isDynasty=${format === "dynasty"}&numQbs=1&numTeams=12&ppr=1`
      )
      cache[format] = res.data
      lastFetch[format] = now
    } catch (err) {
      console.error(`❌ Error fetching FantasyCalc ${format} data:`, err)
      return new Response(JSON.stringify({ error: 'FantasyCalc API error' }), { status: 500 })
    }
  }

  return new Response(JSON.stringify(cache[format]), {
    headers: { 'Content-Type': 'application/json' },
  })
}
