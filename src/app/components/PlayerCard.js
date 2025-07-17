export default function PlayerCard({ player, onRemove }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 border px-3 py-2 rounded">
      <div>
        <p className="font-medium">{player.name}</p>
        <p className="text-xs text-gray-500">{player.pos} – {player.team}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="font-semibold text-blue-700">{player.value}</p>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-lg"
        >
          ❌
        </button>
      </div>
    </div>
  )
}