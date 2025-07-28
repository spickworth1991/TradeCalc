"use client";
import { useState } from "react";

export default function SearchBox({ players, onSelectAndSearch }) {
  const [query, setQuery] = useState("");

  const matches = players.filter((p) =>
    p.name?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (player) => {
    onSelectAndSearch(player); // ✅ Parent handles selecting AND searching
    setQuery(""); // ✅ Clear input after selecting player
  };

  const handleFocus = () => {
    setQuery(""); // ✅ Always clear on click
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search players"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded mb-2"
      />
      {query && matches.length > 0 && (
        <ul className="bg-gray-900 border border-gray-600 max-h-60 overflow-auto rounded shadow text-white">
          {matches.slice(0, 10).map((p) => (
            <li
              key={p.id}
              onClick={() => handleSelect(p)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-700"
            >
              {p.name} ({p.pos})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
