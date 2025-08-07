"use client";
import { useState, useEffect, useRef } from "react";

export default function SearchBox({ players, onSelectAndSearch }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // ✅ Debounce search for performance
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim()) {
        const filtered = players
          .filter((p) => p.name?.toLowerCase().includes(query.toLowerCase()))
          .sort((a, b) => b.value - a.value); // ✅ Sort by value
        setMatches(filtered.slice(0, 10));
        setOpen(true);
        setHighlightIndex(-1);
      } else {
        setMatches([]);
        setOpen(false);
      }
    }, 200);


    return () => clearTimeout(handler);
  }, [query, players]);

  const handleSelect = (player) => {
    if (typeof onSelectAndSearch === "function") {
      onSelectAndSearch(player); // ✅ Parent handles adding player or search
    }
    setQuery(""); // ✅ Clear input completely
    setOpen(false); // ✅ Close dropdown
  };


  const handleFocus = () => setOpen(matches.length > 0);

  // ✅ Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!open || matches.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < matches.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : matches.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && matches[highlightIndex]) {
        handleSelect(matches[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // ✅ Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search players..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {open && matches.length > 0 && (
        <ul
          ref={listRef}
          className="absolute left-0 right-0 mt-1 bg-gray-900 border border-gray-600 rounded shadow-lg max-h-60 overflow-auto z-50"
        >
          {matches.map((p, idx) => (
            <li
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`px-4 py-2 cursor-pointer ${
                idx === highlightIndex ? "bg-blue-600 text-white" : "hover:bg-gray-700"
              }`}
            >
              {p.name} <span className="text-gray-400 text-sm">({p.pos})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
