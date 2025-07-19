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
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      {query && matches.length > 0 && (
        <ul className="bg-white border max-h-60 overflow-auto rounded shadow">
          {matches.slice(0, 10).map(p => (
            <li
              key={p.id}
              onClick={() => {
                onSelect(p)
                setQuery('')
              }}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
            >
              {p.name} ({p.pos}) – {p.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}