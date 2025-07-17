// app/page.js
"use client";

import { useEffect, useState } from "react";
import TradeSide from "./components/TradeSide";
import PlayerCard from "./components/PlayerCard";
import SleeperLogin from "./components/SleeperLogin";

export default function Home() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [sideA, setSideA] = useState([]);
  const [sideB, setSideB] = useState([]);
  const [recommendations, setRecommendations] = useState({ A: [], B: [] });
  const [result, setResult] = useState(null);

  const [sleeperUser, setSleeperUser] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [owners, setOwners] = useState([]);
  const [ownerMap, setOwnerMap] = useState({});
  const [rosters, setRosters] = useState({});
  const [sideOwners, setSideOwners] = useState({ A: null, B: null });

  const SAFE_MARGIN = 50;

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/values");
        const data = await res.json();
        const values = Array.isArray(data)
          ? data
          : Array.isArray(data.values)
            ? data.values
            : Array.isArray(data.results)
              ? data.results
              : [];

        const flat = values
          .map((p) => ({
            name: p?.player?.name,
            id: p?.player?.sleeperId || p?.player?.id,
            pos: p?.player?.position,
            team: p?.player?.maybeTeam || "",
            value: p?.value || 0,
          }))
          .filter((p) => p.name && p.value > 0);

        setAllPlayers(flat);
      } catch (err) {
        console.error("Error loading players:", err);
      }
    };

    fetchPlayers();
  }, []);

  useEffect(() => {
    const total = (list) => list.reduce((sum, p) => sum + p.value, 0);
    const a = total(sideA);
    const b = total(sideB);
    const diff = Math.abs(a - b);
    const winner = a === b ? "Even" : a > b ? "A" : "B";

    setResult({ a, b, winner, diff });

    // If close enough, clear both sides' recos
    if (diff <= SAFE_MARGIN) {
      setRecommendations({ A: [], B: [] });
      return;
    }

    const selectedIds = new Set([...sideA, ...sideB].map((p) => p.id));
    const target = a > b ? "B" : a < b ? "A" : null;
    const missing = Math.abs(a - b);

    // Always reset both sides
    const newRecos = { A: [], B: [] };

    if (!target) {
      setRecommendations(newRecos);
      return;
    }

    const opposingSide = target === "A" ? "B" : "A";
    const opposingOwnerId = sideOwners[opposingSide];
    const rosterFilter = opposingOwnerId
      ? rosters[opposingOwnerId] || []
      : null;

    const possible = allPlayers.filter(
      (p) =>
        !selectedIds.has(p.id) &&
        (!rosterFilter || rosterFilter.includes(p.id)),
    );

    const recos = possible
      .map((p) => ({ ...p, match: Math.abs(p.value - missing) }))
      .sort((a, b) => a.match - b.match)
      .slice(0, 5);

    newRecos[target] = recos;
    setRecommendations(newRecos);
  }, [sideA, sideB, allPlayers, sideOwners, rosters]);

  const handleLogin = async (username, userId) => {
    setSleeperUser({ username, userId });
    const season = new Date().getFullYear();
    const res = await fetch(
      `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`,
    );
    const data = await res.json();
    setLeagues(Array.isArray(data) ? data : []);
  };

  const handleLeagueSelect = async (leagueId) => {
    const league = leagues.find((l) => l.league_id === leagueId);
    if (!league) return;
    setSelectedLeague(league);

    const usersRes = await fetch(
      `https://api.sleeper.app/v1/league/${leagueId}/users`,
    );
    const users = await usersRes.json();
    setOwners(users);
    setOwnerMap(
      Object.fromEntries(users.map((u) => [u.user_id, u.display_name])),
    );

    const rosterRes = await fetch(
      `https://api.sleeper.app/v1/league/${leagueId}/rosters`,
    );
    const data = await rosterRes.json();
    const map = {};
    data.forEach((r) => {
      map[r.owner_id] = r.players || [];
    });
    setRosters(map);
  };

  const getFilteredPlayers = (ownerId) => {
    if (!ownerId || !rosters[ownerId]) return [];
    return allPlayers.filter((p) => rosters[ownerId].includes(p.id));
  };

  const setTeam = (side, ownerId) => {
    setSideOwners((prev) => ({ ...prev, [side]: ownerId }));
  };

  const clearTrade = () => {
    setSideA([]);
    setSideB([]);
    setSideOwners({ A: null, B: null });
  };

  const clearLeague = () => {
    setSelectedLeague(null);
    setOwners([]);
    setOwnerMap({});
    setRosters({});
    setSideOwners({ A: null, B: null });
    setSideA([]);
    setSideB([]);
  };

  const handleAddPlayer = (side, player) => {
    if (side === "A" && !sideA.find((p) => p.id === player.id)) {
      setSideA((prev) => [...prev, player]);
    } else if (side === "B" && !sideB.find((p) => p.id === player.id)) {
      setSideB((prev) => [...prev, player]);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 bg-gradient-to-br from-slate-100 to-gray-200 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-12">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 drop-shadow">
          🏈 Fantasy Trade Analyzer
        </h1>

        {!sleeperUser && (
          <div className="flex justify-center">
            <SleeperLogin onLogin={handleLogin} />
          </div>
        )}

        {sleeperUser && (
          <div className="text-center space-y-4">
            <p className="text-lg">
              Logged in as <strong>{sleeperUser.username}</strong>
            </p>
            <select
              onChange={(e) => handleLeagueSelect(e.target.value)}
              className="p-2 border rounded text-lg"
            >
              <option value="">Select a league</option>
              {leagues.map((l) => (
                <option key={l.league_id} value={l.league_id}>
                  {l.name || l.metadata?.name || `League ${l.league_id}`}
                </option>
              ))}
            </select>

            {(sideA.length > 0 || sideB.length > 0 || selectedLeague) && (
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {(sideA.length > 0 || sideB.length > 0) && (
                  <button
                    onClick={clearTrade}
                    className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded shadow text-black font-semibold"
                  >
                    🔁 Clear Trade
                  </button>
                )}
                {selectedLeague && (
                  <button
                    onClick={clearLeague}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded shadow text-white font-semibold"
                  >
                    ❌ Clear League
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <TradeSide
            label="A"
            players={sideA}
            setPlayers={setSideA}
            addPlayer={(player) => handleAddPlayer("A", player)}
            allPlayers={
              sideOwners.B ? getFilteredPlayers(sideOwners.B) : allPlayers
            }
            recommendations={recommendations.A}
            owners={owners}
            selectedOwner={sideOwners.A}
            onOwnerSelect={(id) => setTeam("A", id)}
          />
          <TradeSide
            label="B"
            players={sideB}
            setPlayers={setSideB}
            addPlayer={(player) => handleAddPlayer("B", player)}
            allPlayers={
              sideOwners.A ? getFilteredPlayers(sideOwners.A) : allPlayers
            }
            recommendations={recommendations.B}
            owners={owners}
            selectedOwner={sideOwners.B}
            onOwnerSelect={(id) => setTeam("B", id)}
          />
        </div>

        {result && (
          <div className="text-center animate-pulse">
            <div className="inline-block bg-white border border-gray-300 rounded-lg px-6 py-4 shadow-md text-lg">
              <p className="mb-1">
                {sideOwners.A ? `${ownerMap[sideOwners.A]}: ` : "Side A: "}
                <span className="font-bold text-blue-700">{result.a}</span>
                {" vs "}
                {sideOwners.B ? `${ownerMap[sideOwners.B]}: ` : "Side B: "}
                <span className="font-bold text-green-700">{result.b}</span>
              </p>
              <p className="mt-1 font-semibold text-xl">
                {result.winner === "Even"
                  ? "⚖️ Even trade"
                  : result.winner === "A"
                    ? `🏆 ${ownerMap[sideOwners.A] || "Side A"} wins by ${result.diff}`
                    : `🏆 ${ownerMap[sideOwners.B] || "Side B"} wins by ${result.diff}`}
              </p>
            </div>
          </div>
        )}

        {sideA.length === 0 && sideB.length === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-700">
              💎 Top Available Players
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allPlayers.slice(0, 12).map((p) => (
                <div
                  key={p.id}
                  className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition hover:bg-blue-50"
                  onClick={() => handleAddPlayer("A", p)}
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.pos} – {p.team}
                  </p>
                  <p className="text-right text-blue-700 font-semibold">
                    {p.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
