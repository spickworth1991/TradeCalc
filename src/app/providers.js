"use client";

import Navbar from "@/app/components/Navbar";
import { FantasyCalcProvider } from "@/context/FantasyCalcContext";
import { SleeperDataProvider } from "@/context/SleeperDataContext";

export default function ClientProviders({ children }) {
  return (
    <FantasyCalcProvider values={null}>
      <SleeperDataProvider>
        <Navbar />
        {children}
      </SleeperDataProvider>
    </FantasyCalcProvider>
  );
}
