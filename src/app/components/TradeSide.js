import PlayerCard from './PlayerCard'
import SearchBox from './SearchBox'

export default function TradeSide({
  label,
  players,
  setPlayers,
  addPlayer,
  allPlayers,
  recommendations,
  owners,
  selectedOwner,
  onOwnerSelect
}) {
  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id))
  }

  const displayLabel = selectedOwner
    ? owners.find(o => o.user_id === selectedOwner)?.display_name || `Side ${label}`
    : `Side ${label}`

  return (
    <div className="bg-white p-5 rounded-lg border shadow-md">
      <h2 className="text-xl font-bold mb-3">{displayLabel}</h2>

      {owners.length > 0 && (
        <select
          value={selectedOwner || ''}
          onChange={(e) => onOwnerSelect(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        >
          <option value="">Select a team</option>
          {owners.map(o => (
            <option key={o.user_id} value={o.user_id}>
              {o.display_name}
            </option>
          ))}
        </select>
      )}

      <SearchBox players={allPlayers} onSelect={addPlayer} />

      <div className="mt-3 space-y-2">
        {players.map(p => (
          <PlayerCard key={p.id} player={p} onRemove={() => removePlayer(p.id)} />
        ))}
      </div>

      {players.length > 0 && (
        <div className="mt-3 text-sm font-semibold text-right">
          Total: {players.reduce((sum, p) => sum + p.value, 0)}
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm text-gray-500 mb-1">Suggestions:</h4>
          <div className="flex flex-col gap-1">
            {recommendations.map(p => (
              <button
                key={p.id}
                onClick={() => addPlayer(p)}
                className="text-sm text-green-700 hover:text-green-900 text-left hover:underline"
              >
                ➕ {p.name} ({p.pos}) – {p.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}