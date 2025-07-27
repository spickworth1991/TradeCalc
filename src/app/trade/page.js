"use client";
import { Analytics } from "@vercel/analytics/next"
import { useEffect, useState } from "react";
import TradeSide from "../components/TradeSide";
import PlayerCard from "../components/PlayerCard";
import SleeperLogin from "../components/SleeperLogin";
import { toSlug } from "@/utils/slugify";
import Image from 'next/image';
import { useFantasyCalcData } from "@/context/FantasyCalcContext";
import Link from "next/link";



export default function Home() {
  const SAFE_MARGIN = 50;

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  
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
  const [positionFilter, setPositionFilter] = useState("");
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
      return sessionStorage.getItem("format") || "redraft";
    }
    return "redraft";
  });

  const [superflex, setSuperflex] = useState(() => {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("superflex");
    return stored !== null ? stored === "true" : true; // ✅ Default to true
  }
  return true; // ✅ Server-side default
});

  const calcData = useFantasyCalcData();
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const formatKey = `${format.charAt(0).toUpperCase() + format.slice(1)}_${superflex ? "SF" : "1QB"}`;
        if (!calcData || !calcData[formatKey]) {
          console.warn(`⚠️ No data found for formatKey: ${formatKey}`);
        }

        const values = calcData?.[formatKey] || [];


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
        console.log(
          `📊 Loaded ${format} (${superflex ? "SF" : "1QB"}) values:`,
          values.slice(0, 3),
        );
      } catch (err) {
        console.error("Error loading players:", err);
      }
    };

    fetchPlayers();
  }, [format, superflex, calcData]);

  // 🆕 Sync active trade player values after format changes
  useEffect(() => {
    const updateSideValues = (side, setSide) => {
      setSide((prev) =>
        prev.map((p) => {
          const updated = allPlayers.find((ap) => ap.id === p.id);
          return updated ? { ...p, value: updated.value } : p;
        }),
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
    <main className="min-h-screen py-10 px-4 bg-black text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        <h1 className="text-4xl font-extrabold text-center text-blue-400 drop-shadow">
          🏈 Fantasy Trade Analyzer
        </h1>

        {/* ✅ Toggles */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            {/* Format Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium"></span>
              <div
                onClick={() => setFormat(format === "redraft" ? "dynasty" : "redraft")}
                className={`relative w-44 h-10 rounded-full cursor-pointer transition-all duration-300 flex items-center ${
                  format === "redraft" ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-20 h-8 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center text-sm font-bold text-black ${
                    format === "redraft" ? "translate-x-0" : "translate-x-22"
                  }`}
                  style={{ transform: format === "redraft" ? "translateX(0)" : "translateX(90px)" }}
                >
                  {format === "redraft" ? "Redraft" : "Dynasty"}
                </div>
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
              className="p-2 rounded bg-gray-800 text-white border border-gray-600 text-lg"
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

          {hasMounted && (sideA.length > 0 || sideB.length > 0 || selectedLeague) && (
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
        

            {/* QB Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium"></span>
              <div
                onClick={() => setSuperflex(!superflex)}
                className={`relative w-44 h-10 rounded-full cursor-pointer transition-all duration-300 flex items-center ${
                  superflex ? "bg-blue-600" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-20 h-8 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center text-sm font-bold text-black ${
                    superflex ? "translate-x-22" : "translate-x-0"
                  }`}
                  style={{ transform: superflex ? "translateX(90px)" : "translateX(0)" }}
                >
                  {superflex ? "Superflex" : "1 QB"}
                </div>
              </div>
            </div>
          </div>



        

        {/* ✅ Responsive Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
            {/* TradeSides */}
            <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
              <TradeSide
                label="A"
                players={sideA}
                setPlayers={setSideA}
                addPlayer={(p) => handleAddPlayer("A", p)}
                allPlayers={sideOwners.B ? getFilteredPlayers(sideOwners.B) : allPlayers}
                owners={owners}
                selectedOwner={sideOwners.A}
                onOwnerSelect={(id) => setSideOwners((prev) => ({ ...prev, A: id }))}
              />
              <TradeSide
                label="B"
                players={sideB}
                setPlayers={setSideB}
                addPlayer={(p) => handleAddPlayer("B", p)}
                allPlayers={sideOwners.A ? getFilteredPlayers(sideOwners.A) : allPlayers}
                owners={owners}
                selectedOwner={sideOwners.B}
                onOwnerSelect={(id) => setSideOwners((prev) => ({ ...prev, B: id }))}
              />
            </div>

           {/* ✅ Top 10 Players Sidebar */}
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h3 className="text-indigo-400 font-semibold text-center mb-4">💎 Top 10 Players</h3>
            <div className="mb-3">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm"
              >
                <option value="">All Positions</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
              </select>
            </div>
            <ul className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2">
              {allPlayers
                .filter((p) => !positionFilter || p.pos === positionFilter)
                .slice(0, 10)
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={`/avatars/${toSlug(p.name)}.webp`}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="rounded"
                      />
                      <div>
                        <a href={`https://www.nfl.com/players/${p.name.toLowerCase().replace(/\s+/g, "-")}`} target="_blank" className="text-indigo-400 hover:underline text-sm">{p.name}</a>
                        <p className="text-xs text-gray-400">Value: {p.value}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleAddPlayer("A", p)} className="bg-blue-600 text-white text-xs px-6 py-2 rounded">A</button>
                      <button onClick={() => handleAddPlayer("B", p)} className="bg-green-600 text-white text-xs px-6 py-2 rounded">B</button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}