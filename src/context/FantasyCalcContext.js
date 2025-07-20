"use client";
import { createContext, useContext, useState, useEffect } from "react";

const FantasyCalcContext = createContext();

export function FantasyCalcProvider({ children, values }) {
  const [fantasyCalcValues, setFantasyCalcValues] = useState(values || null);

  // If no values were passed from the server, fallback to fetch (optional)
  useEffect(() => {
    if (!fantasyCalcValues) {
      fetch("/fc-values.json")
        .then((res) => res.json())
        .then((data) => {
          console.log("Loaded FantasyCalc data from client:", data);
          setFantasyCalcValues(data);
        })
        .catch((err) => {
          console.error("Failed to load FantasyCalc data on client", err);
        });
    } else {
      console.log("FantasyCalc values provided by server:", fantasyCalcValues);
    }
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
