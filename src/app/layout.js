// src/app/layout.js
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FantasyCalcProvider } from "@/context/FantasyCalcContext";
import Navbar from "@/app/components/Navbar";
import { SleeperDataProvider } from "@/context/SleeperDataContext";



export const metadata = {
  title: "The Fantasy Arsenal by StickyPicky",
  description: "Misc. Tools for Sleeper fantasy leagues.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Fantasy Arsenal</title>
      </head>
      <body className="bg-black text-white min-h-screen font-sans">
        <FantasyCalcProvider values={null}>
          <Navbar /> 
          <SleeperDataProvider>{children}</SleeperDataProvider>
        </FantasyCalcProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
