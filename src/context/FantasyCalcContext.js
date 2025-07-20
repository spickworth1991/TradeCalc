"use client";
import { createContext, useContext, useState, useEffect } from "react";

const FantasyCalcContext = createContext(null);

export function FantasyCalcProvider({ children }) {
  const [fantasyCalcValues, setFantasyCalcValues] = useState(null);

  useEffect(() => {
    fetch("/fantasycalc_cache.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded FantasyCalc data from static cache:", data);
        setFantasyCalcValues(data);
      })
      .catch((err) => {
        console.error("Failed to load FantasyCalc cache", err);
      });
  }, []);

  return (
    <FantasyCalcContext.Provider value={fantasyCalcValues}>
      {children}
    </FantasyCalcContext.Provider>
  );
}

export function useFantasyCalcData() {
  const context = useContext(FantasyCalcContext);
  if (!context) {
    console.warn("useFantasyCalcData must be used within FantasyCalcProvider");
  }
  return context;
}
