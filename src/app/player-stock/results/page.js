"use client";


import dynamic from "next/dynamic";
import { Suspense } from "react";

const PlayerStockResults = dynamic(() => import("./PlayerStockResults.js"), {
  ssr: false,
});


export default function Page() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <PlayerStockResults />
    </Suspense>
  );
}
