"use client";

import Link from "next/link";
import { useState } from "react";
import { useSleeperData } from "@/context/SleeperDataContext";

export default function Home() {
  const { username, year, leagues, login, loading, error } = useSleeperData();
  const [unameInput, setUnameInput] = useState("");
  const [yearInput, setYearInput] = useState(new Date().getFullYear());

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(unameInput, yearInput);
  };

  const isLoggedIn = !!username;

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-black text-white px-4 py-10">
      <h1 className="text-4xl sm:text-6xl font-bold mb-8 text-center">
        The Fantasy Arsenal<span className="text-blue-400"> by StickyPicky</span>
      </h1>

      {/* Sleeper Login Section */}
      {!isLoggedIn ? (
        <form
          onSubmit={handleLogin}
          className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-md mb-10"
        >
          <label className="block mb-2 font-semibold">Sleeper Username</label>
          <input
            type="text"
            value={unameInput}
            onChange={(e) => setUnameInput(e.target.value)}
            required
            className="w-full mb-4 px-4 py-2 text-black rounded-md"
          />

          <label className="block mb-2 font-semibold">Season Year</label>
          <input
            type="number"
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value)}
            required
            className="w-full mb-4 px-4 py-2 text-black rounded-md"
          />

          {error && <p className="text-red-500 mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 hover:bg-blue-600 transition text-white font-semibold py-2 px-4 rounded"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      ) : (
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-full max-w-md mb-10 text-center">
          <p className="text-lg mb-1">
            ✅ Logged in as <span className="font-bold">{username}</span>
          </p>
          <p className="text-sm text-gray-400 mb-1">Year: {year}</p>
          <p className="text-sm text-gray-400">Leagues Loaded: {leagues.length}</p>
        </div>
      )}

      {/* Tools Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 w-full max-w-4xl">
        <ToolCard
          href="/trade"
          title="Trade Calculator"
          desc="Analyze trades with FantasyCalc values. Connect Sleeper for a personalized experience."
          active={isLoggedIn}
        />

        <ToolCard
          href="/player-stock"
          title="Player Stock"
          desc="See player ownership and exposure stats. Filter by position. Highlight Starters."
          active={isLoggedIn}
        />

        <ToolCard
          href="/player-availability"
          title="Player Availability"
          desc="Check all your leagues to find where a player is unrostered. Quick and easy way to spot free agents."
          active={isLoggedIn}
        />

        <div className="border border-blue-500 p-6 rounded-2xl opacity-50">
          <h2 className="text-xl font-semibold mb-2">More Coming Soon</h2>
          <p>Additional tools will be added here.</p>
        </div>
      </div>
    </main>
  );
}

function ToolCard({ href, title, desc, active }) {
  const cardContent = (
    <div
      className={`border border-blue-500 p-6 rounded-2xl ${
        active ? "hover:bg-blue-900 transition cursor-pointer" : "opacity-50"
      }`}
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p>{desc}</p>
    </div>
  );

  return active ? <Link href={href}>{cardContent}</Link> : <div>{cardContent}</div>;
}
