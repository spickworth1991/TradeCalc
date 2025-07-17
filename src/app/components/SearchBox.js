import { useState } from 'react'

export default function SearchBox({ players, onSelect }) {
  const [query, setQuery] = useState('')

  const filtered = query.length > 1
    ? players.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        !p.disabled
      ).slice(0, 6)
    : []

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search player"
        className="w-full px-3 py-2 border rounded focus:outline-none"
      />
      {filtered.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 bg-white border mt-1 rounded shadow text-sm">
          {filtered.map(p => (
            <li
              key={p.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => {
                onSelect(p)
                setQuery('')
              }}
            >
              {p.name} ({p.pos}) – {p.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
