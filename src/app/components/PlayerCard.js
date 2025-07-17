export default function PlayerCard({ player, onRemove }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 border rounded-lg px-4 py-3 hover:shadow transition">
      <div>
        <p className="font-semibold text-sm">{player.name}</p>
        <p className="text-xs text-gray-500">{player.pos} — {player.team}</p>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-blue-700 font-bold text-sm">{player.value}</span>
        {onRemove && (
          <button onClick={onRemove} className="text-red-600 text-sm hover:underline">✕</button>
        )}
      </div>
    </div>
  )
}
