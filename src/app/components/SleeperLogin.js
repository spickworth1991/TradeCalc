"use client";
import { useState } from "react";
import { Analytics } from "@vercel/analytics/next"
export default function SleeperLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`https://api.sleeper.app/v1/user/${username}`);
      if (!res.ok) throw new Error("User not found");
      const data = await res.json();
      onLogin(username, data.user_id);
    } catch (err) {
      setError("Username not found. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <form
    onSubmit={handleSubmit}
    className="max-w-md mx-auto bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700 text-white"
  >
    <h2 className="text-xl font-bold mb-4 text-center text-blue-400">🔑 Sleeper Login</h2>
    <input
      type="text"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      placeholder="Enter Sleeper username"
      className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded mb-3 placeholder-gray-400"
    />
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded"
    >
      {loading ? "Loading..." : "Connect Sleeper"}
    </button>
    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
  </form>
);

}
