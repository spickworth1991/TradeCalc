"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SleeperDataContext = createContext();

export function SleeperDataProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [userId, setUserId] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [rosters, setRosters] = useState({});
  const [players, setPlayers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // ✅ Restore from sessionStorage on page load
  useEffect(() => {
    const cached = sessionStorage.getItem("sleeperData");
    if (cached) {
      const parsed = JSON.parse(cached);
    //   console.log("🔍 Restoring from cache:", parsed);
      setUsername(parsed.username || null);
      setYear(parsed.year || new Date().getFullYear());
      setUserId(parsed.userId || null);
      setLeagues(parsed.leagues || []);
    } else {
    //   console.log("ℹ️ No cached Sleeper data found.");
    }
    setHydrated(true);
  }, []);

  const saveToCache = (data) => {
    // console.log("💾 Saving to sessionStorage:", data);
    sessionStorage.setItem("sleeperData", JSON.stringify(data));
  };

  const login = async (uname, yr) => {
    try {
      setLoading(true);
      setError("");

    //   console.log(`🔑 Logging in as ${uname} for year ${yr}...`);

      // ✅ Fetch user info
      const userRes = await fetch(`https://api.sleeper.app/v1/user/${uname}`);
      if (!userRes.ok) throw new Error("User not found");
      const user = await userRes.json();

      // ✅ Fetch leagues
      const leaguesRes = await fetch(
        `https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${yr}`
      );
      let leaguesData = await leaguesRes.json();
      leaguesData = leaguesData.filter(
        (lg) => lg.status === "in_season" || lg.status === "pre_draft"
      );

      setUsername(uname);
      setYear(yr);
      setUserId(user.user_id);
      setLeagues(leaguesData);

      saveToCache({
        username: uname,
        year: yr,
        userId: user.user_id,
        leagues: leaguesData,
      });

      console.log("✅ Login success. User ID:", user.user_id);
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (username && year) {
      await login(username, year);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("sleeperData");
    setUsername(null);
    setUserId(null);
    setLeagues([]);
    setRosters({});
    setPlayers(null);
  };


  const getRostersForLeague = useCallback(
    async (leagueId) => {
      if (rosters[leagueId]) return rosters[leagueId];
      const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
      if (!res.ok) throw new Error("Failed to fetch rosters");
      const data = await res.json();
      setRosters((prev) => ({ ...prev, [leagueId]: data }));
      return data;
    },
    [rosters]
  );

  const getPlayerDB = async () => {
    if (players) return players;
    const res = await fetch("https://api.sleeper.app/v1/players/nfl");
    const data = await res.json();
    setPlayers(data);
    return data;
  };

  return (
    <SleeperDataContext.Provider
      value={{
        username,
        year,
        userId,
        leagues,
        hydrated,
        login,
        refresh,
        logout,
        getRostersForLeague,
        getPlayerDB,
        loading,
        error,
      }}
    >
      {children}
    </SleeperDataContext.Provider>
  );
}

export function useSleeperData() {
  return useContext(SleeperDataContext);
}
