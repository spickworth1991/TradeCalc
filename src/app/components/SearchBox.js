import { useState } from 'react'
import { Analytics } from "@vercel/analytics/next"
export default function SearchBox({ players, onSelect }) {
  const [query, setQuery] = useState('')

  const matches = players.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      <input
        type="text"
        placeholder="Search players"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded mb-2"
      />
      {query && matches.length > 0 && (
        <ul className="bg-gray-900 border border-gray-600 max-h-60 overflow-auto rounded shadow text-white">
          {matches.slice(0, 10).map(p => (
            <li
              key={p.id}
              onClick={() => {
                onSelect(p)
                setQuery('')
              }}
              className="px-3 py-2 cursor-pointer hover:bg-gray-700">
              {p.name} ({p.pos}) – {p.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}