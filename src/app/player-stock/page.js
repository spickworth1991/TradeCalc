"use client";

import { useSleeperData } from "@/context/SleeperDataContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PlayerStockPage() {
  const { username } = useSleeperData();
  const router = useRouter();
  const [onlyBestBall, setOnlyBestBall] = useState(false);
  const [excludeBestBall, setExcludeBestBall] = useState(false);

useEffect(() => {
  if (!username) {
    router.push("/");
  }
}, [username, router]);

if (!username) {
  return null; // prevent rendering while redirecting
}


  const handleSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams({
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
        <p className="text-center mb-4">Logged in as <strong>{username}</strong></p>

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
          className="w-full bg-blue-800 hover:bg-blue-600 transition text-white font-semibold py-2 px-4 rounded"
        >
          View Player Stock
        </button>
      </form>
      <Link href="/" className="inline-block mt-4 px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-600 transition">⬅️ Return to Home</Link>
    </main>
  );
}
