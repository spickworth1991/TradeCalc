import PlayerCard from './PlayerCard'
import SearchBox from './SearchBox'
import { Analytics } from "@vercel/analytics/next"
export default function TradeSide({
  label,
  players,
  setPlayers,
  addPlayer,
  allPlayers,
  owners,
  selectedOwner,
  onOwnerSelect,
  recommendations,
  getPlayerValue = [],
}) {
  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id))
  }

  const displayValue = (p) => getPlayerValue(p);
  
  const displayLabel = selectedOwner
    ? owners.find(o => o.user_id === selectedOwner)?.display_name || `Side ${label}`
    : `Side ${label}`

  return (
    <div className="bg-gray-900 text-white p-5 rounded-lg border border-gray-700 shadow-md">
      <h2 className="text-xl font-bold mb-3 text-blue-400">{displayLabel}</h2>

      {owners.length > 0 && (
        <select
          value={selectedOwner || ''}
          onChange={(e) => onOwnerSelect(e.target.value)}
          className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded mb-3"
        >
          <option value="">Select a team</option>
          {owners.map(o => (
            <option key={o.user_id} value={o.user_id}>
              {o.display_name}
            </option>
          ))}
        </select>
      )}

      <SearchBox
        players={allPlayers}
        onSelectAndSearch={(player) => addPlayer(player)} // ✅ This will call parent handler with correct side
      />


      <div className="mt-3 space-y-2">
        {players.map(p => (
          <PlayerCard
            key={p.id}
            player={p}
            displayValue={displayValue}
            onRemove={() => removePlayer(p.id)}
          />

        ))}
      </div>

      <div className="mt-3 text-sm font-semibold text-right">
        Total: {players.reduce((sum, p) => sum + getPlayerValue(p), 0)}
      </div>

      {/* ✅ Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mt-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
            <h4 className="text-indigo-400 text-sm font-semibold mb-2">
              Suggested Adds
            </h4>
            <ul className="space-y-2">
              {recommendations.map((p) => (
              <li key={p.id} className="flex justify-between items-center text-sm bg-gray-900 p-2 rounded">
                <div>
                  <a href={`https://www.nfl.com/players/${p.name.toLowerCase().replace(/\s+/g, "-")}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-blue-400 hover:underline">
                    {p.name}
                  </a>
                  <p className="text-gray-400 text-xs">Value: {getPlayerValue(p)}</p>
                </div>
                <button onClick={() => addPlayer(p)}
                        className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1 rounded">
                  Add
                </button>
              </li>
            ))}
            </ul>
          </div>
        )}

    </div>
  )
}