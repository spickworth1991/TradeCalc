"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBox from "../components/SearchBox";
import Link from "next/link";
import LoadingScreen from "@/app/components/LoadingScreen";

export default function PlayerAvailabilityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const username = searchParams.get("username") || "";
  const onlyBestBall = searchParams.get("only_bestball") === "1";
  const excludeBestBall = searchParams.get("exclude_bestball") === "1";

  const [searchedPlayerName, setSearchedPlayerName] = useState("");
  const [loadingDone, setLoadingDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingDone(false);
        setError("");

        const userRes = await fetch(`https://api.sleeper.app/v1/user/${username}`);
        if (!userRes.ok) throw new Error("User not found");
        const user = await userRes.json();

        const year = new Date().getFullYear();
        const leaguesRes = await fetch(
          `https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${year}`
        );
        let leaguesData = await leaguesRes.json();

        leaguesData = leaguesData.filter((league) => {
          if (league.status !== "in_season") return false;
          const isBestBall = league.settings?.best_ball === 1;
          if (onlyBestBall && !isBestBall) return false;
          if (excludeBestBall && isBestBall) return false;
          return true;
        });

        if (!leaguesData.length) {
          setError("No leagues found with these filters.");
          setLeagues([]);
          return;
        }

        await Promise.all(
          leaguesData.map(async (league) => {
            const rosterRes = await fetch(
              `https://api.sleeper.app/v1/league/${league.league_id}/rosters`
            );
            league.rosters = await rosterRes.json();
          })
        );

        const playerRes = await fetch("https://api.sleeper.app/v1/players/nfl");
        const playerMap = await playerRes.json();
        const normalizedPlayers = Object.entries(playerMap)
          .filter(([id, p]) => p.full_name)
          .map(([id, p]) => ({
            id,
            name: p.full_name,
            pos: p.position,
          }));

        setPlayers(normalizedPlayers);
        setLeagues(leaguesData);
      } catch (err) {
        console.error(err);
        setError("Failed to load data. Check username and try again.");
      } finally {
        setLoadingDone(true);
        setTimeout(() => {
          setLoading(false);
        }, 750);
      }
    };

    fetchData();
  }, [username, onlyBestBall, excludeBestBall]);

  const checkAvailability = (player) => {
    const target = player || selectedPlayer;
    if (!target) return;

    const unrostered = leagues.filter((league) => {
      const allRosteredPlayers = league.rosters.flatMap((r) => r.players || []);
      return !allRosteredPlayers.includes(target.id);
    });

    setResults(unrostered);
    setSearchedPlayerName(target.name);
  };

  if (!username) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 py-12">
        <h1 className="text-3xl sm:text-5xl font-bold mb-8 text-center">
          Player Availability Checker
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const uname = formData.get("username");
            const only = formData.get("only_bestball") ? "1" : "";
            const exclude = formData.get("exclude_bestball") ? "1" : "";
            router.push(
              `/player-availability?username=${uname}&only_bestball=${only}&exclude_bestball=${exclude}`
            );
          }}
          className="w-full max-w-md bg-gray-900 p-6 rounded-xl shadow-lg"
        >
          <label className="block mb-2 font-semibold">Sleeper Username</label>
          <input
            name="username"
            className="w-full mb-4 px-4 py-2 text-black rounded-md"
            required
          />
          <fieldset className="mb-4">
            <legend className="font-semibold mb-2">Best Ball Options</legend>
            <label className="block">
              <input type="checkbox" name="only_bestball" /> Only Best Ball
            </label>
            <label className="block">
              <input type="checkbox" name="exclude_bestball" /> Exclude Best Ball
            </label>
          </fieldset>
          <button
            type="submit"
            className="w-full bg-blue-800 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Search
          </button>
        </form>
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

      {loading && (
        <LoadingScreen
          done={loadingDone}
          text="Fetching Your Leagues..."
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
                        <a
                          href={`https://sleeper.app/leagues/${league.league_id}`}
                          target="_blank"
                          className="text-blue-400 hover:underline"
                        >
                          View
                        </a>
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
