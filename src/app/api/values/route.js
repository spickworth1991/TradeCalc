// app/api/values/route.js
import axios from 'axios'

let cache = null
let lastFetch = 0
const TTL = 1000 * 60 * 60 // 1 hour

export async function GET() {
  const now = Date.now()

  if (!cache || now - lastFetch > TTL) {
    try {
      const res = await axios.get(
        'https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=1&numTeams=12&ppr=1'
      )
      cache = res.data
      lastFetch = now
    } catch (err) {
      console.error('❌ Error fetching FantasyCalc API:', err)
      return new Response(JSON.stringify({ error: 'FantasyCalc API error' }), { status: 500 })
    }
  }

  return new Response(JSON.stringify(cache), {
    headers: { 'Content-Type': 'application/json' },
  })
}
