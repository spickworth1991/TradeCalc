"use client";
import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";
import TradeSide from "../components/TradeSide";
import { toSlug } from "@/utils/slugify";
import Image from "next/image";
import { useFantasyCalcData } from "@/context/FantasyCalcContext";
import Link from "next/link";
import { useSleeperData } from "@/context/SleeperDataContext";
import { useRouter } from "next/navigation";

// Normalize out suffixes & punctuation for key-matching
function normalizeName(str) {
  return str
    .toLowerCase()
    .replace(/\b(ii|iii|iv|jr|sr)\b/gi, "")  // strip suffixes
    .replace(/[^a-z0-9 ]/g, "")             // remove punctuation
    .trim();
}


export default function Home() {
  const SAFE_MARGIN = 50;
  const { username, leagues, getRostersForLeague } = useSleeperData();
  const router = useRouter();


  const VALUE_SOURCES = {
    FantasyCalc: { label: "FantasyCalc", supports: { dynasty: true, redraft: true } },
    DynastyProcess: { label: "DynastyProcess", supports: { dynasty: true, redraft: false } }
  };

  const [valueSource, setValueSource] = useState("FantasyCalc");


  // ✅ All hooks at top-level
  const [hasMounted, setHasMounted] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [sideA, setSideA] = useState(() => (typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("sideA") || "[]") : []));
  const [sideB, setSideB] = useState(() => (typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("sideB") || "[]") : []));
  const [recommendations, setRecommendations] = useState({ A: [], B: [] });
  const [result, setResult] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(() => (typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("selectedLeague") || "null") : null));
  const [positionFilter, setPositionFilter] = useState("");
  const [owners, setOwners] = useState([]);
  const [ownerMap, setOwnerMap] = useState({});
  const [rosters, setRosters] = useState({});
  const [sideOwners, setSideOwners] = useState(() => (typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("sideOwners") || '{"A":null,"B":null}') : { A: null, B: null }));
  const { mergedPlayers, format, setFormat, superflex, setSuperflex } = useFantasyCalcData();

  
  
  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!username) router.push("/");
  }, [username, router]);

  // ✅ Mark mounted for client-only UI
  useEffect(() => setHasMounted(true), []);

  useEffect(() => {
    const getVal = (p) => {
      return valueSource === "FantasyCalc" ? p.value || 0 : p.dpValue || 0;
    };

    const sorted = mergedPlayers
      .slice()
      .sort((a, b) => getVal(b) - getVal(a));
    setAllPlayers(sorted);
  }, [mergedPlayers, valueSource]);


// Whenever the source flips to DynastyProcess, force dynasty format
  useEffect(() => {
    if (valueSource === "DynastyProcess" && format !== "dynasty") {
      setFormat("dynasty");
      sessionStorage.setItem("format", "dynasty");
    }
  }, [valueSource, format, setFormat]);



