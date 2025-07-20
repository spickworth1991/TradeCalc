// src/app/player-stock/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerStockPage() {
  const [username, setUsername] = useState("");
  const [onlyBestBall, setOnlyBestBall] = useState(false);
  const [excludeBestBall, setExcludeBestBall] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const params = new URLSearchParams({
      username,
      only_bestball: onlyBestBall ? "1" : "",
      exclude_bestball: excludeBestBall ? "1" : "",
    });

    router.push(`/player-stock/results?${params.toString()}`);
  };

  const toggleExclusive = (type) => {
    if (type === "only") {
      setOnlyBestBall(!onlyBestBall);
      if (!onlyBestBall) setExcludeBestBall(false);
    } else {
      setExcludeBestBall(!excludeBestBall);
      if (!excludeBestBall) setOnlyBestBall(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 py-12">
      <h1 className="text-3xl sm:text-5xl font-bold mb-8 text-center">
        PlayerStock - Sleeper Ownership
      </h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray-900 p-6 rounded-xl shadow-lg"
      >
        <label className="block mb-2 font-semibold" htmlFor="username">
          Sleeper Username
        </label>
        <input
          id="username"
          className="w-full mb-4 px-4 py-2 text-black rounded-md"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <fieldset className="mb-4">
          <legend className="font-semibold mb-2">Best Ball League Options</legend>
          <div className="flex flex-col gap-2">
            <label>
              <input
                type="checkbox"
                checked={onlyBestBall}
                onChange={() => toggleExclusive("only")}
              />{" "}
              Only Best Ball
            </label>
            <label>
              <input
                type="checkbox"
                checked={excludeBestBall}
                onChange={() => toggleExclusive("exclude")}
              />{" "}
              Exclude Best Ball
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 transition text-white font-semibold py-2 px-4 rounded"
        >
          Search
        </button>
      </form>
      <a
            href="/"
            className="inline-block px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-600 transition"
        >
            ⬅️ Return to Home
        </a>
    </main>
  );
}
