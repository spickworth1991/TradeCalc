"use client";

import { createContext, useContext, useEffect, useState } from "react";

const FantasyCalcContext = createContext();

/** Strip suffixes & punctuation so “Mahomes II” === “Mahomes” */
function normalizeName(str) {
  return str
    .toLowerCase()
    .replace(/\b(ii|iii|iv|jr|sr)\b/gi, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

/** Given raw fcData & dpData, build one combined array of players + picks */
function mergeFcAndDp(fcData, dpData, format, superflex) {
  const mergedMap = new Map();

  // 1) FantasyCalc pools
    const fcKey = `${format.charAt(0).toUpperCase() + format.slice(1)}_${superflex ? "SF" : "1QB"}`;
    (fcData[fcKey] || []).forEach((p) => {
      // support both real players (p.player) and synthetic picks (p.pick)
      const rawName =
        p.player?.name ||
        (typeof p.pick === "number" ? `${p.pick}th Pick` : null);
      if (!rawName) return;

      const key = normalizeName(rawName);
      const entry = mergedMap.get(key) || {
        id:      p.player?.sleeperId || `pick-${p.pick}`,
        name:    rawName,
        pos:     p.player?.position || (typeof p.pick === "number" ? "PICK" : ""),
        team:    p.player?.team     || "",
        value:   0,
        dpValue: 0,
      };

      entry.value = p.value || 0;
      mergedMap.set(key, entry);
    });
  // 2) DynastyProcess map
  Object.entries(dpData || {}).forEach(([name, entryData]) => {
    const key = normalizeName(name);
    const dpVal = superflex ? entryData.superflex : entryData.one_qb;
    const existing = mergedMap.get(key) || {
      id:      `dp_${key}`,
      name,
      pos:     name.includes("Pick") || name.includes("Round") ? "PICK" : entryData.pos,
      team:    entryData.team || "",
      value:   0,
      dpValue: 0,
    };

    existing.dpValue = dpVal || 0;
    mergedMap.set(key, existing);
  });

  return Array.from(mergedMap.values());
}

export function FantasyCalcProvider({ children }) {
  const [fcData, setFcData] = useState(null);
  const [dpData, setDpData] = useState(null);
  const [mergedPlayers, setMergedPlayers] = useState([]);
  const [format, setFormat] = useState("redraft");   // you can lift these to page if you already manage it there
  const [superflex, setSuperflex] = useState(true);

  // Fetch raw caches once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [fcRes, dpRes] = await Promise.all([
          fetch("/fantasycalc_cache.json"),
          fetch("/dynastyprocess_cache.json"),
        ]);
        const [fc, dp] = await Promise.all([fcRes.json(), dpRes.json()]);
        if (cancelled) return;
        setFcData(fc);
        setDpData(dp);
      } catch (e) {
        console.error("FantasyCalcContext load error:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Whenever raw data or mode flips, rebuild mergedPlayers
  useEffect(() => {
    if (!fcData || !dpData) return;
    const merged = mergeFcAndDp(fcData, dpData, format, superflex);
    setMergedPlayers(merged);
  }, [fcData, dpData, format, superflex]);

  return (
    <FantasyCalcContext.Provider
      value={{ mergedPlayers, format, setFormat, superflex, setSuperflex }}
    >
      {children}
    </FantasyCalcContext.Provider>
  );
}

export function useFantasyCalcData() {
  return useContext(FantasyCalcContext);
}