const getPlayerValue = (p) => {
  if (!p) return 0;
  return valueSource === "FantasyCalc" ? p.value || 0 : p.dpValue || 0;
};



  // ✅ Update side values if format changes
  useEffect(() => {
    const updateSideValues = (setSide) => {
      setSide((prev) =>
        prev.map((p) => {
          const updated = allPlayers.find((ap) => ap.id === p.id);
          return updated ? { ...p, value: updated.value } : p;
        })
      );
    };
    updateSideValues(setSideA);
    updateSideValues(setSideB);
  }, [allPlayers]);

  // ✅ Calculate trade result & recommendations
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

    const possible = allPlayers.filter((p) => !selectedIds.has(p.id) && (!rosterFilter || rosterFilter.includes(p.id)));

    newRecos[target] = possible
      .map((p) => ({ ...p, match: Math.abs(p.value - missing) }))
      .sort((a, b) => a.match - b.match)
      .slice(0, 5);

    setRecommendations(newRecos);
  }, [sideA, sideB, allPlayers, sideOwners, rosters]);

  // ✅ Persist state in session
  useEffect(() => sessionStorage.setItem("sideA", JSON.stringify(sideA)), [sideA]);
  useEffect(() => sessionStorage.setItem("sideB", JSON.stringify(sideB)), [sideB]);
  useEffect(() => sessionStorage.setItem("selectedLeague", JSON.stringify(selectedLeague)), [selectedLeague]);
  useEffect(() => sessionStorage.setItem("sideOwners", JSON.stringify(sideOwners)), [sideOwners]);

  const handleLeagueSelect = async (leagueId) => {
    const league = leagues.find((l) => l.league_id === leagueId);
    if (!league) return;
    setSelectedLeague(league);

    const usersRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`);
    const users = await usersRes.json();
    setOwners(users);
    setOwnerMap(Object.fromEntries(users.map((u) => [u.user_id, u.display_name])));

    const data = await getRostersForLeague(leagueId);
    const map = {};
    data.forEach((r) => (map[r.owner_id] = r.players || []));
    setRosters(map);
  };

  const changeFormat = (newFormat) => {
    setFormat(newFormat);
    if (typeof window !== "undefined") sessionStorage.setItem("format", newFormat);
  };

  const getFilteredPlayers = (ownerId) => (!ownerId || !rosters[ownerId] ? [] : allPlayers.filter((p) => rosters[ownerId].includes(p.id)));

  const handleAddPlayer = (side, player) => {
    const newSide = side === "A" ? sideA : sideB;
    if (newSide.some((p) => p.id === player.id)) return;

    if (side === "A") setSideA((prev) => [...prev, player]);
    else setSideB((prev) => [...prev, player]);

    const otherSide = side === "A" ? "B" : "A";
    const otherSideOwner = sideOwners[otherSide];
    if (selectedLeague && !otherSideOwner && Object.keys(rosters).length > 0) {
      for (const [ownerId, playerIds] of Object.entries(rosters)) {
        if (playerIds?.includes(player.id)) {
          setSideOwners((prev) => ({ ...prev, [otherSide]: ownerId }));
          break;
        }
      }
    }
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

  if (!username) return null;

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
                onClick={() => {
                    if (valueSource === "DynastyProcess") {
                      alert("Sorry—DynastyProcess only supports Dynasty mode.");
                      return;
                    }
                        const next = format === "redraft" ? "dynasty" : "redraft";
                        setFormat(next);
                        sessionStorage.setItem("format", next);
                  }}
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

            <div className="text-center space-y-4">
              <p className="text-lg">
                Logged in as <strong>{username}</strong>
              </p>

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
            </div>

            <div className="flex flex-col items-center gap-2">
              <label className="font-semibold">Value Source:</label>
              <select
                value={valueSource}
                onChange={(e) => setValueSource(e.target.value)}
                className="bg-gray-800 text-white p-2 rounded"
              >
                {Object.keys(VALUE_SOURCES).map((src) => (
                  <option key={src} value={src}>{VALUE_SOURCES[src].label}</option>
                ))}
              </select>
            </div>

        

            {/* QB Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium"></span>
              <div
                onClick={() => {
                  setSuperflex(!superflex);
                  sessionStorage.setItem("superflex", (!superflex).toString());
                }}

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
                recommendations={recommendations.A}
                getPlayerValue={getPlayerValue}
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
                recommendations={recommendations.B}
                getPlayerValue={getPlayerValue}
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
                        unoptimized
                        onError={(e) => (e.currentTarget.src = "/avatars/default.webp")}
                      />

                      <div>
                        <a href={`https://www.nfl.com/players/${p.name.toLowerCase().replace(/\s+/g, "-")}`} target="_blank" className="text-indigo-400 hover:underline text-sm">{p.name}</a>
                        <p className="text-xs text-gray-400">Value: {getPlayerValue(p)}</p>
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