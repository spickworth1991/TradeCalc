import PlayerCard from './PlayerCard'
import SearchBox from './SearchBox'

export default function TradeSide({ label, players, setPlayers, allPlayers, recommendations }) {
  const addPlayer = (p) => {
    if (!players.some(pl => pl.id === p.id)) {
      setPlayers([...players, p])
    }
  }

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id))
  }

  return (
    <div className="bg-white p-5 rounded-lg border shadow-md">
      <h2 className="text-xl font-bold mb-3">Side {label}</h2>
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
