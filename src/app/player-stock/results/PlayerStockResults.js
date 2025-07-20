"use client";
import { useFantasyCalcData } from "@/context/FantasyCalcContext";
import { useEffect, useState,  } from "react";
import { useSearchParams } from "next/navigation";
import { toSlug } from "@/utils/slugify";
import AvatarImage from "@/app/components/AvatarImage";
import Link from "next/link";

export default function PlayerStockResults() {
  const [loadingLeagueCount, setLoadingLeagueCount] = useState(null); 
  const [loadingDone, setLoadingDone] = useState(false);
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  const onlyBestBall = searchParams.get("only_bestball");
  const excludeBestBall = searchParams.get("exclude_bestball");
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const values = useFantasyCalcData();
  console.log("FantasyCalc values:", values);
  const [players, setPlayers] = useState([]);
  const [leagueCount, setLeagueCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightStarters, setHighlightStarters] = useState(false);
  const [fcMode, setFcMode] = useState("Dynasty_SF");



  
  const pageSize = 15;
  const filteredPlayers = players.filter(
        (p) =>
            (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!positionFilter || p.pos === positionFilter)
    );
    const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
    );
    const totalPages = Math.ceil(filteredPlayers.length / pageSize);


  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
        try {
            setLoading(true);



            const query = new URLSearchParams({
            username,
            only_bestball: onlyBestBall || "",
            exclude_bestball: excludeBestBall || "",
            });

            const res = await fetch(`/api/player-stock?${query.toString()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Unknown error");

            setLoadingLeagueCount(data.leagueCount); // trigger loading bar
            setPlayers(data.players);
            setLeagueCount(data.leagueCount);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDone(true);
            setTimeout(() => {
                setLoading(false);
            }, 750); // Give bar time to visibly reach 100%
        }
    };


    fetchData();
  }, [username, onlyBestBall, excludeBestBall]);

  const nflFacts = [
  "Jerry Rice holds the record for most career touchdowns.",
  "Tom Brady has won 7 Super Bowl titles.",
  "The NFL was founded in 1920 as the APFA.",
  "The 1972 Dolphins had the only perfect season.",
  "The Chiefs have appeared in 6 Super Bowls.",
  "The longest NFL field goal is 66 yards (Justin Tucker).",
  "The NFL draft was first held in 1936.",
  "The Steelers and Patriots both have 6 Super Bowl wins.",
];

function LoadingScreen({ done }) {
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  const estimatedTime = 15000; // ~5 seconds to 95%


  useEffect(() => {
    const intervalTime = estimatedTime / 95;
    let interval;
    let factInterval;

    if (!done) {
        interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 95));
        }, intervalTime);
    } else {
        // Immediately jump to 100%
        setProgress(100);
    }

    factInterval = setInterval(() => {
        setFactIndex(prev => (prev + 1) % nflFacts.length);
    }, 3000);

    return () => {
        clearInterval(interval);
        clearInterval(factInterval);
    };
  }, [done]);


  return (
    <div
      className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center z-50 bg-cover bg-center"
      style={{ backgroundImage: "url('/nfl-loading-bg.webp')" }}
    >
      <div className="bg-black bg-opacity-60 p-6 rounded-lg text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Loading Player Ownership...</h2>
        <p className="text-sm text-gray-300 italic mb-4">{nflFacts[factIndex]}</p>

        <div className="relative w-full max-w-md h-16 bg-green-800 border-4 border-white rounded-lg overflow-hidden mx-auto">
        {/* Yard markers */}
        <div className="absolute inset-0 flex justify-between items-center text-white text-[10px] font-bold opacity-30 px-1">
            {[...Array(11)].map((_, i) => (
            <div key={i} className="flex flex-col items-center w-[10%]">
                <div className="w-px h-full bg-white opacity-50" />
                <span>{i * 10}</span>
            </div>
            ))}
        </div>

        {/* Progress overlay (transparent, used for width only) */}
        <div
            className="absolute top-0 bottom-0 left-0 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
        />

        {/* Running player icon */}
        <img
            src="/runner.webp"
            alt="Running player"
            className="absolute bottom-0 w-10 h-10 transition-all duration-200"
            style={{ left: `calc(${progress}% - 20px)` }}
        />
        </div>


        <p className="text-xs text-gray-400 mt-2">
          {progress < 100 ? `${Math.round(progress)}%` : "✅ Complete"}
        </p>
      </div>
    </div>
  );
}




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
        <LoadingScreen done={loadingDone} />
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
                        <AvatarImage
                          name={player.name}
                          className="w-6 h-6 rounded-full border"
                        />

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
            <Link href="/" className="inline-block px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition">⬅️ Return to Username Search</Link>
            <a> </a>
            <Link href="/" className="inline-block px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition">⬅️ Return to Home</Link>
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
                  <p><strong>FantasyCalc Value:</strong> {fc.value}</p>
                  <p className="text-xs text-gray-300">Format: {fcMode.replace("_", " ")}</p>
                </div>
              );

            })()}

            <p className="text-sm mb-2 text-blue-400">Rostered in:</p>
            <ul className="list-disc list-inside text-sm text-gray-200 space-y-1 max-h-64 overflow-y-auto">
              {selectedPlayer.leagues.map((lg, i) => (
                <li key={i}>
                  {lg.name}{" "}
                  {lg.isStarter && <span className="text-green-400">(Starter)</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </main>
  );
}
