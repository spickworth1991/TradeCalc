"use client";

import { useEffect, useState } from "react";
import TradeSide from "./components/TradeSide";
import PlayerCard from "./components/PlayerCard";
import SleeperLogin from "./components/SleeperLogin";

export default function Home() {
  const SAFE_MARGIN = 50;
  const [allPlayers, setAllPlayers] = useState([]);
  const [sideA, setSideA] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("sideA");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [sideB, setSideB] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("sideB");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [recommendations, setRecommendations] = useState({ A: [], B: [] });
  const [result, setResult] = useState(null);
  const [sleeperUser, setSleeperUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("sleeperUser");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("selectedLeague");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [owners, setOwners] = useState([]);
  const [ownerMap, setOwnerMap] = useState({});
  const [rosters, setRosters] = useState({});
  const [sideOwners, setSideOwners] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("sideOwners");
      return stored ? JSON.parse(stored) : { A: null, B: null };
    }
    return { A: null, B: null };
  });
  const [format, setFormat] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("format") || "dynasty";
    }
    return "dynasty";
  });

  const [superflex, setSuperflex] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("superflex") === "true";
    }
    return false;
  });


  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(
          `/api/values?format=${format}&superflex=${superflex}`
        );
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
        console.log(`📊 Loaded ${format} (${superflex ? "SF" : "1QB"}) values:`, values.slice(0, 3));
      } catch (err) {
        console.error("Error loading players:", err);
      }
    };

    fetchPlayers();
  }, [format, superflex]);

  // 🆕 Sync active trade player values after format changes
  useEffect(() => {
    const updateSideValues = (side, setSide) => {
      setSide((prev) =>
        prev.map((p) => {
          const updated = allPlayers.find((ap) => ap.id === p.id);
          return updated ? { ...p, value: updated.value } : p;
        })
      );
    };

    updateSideValues("A", setSideA);
    updateSideValues("B", setSideB);
  }, [allPlayers]);


  useEffect(() => {
    const total = (list) => list.reduce((sum, p) => sum + p.value, 0);
    const a = total(sideA);
    const b = total(sideB);
    const diff = Math.abs(a - b);
    const winner = a === b ? "Even" : a > b ? "A" : "B";

    setResult({ a, b, winner, diff });

    if (diff <= SAFE_MARGIN) {
      setRecommendations({ A: [], B: [] });
      return;
    }

    const selectedIds = new Set([...sideA, ...sideB].map((p) => p.id));
    const target = a > b ? "B" : "A";
    const missing = Math.abs(a - b);
    const newRecos = { A: [], B: [] };

    const opposingSide = target === "A" ? "B" : "A";
    const opposingOwnerId = sideOwners[opposingSide];
    const rosterFilter = opposingOwnerId ? rosters[opposingOwnerId] || [] : null;

    const possible = allPlayers.filter(
      (p) =>
        !selectedIds.has(p.id) &&
        (!rosterFilter || rosterFilter.includes(p.id))
    );

    const recos = possible
      .map((p) => ({ ...p, match: Math.abs(p.value - missing) }))
      .sort((a, b) => a.match - b.match)
      .slice(0, 5);

    newRecos[target] = recos;
    setRecommendations(newRecos);
  }, [sideA, sideB, allPlayers, sideOwners, rosters]);

  useEffect(() => {
    sessionStorage.setItem("sideA", JSON.stringify(sideA));
  }, [sideA]);

  useEffect(() => {
    sessionStorage.setItem("sideB", JSON.stringify(sideB));
  }, [sideB]);

  useEffect(() => {
    sessionStorage.setItem("selectedLeague", JSON.stringify(selectedLeague));
  }, [selectedLeague]);

  useEffect(() => {
    sessionStorage.setItem("sideOwners", JSON.stringify(sideOwners));
  }, [sideOwners]);

  useEffect(() => {
    if (sleeperUser) {
      sessionStorage.setItem("sleeperUser", JSON.stringify(sleeperUser));
    }
  }, [sleeperUser]);

  const handleLogin = async (username, userId) => {
    setSleeperUser({ username, userId });
    const season = new Date().getFullYear();
    const res = await fetch(
      `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`
    );
    const data = await res.json();
    setLeagues(Array.isArray(data) ? data : []);
  };

  const handleLeagueSelect = async (leagueId) => {
    const league = leagues.find((l) => l.league_id === leagueId);
    if (!league) return;
    setSelectedLeague(league);

    const usersRes = await fetch(
      `https://api.sleeper.app/v1/league/${leagueId}/users`
    );
    const users = await usersRes.json();
    setOwners(users);
    setOwnerMap(
      Object.fromEntries(users.map((u) => [u.user_id, u.display_name]))
    );

    const rosterRes = await fetch(
      `https://api.sleeper.app/v1/league/${leagueId}/rosters`
    );
    const data = await rosterRes.json();
    const map = {};
    data.forEach((r) => {
      map[r.owner_id] = r.players || [];
    });
    setRosters(map);
  };

  const changeFormat = (newFormat) => {
    setFormat(newFormat);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("format", newFormat);
    }
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
    setSleeperUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("sleeperUser");
    }
  };

  const handleAddPlayer = (side, player) => {
  const alreadyInSide = (list) => list.some((p) => p.id === player.id);
  const newSide = side === "A" ? sideA : sideB;

  if (alreadyInSide(newSide)) return;

  // Add player to the correct side
  if (side === "A") {
    setSideA((prev) => [...prev, player]);
  } else {
    setSideB((prev) => [...prev, player]);
  }

  // Auto-set other side's owner if not set, and this player belongs to them
  const otherSide = side === "A" ? "B" : "A";
  const thisSideOwner = sideOwners[side];
  const otherSideOwner = sideOwners[otherSide];

  // Only run this logic if league is selected, rosters exist, and one owner is missing
  if (selectedLeague && !otherSideOwner && Object.keys(rosters).length > 0) {
    for (const [ownerId, playerIds] of Object.entries(rosters)) {
      if (playerIds?.includes(player.id)) {
        setSideOwners((prev) => ({ ...prev, [otherSide]: ownerId }));
        break;
      }
    }
  }
};


  return (
    <main className="min-h-screen py-10 px-4 bg-gradient-to-br from-slate-100 to-gray-200 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-12">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 drop-shadow">
          🏈 Fantasy Trade Analyzer
        </h1>

        {/* Format Toggle Always Visible */}
        <div className="flex flex-col items-center mt-6 gap-2">
          <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full shadow-md border border-gray-300">
            <span className="text-sm font-medium text-gray-600">Format:</span>
            <button
              onClick={() => {
                setFormat("dynasty");
                sessionStorage.setItem("format", "dynasty");
              }}
              className={`w-20 py-1 rounded-full transition-all duration-300 text-sm font-semibold ${
                format === "dynasty"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Dynasty
            </button>
            <button
              onClick={() => {
                setFormat("redraft");
                sessionStorage.setItem("format", "redraft");
              }}
              className={`w-20 py-1 rounded-full transition-all duration-300 text-sm font-semibold ${
                format === "redraft"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Redraft
            </button>
          </div>

          {/* Superflex Toggle */}
          <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-1 rounded-full border shadow">
            <input
              type="checkbox"
              checked={superflex}
              onChange={(e) => {
                setSuperflex(e.target.checked);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("superflex", e.target.checked);
                }
              }}
              className="form-checkbox accent-indigo-600"
            />
            Superflex
          </div>
        </div>


        {!sleeperUser && (
          <div className="flex justify-center">
            <SleeperLogin onLogin={handleLogin} />
          </div>
        )}

        <div className="text-center space-y-4">
          {sleeperUser && (
            <p className="text-lg">
              Logged in as <strong>{sleeperUser.username}</strong>
            </p>
          )}

          {sleeperUser && (
            <select
              onChange={(e) => handleLeagueSelect(e.target.value)}
              className="p-2 border rounded text-lg"
              value={selectedLeague?.league_id || ""}
            >
              <option value="">Select a league</option>
              {leagues.map((l) => (
                <option key={l.league_id} value={l.league_id}>
                  {l.name || l.metadata?.name || `League ${l.league_id}`}
                </option>
              ))}
            </select>
          )}

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
              {selectedLeague && sleeperUser && (
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

        {/* Trade Interface */}
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

        {/* Trade Result */}
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
                  ? `🏆 ${ownerMap[sideOwners.A] || "Side A"} wins by ${
                      result.diff
                    }`
                  : `🏆 ${ownerMap[sideOwners.B] || "Side B"} wins by ${
                      result.diff
                    }`}
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
                <PlayerCard
                  key={p.id}
                  player={p}
                  onAdd={() => handleAddPlayer("A", p)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
