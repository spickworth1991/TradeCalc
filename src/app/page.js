// src/app/page.js
"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/values`)
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-4">
      <h1 className="text-4xl sm:text-6xl font-bold mb-8 text-center">
        The Fantasy Arsenal<span className="text-blue-400"> by StickyPicky</span>
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 w-full max-w-4xl">
        <Link href="/trade" className="tool-card">
          <div className="border border-blue-500 p-6 rounded-2xl hover:bg-blue-900 transition">
            <h2 className="text-xl font-semibold mb-2">Trade Calculator</h2>
            <p>Analyze trades with FantasyCalc values. Connect Sleeper for a personalized experience.</p>
            <p>More Trade Values to come.</p>
          </div>
        </Link>

        <Link href="/player-stock" className="tool-card">
          <div className="border border-blue-500 p-6 rounded-2xl hover:bg-blue-900 transition">
            <h2 className="text-xl font-semibold mb-2">Player Stock</h2>
            <p>See player ownership and exposure stats. Filter by position. Highlight Starters. </p>
          </div>
        </Link>

        <div className="border border-blue-500 p-6 rounded-2xl opacity-50">
          <h2 className="text-xl font-semibold mb-2">More Coming Soon</h2>
          <p>Additional tools will be added here.</p>
        </div>
      </div>
    </main>
  );
}
