"use client";

import { useState, useEffect } from "react";
import { useSleeperData } from "@/context/SleeperDataContext";
import SearchBox from "../components/SearchBox";
import Link from "next/link";
import LoadingScreen from "@/app/components/LoadingScreen";

export default function PlayerAvailabilityContent() {
  const { username, userId, leagues, getRostersForLeague, getPlayerDB, hydrated } = useSleeperData();

  const [searchedPlayerName, setSearchedPlayerName] = useState("");
  const [loadingDone, setLoadingDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [onlyBestBall, setOnlyBestBall] = useState(false);
  const [excludeBestBall, setExcludeBestBall] = useState(false);

  useEffect(() => {
    if (!hydrated) return; // Wait for context hydration

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingDone(false);
        setError("");

        if (!username || !userId) {
          setError("Please log in first.");
          return;
        }

        if (!leagues || leagues.length === 0) {
          setError("No leagues found. Make sure you're logged in.");
          return;
        }

        // ✅ Load Sleeper Player DB (cached)
        const playerMap = await getPlayerDB();
        const normalizedPlayers = Object.entries(playerMap)
          .filter(([id, p]) => p.full_name)
          .map(([id, p]) => ({
            id,
            name: p.full_name,
            pos: p.position,
          }));

        setPlayers(normalizedPlayers);
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoadingDone(true);
        setTimeout(() => setLoading(false), 750);
      }
    };

    fetchData();
  }, [hydrated, username, userId, leagues, getPlayerDB]);

  const checkAvailability = async (player) => {
    const target = player || selectedPlayer;
    if (!target) return;

    try {
      setLoading(true);
      setLoadingDone(false);
      setResults([]);

      const filteredLeagues = leagues.filter((lg) => {
        const isBestBall = lg.settings?.best_ball === 1;
        if (onlyBestBall && !isBestBall) return false;
        if (excludeBestBall && isBestBall) return false;
        return lg.status === "in_season" || lg.status === "drafting" || lg.status === "complete";
      });

      const availabilityResults = [];

      for (const lg of filteredLeagues) {
        const rosters = await getRostersForLeague(lg.league_id);
        const allPlayers = rosters.flatMap((r) => r.players || []);

        if (!allPlayers.includes(target.id)) {
          availabilityResults.push(lg);
        }
      }

      setResults(availabilityResults);
      setSearchedPlayerName(target.name);
    } catch (err) {
      console.error(err);
      setError("Failed to check availability.");
    } finally {
      setLoadingDone(true);
      setTimeout(() => setLoading(false), 750);
    }
  };

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Initializing...</p>
      </main>
    );
  }

  if (!username) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 py-12">
        <h1 className="text-3xl sm:text-5xl font-bold mb-8 text-center">
          Player Availability Checker
        </h1>
        <p className="text-gray-400 mb-4">Please log in from the homepage first.</p>
        <Link
          href="/"
          className="mt-4 inline-block px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-600"
        >
          ⬅️ Return to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">
        Player Availability for {username}
      </h1>

      {/* ✅ Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyBestBall}
            onChange={() => setOnlyBestBall(!onlyBestBall)}
          />
          Only Best Ball
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={excludeBestBall}
            onChange={() => setExcludeBestBall(!excludeBestBall)}
          />
          Exclude Best Ball
        </label>
      </div>

      {loading && (
        <LoadingScreen
          done={loadingDone}
          text="Loading Player Data..."
          bgImage="/nfl-loading-bg.webp"
        />
      )}

      {error && <p className="text-red-400 text-center">{error}</p>}

      {!loading && players.length > 0 && (
        <div className="max-w-2xl mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
          <SearchBox
            players={players}
            onSelectAndSearch={(player) => {
              setSelectedPlayer(player);
              checkAvailability(player);
            }}
          />

          <div className="mt-6">
            {searchedPlayerName ? (
              results.length > 0 ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchedPlayerName} is available in {results.length} league
                    {results.length !== 1 ? "s" : ""}:
                  </h3>
                  <ul className="divide-y divide-gray-700">
                    {results.map((league) => (
                      <li
                        key={league.league_id}
                        className="py-2 flex justify-between"
                      >
                        <span>{league.name}</span>
                        <div className="flex gap-4">
                          <a
                            href={`sleeper://league/${league.league_id}`}
                            className="text-green-400 hover:underline"
                          >
                            Open in App
                          </a>
                          <a
                            href={`https://www.sleeper.app/leagues/${league.league_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            View in Browser
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-400 text-center">
                  {searchedPlayerName} is rostered in all your leagues.
                </p>
              )
            ) : (
              <p className="text-gray-500 text-center">
                Select a player to check availability.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
