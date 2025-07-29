"use client";

import { useFantasyCalcData } from "@/context/FantasyCalcContext";
import { useSleeperData } from "@/context/SleeperDataContext";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import AvatarImage from "@/app/components/AvatarImage";
import Link from "next/link";
import LoadingScreen from "@/app/components/LoadingScreen";

export default function PlayerStockResults() {
  const {
    username,
    userId, // ✅ Pull this directly
    leagues,
    hydrated, // ✅ Use this from context
    getRostersForLeague,
    getPlayerDB,
  } = useSleeperData();

  const values = useFantasyCalcData();
  const searchParams = useSearchParams();
  const onlyBestBall = searchParams.get("only_bestball") === "1";
  const excludeBestBall = searchParams.get("exclude_bestball") === "1";

  const [players, setPlayers] = useState([]);
  const [leagueCount, setLeagueCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [highlightStarters, setHighlightStarters] = useState(false);
  const [fcMode, setFcMode] = useState("Dynasty_SF");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 15;

  const filteredPlayers = useMemo(() => {
    return players.filter(
      (p) =>
        (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!positionFilter || p.pos === positionFilter)
    );
  }, [players, searchTerm, positionFilter]);

  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredPlayers.length / pageSize);

  useEffect(() => {
    console.log("✅ Effect Triggered:", {
      hydrated,
      username,
      userId,
      leaguesLength: leagues?.length,
    });

    if (!hydrated) {
      console.log("⏸ Skipping fetch: Not hydrated yet.");
      return;
    }

    if (!username || !userId) {
      console.log("⏸ Skipping fetch: Missing username or userId.");
      return;
    }

    if (!leagues || leagues.length === 0) {
      console.log("⏸ Skipping fetch: No leagues yet.");
      return;
    }

    let abort = false;

    const fetchPlayerStock = async () => {
      console.log("🚀 Starting fetchPlayerStock for userId:", userId);
      setLoading(true);
      setLoadingDone(false);
      setError("");
      setPlayers([]);
      setProgress({ current: 0, total: 0 });

      try {
        console.log("📂 Filtering leagues...");
        const filteredLeagues = leagues.filter((lg) => {
          const isBestBall = lg.settings?.best_ball === 1;
          if (onlyBestBall && !isBestBall) return false;
          if (excludeBestBall && isBestBall) return false;
          return ["in_season", "drafting", "complete"].includes(lg.status);
        });

        if (!filteredLeagues.length) {
          if (!abort) setError("No leagues found with these filters.");
          return;
        }

        if (!abort) setProgress({ current: 0, total: filteredLeagues.length });
        console.log("✅ Filtered Leagues:", filteredLeagues.length);

        console.log("📥 Fetching Player DB...");
        const playerMap = await getPlayerDB();
        console.log("✅ Player DB loaded with", Object.keys(playerMap).length, "players");

        const ownershipMap = {};

        const fetchWithLimit = async (items, limit, fn) => {
          const results = [];
          let i = 0;
          const run = async () => {
            while (i < items.length) {
              const idx = i++;
              if (abort) return;
              try {
                console.log(`➡️ Fetching rosters for league ${items[idx].league_id} (${idx + 1}/${items.length})`);
                const result = await fn(items[idx], idx);
                results[idx] = result;
              } catch (err) {
                console.error(`❌ Failed to fetch league ${items[idx].league_id}:`, err);
              }
              if (!abort) {
                setProgress((prev) => ({ ...prev, current: prev.current + 1 }));
              }
            }
          };
          await Promise.all(Array.from({ length: limit }, run));
          return results.filter(Boolean);
        };

        console.log("📡 Fetching rosters with concurrency limit...");
        const results = await fetchWithLimit(filteredLeagues, 5, async (lg) => {
          const rosters = await getRostersForLeague(lg.league_id);
          return { lg, rosters };
        });

        console.log("✅ Finished fetching rosters for", results.length, "leagues");

        results.forEach(({ lg, rosters }) => {
          const myRoster = rosters.find((r) => r.owner_id === userId); // ✅ Now uses correct userId
          if (!myRoster) return;

          (myRoster.players || []).forEach((pid) => {
            if (!ownershipMap[pid]) ownershipMap[pid] = { count: 0, leagues: [], starters: [] };

            ownershipMap[pid].count += 1;
            ownershipMap[pid].leagues.push({ name: lg.name });

            if ((myRoster.starters || []).includes(pid)) {
              ownershipMap[pid].starters.push(lg.league_id);
            }
          });
        });

        console.log("✅ Ownership Map built for", Object.keys(ownershipMap).length, "players");

        const result = Object.entries(ownershipMap).map(([id, data]) => {
          const p = playerMap[id];
          return {
            id,
            name: p?.full_name || "Unknown Player",
            pos: p?.position || "UNK",
            count: data.count,
            leagues: data.leagues,
            isStarter: data.starters.length > 0,
          };
        });

        result.sort((a, b) => b.count - a.count);
        console.log("✅ Final Player List:", result.length, "players");

        if (!abort) {
          setPlayers(result);
          setLeagueCount(filteredLeagues.length);
        }
      } catch (err) {
        console.error(err);
        if (!abort) setError("Failed to load player stock data.");
      } finally {
        if (!abort) {
          setLoadingDone(true);
          setTimeout(() => {
            if (!abort) setLoading(false);
          }, 500);
        }
      }
    };

    fetchPlayerStock();

    return () => {
      console.log("🔒 Cleanup: aborting fetch");
      abort = true;
    };
  }, [hydrated, username, userId, leagues, onlyBestBall, excludeBestBall]);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10 flex flex-col items-center">
      <h1 className="text-3xl sm:text-5xl font-bold mb-6 text-center">
        Player Ownership for <span className="text-blue-400">{username}</span>
      </h1>

      <div className="flex items-center gap-4 mb-6">
        <p className="text-sm text-gray-400">{leagueCount} active leagues analyzed.</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={highlightStarters}
            onChange={() => setHighlightStarters(!highlightStarters)}
          />
          Highlight Starters
        </label>
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 rounded bg-gray-800 text-white placeholder-gray-500 border border-gray-600"
          />
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-600"
          >
            <option value="">All Positions</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
            <option value="K">K</option>
          </select>
        </div>
      </div>

      {loading && (
        <LoadingScreen
          done={loadingDone}
          text={`Loading Player Ownership... (${progress.current}/${progress.total})`}
          bgImage="/nfl-loading-bg.webp"
        />
      )}

      {error && <p className="text-red-500 text-lg">{error}</p>}

      {!loading && !error && (
        <>
          <div className="w-full max-w-3xl overflow-x-auto mb-4">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Pos</th>
                  <th className="px-3 py-2">Rostered</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.map((player, idx) => (
                  <tr
                    key={player.id}
                    className={`border-t cursor-pointer hover:bg-gray-800 ${
                      highlightStarters && player.isStarter ? "bg-blue-900 text-white" : "border-gray-700"
                    }`}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <td className="px-3 py-2">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="px-3 py-2 flex items-center gap-2">
                      <AvatarImage name={player.name} className="w-6 h-6 rounded-full border" />
                      {player.name}
                    </td>
                    <td className="px-3 py-2">{player.pos}</td>
                    <td className="px-3 py-2">{player.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-center mb-4 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  i + 1 === currentPage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/player-stock"
              className="inline-block px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition"
            >
              ⬅️ Return to Filters
            </Link>
            <a> </a>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition"
            >
              ⬅️ Return to Home
            </Link>
          </div>
        </>
      )}

      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-gray-900 p-6 rounded-xl max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-2 right-3 text-white text-2xl"
            >
              &times;
            </button>

            <div className="flex items-center gap-4 mb-4">
              <AvatarImage
                name={selectedPlayer.name}
                width={60}
                height={60}
                className="rounded-full border"
              />
              <div>
                <h2 className="text-xl font-bold">{selectedPlayer.name}</h2>
                <p className="text-sm text-gray-400">{selectedPlayer.pos}</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="fcMode" className="block text-sm text-gray-400 mb-1">
                FantasyCalc Format:
              </label>
              <select
                id="fcMode"
                value={fcMode}
                onChange={(e) => setFcMode(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white text-sm px-3 py-1 rounded w-full"
              >
                <option value="Dynasty_SF">Dynasty SF</option>
                <option value="Dynasty_1QB">Dynasty 1QB</option>
                <option value="Redraft_SF">Redraft SF</option>
                <option value="Redraft_1QB">Redraft 1QB</option>
              </select>
            </div>

            {(() => {
              let fc = null;
              if (selectedPlayer?.name && selectedPlayer?.pos && values?.[fcMode]) {
                fc = values[fcMode].find(
                  (p) =>
                    p?.player?.name?.toLowerCase() === selectedPlayer.name.toLowerCase() &&
                    p?.player?.position === selectedPlayer.pos
                );
              }

              if (!fc)
                return (
                  <p className="text-sm text-red-400 mb-4">
                    No FantasyCalc value found for this format.
                  </p>
                );
              return (
                <div className="text-sm text-white bg-blue-700 px-4 py-2 rounded-lg mb-4">
                  <p>
                    <strong>FantasyCalc Value:</strong> {fc.value}
                  </p>
                  <p className="text-xs text-gray-300">Format: {fcMode.replace("_", " ")}</p>
                </div>
              );
            })()}

            <p className="text-sm mb-2 text-blue-400">Rostered in:</p>
            <ul className="list-disc list-inside text-sm text-gray-200 space-y-1 max-h-64 overflow-y-auto">
              {selectedPlayer.leagues.map((lg, i) => (
                <li key={i}>{lg.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
