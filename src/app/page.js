'use client'

import { useEffect, useState } from 'react'
import TradeSide from './components/TradeSide'
import PlayerCard from './components/PlayerCard'
import SleeperLogin from './components/SleeperLogin'

export default function Home() {
  const [allPlayers, setAllPlayers] = useState([])
  const [sideA, setSideA] = useState([])
  const [sideB, setSideB] = useState([])
  const [recommendations, setRecommendations] = useState({ A: [], B: [] })
  const [result, setResult] = useState(null)

  const [sleeperUser, setSleeperUser] = useState(null)
  const [leagues, setLeagues] = useState([])
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [owners, setOwners] = useState([])
  const [ownerMap, setOwnerMap] = useState({})
  const [rosters, setRosters] = useState({})
  const [sideOwners, setSideOwners] = useState({ A: null, B: null })

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch('/api/values')
        const data = await res.json()
        const values = Array.isArray(data)
          ? data
          : Array.isArray(data.values)
          ? data.values
          : Array.isArray(data.results)
          ? data.results
          : []

        const flat = values.map(p => ({
          name: p.player?.name,
          id: p.player?.sleeperId || p.player?.id,
          pos: p.player?.position,
          team: p.player?.maybeTeam || '',
          value: p.value || 0,
        })).filter(p => p.name && p.value > 0)

        setAllPlayers(flat)
      } catch (err) {
        console.error('Load error', err)
      }
    }
    fetchPlayers()
  }, [])

  useEffect(() => {
    const total = (list) => list.reduce((sum, p) => sum + p.value, 0)
    const a = total(sideA)
    const b = total(sideB)
    const winner = a === b ? 'Even' : a > b ? 'A' : 'B'
    const diff = Math.abs(a - b)
    setResult({ a, b, winner, diff })

    const selectedIds = new Set([...sideA, ...sideB].map(p => p.id))
    const target = a > b ? 'B' : a < b ? 'A' : null
    const missing = Math.abs(a - b)

    if (!target) {
      setRecommendations({ A: [], B: [] })
      return
    }

    const recos = allPlayers
      .filter(p => !selectedIds.has(p.id))
      .map(p => ({ ...p, match: Math.abs(p.value - missing) }))
      .sort((a, b) => a.match - b.match)
      .slice(0, 5)

    setRecommendations(prev => ({ ...prev, [target]: recos }))
  }, [sideA, sideB, allPlayers])

  const handleLogin = async (username, userId) => {
    setSleeperUser({ username, userId })
    const season = new Date().getFullYear()
    const res = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`)
    const data = await res.json()
    setLeagues(Array.isArray(data) ? data : [])
  }

  const handleLeagueSelect = async (leagueId) => {
    const league = leagues.find(l => l.league_id === leagueId)
    if (!league) return
    setSelectedLeague(league)
    const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`)
    const users = await res.json()
    setOwners(users)
    const map = Object.fromEntries(users.map(u => [u.user_id, u.display_name]))
    setOwnerMap(map)
    const rostersRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
    const rosterData = await rostersRes.json()
    const teamMap = {}
    rosterData.forEach(r => teamMap[r.owner_id] = r.players)
    setRosters(teamMap)
  }

  const getFilteredPlayers = (ownerId) => {
    if (!ownerId || !rosters[ownerId]) return []
    return allPlayers.filter(p => rosters[ownerId].includes(p.id))
  }

  const setTeam = (side, ownerId) => {
    setSideOwners(prev => ({ ...prev, [side]: ownerId }))
    const filtered = getFilteredPlayers(ownerId)
    side === 'A' ? setSideA(filtered) : setSideB(filtered)
  }

  const clearTrade = () => {
    setSideA([])
    setSideB([])
    setSideOwners({ A: null, B: null })
  }

  const clearLeague = () => {
    setSelectedLeague(null)
    setOwners([])
    setOwnerMap({})
    setRosters({})
    setSideOwners({ A: null, B: null })
    setSideA([])
    setSideB([])
  }

  const handleAddPlayer = (side, player) => {
    if (side === 'A') setSideA(prev => [...prev, player])
    else if (side === 'B') setSideB(prev => [...prev, player])
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        <h1 className="text-4xl font-extrabold text-center text-purple-700 drop-shadow">
          🏈 Fantasy Trade Analyzer
        </h1>

        {!sleeperUser && (
          <div className="flex justify-center">
            <SleeperLogin onLogin={handleLogin} />
          </div>
        )}

        {sleeperUser && (
          <div className="text-center space-y-4">
            <p className="text-lg">Logged in as <strong>{sleeperUser.username}</strong></p>
            <select
              onChange={e => handleLeagueSelect(e.target.value)}
              className="p-2 border rounded text-lg"
            >
              <option value="">Select a league</option>
              {leagues.map(l => (
                <option key={l.league_id} value={l.league_id}>
                  {l.name || l.metadata?.name || `League ${l.league_id}`}
                </option>
              ))}
            </select>

            {selectedLeague && (
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                <button
                  onClick={clearTrade}
                  className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded shadow text-black font-semibold"
                >
                  🔁 Clear Trade
                </button>
                <button
                  onClick={clearLeague}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded shadow text-white font-semibold"
                >
                  ❌ Clear League
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <TradeSide
            label="A"
            players={sideA}
            setPlayers={setSideA}
            addPlayer={(player) => handleAddPlayer('A', player)}
            allPlayers={sideOwners.A ? getFilteredPlayers(sideOwners.A) : allPlayers}
            recommendations={recommendations.A}
            owners={owners}
            selectedOwner={sideOwners.A}
            onOwnerSelect={(id) => setTeam('A', id)}
          />
          <TradeSide
            label="B"
            players={sideB}
            setPlayers={setSideB}
            addPlayer={(player) => handleAddPlayer('B', player)}
            allPlayers={sideOwners.B ? getFilteredPlayers(sideOwners.B) : allPlayers}
            recommendations={recommendations.B}
            owners={owners}
            selectedOwner={sideOwners.B}
            onOwnerSelect={(id) => setTeam('B', id)}
          />
        </div>

        {result && (
          <div className="text-center">
            <div className="inline-block bg-white border border-gray-300 rounded-lg px-6 py-4 shadow-md text-lg">
              <p className="mb-1">
                Side A: <span className="font-bold text-blue-700">{result.a}</span> vs Side B: <span className="font-bold text-green-700">{result.b}</span>
              </p>
              <p className="mt-1 font-semibold">
                {result.winner === 'Even'
                  ? '⚖️ Even trade'
                  : `🏆 Side ${result.winner} wins by ${result.diff}`}
              </p>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-700">💎 Top Available Players</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allPlayers.slice(0, 12).map(p => (
              <div
                key={p.id}
                className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition hover:bg-blue-50"
                onClick={() => handleAddPlayer('A', p)}
              >
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.pos} – {p.team}</p>
                <p className="text-right text-blue-700 font-semibold">{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}