import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FantasyCalcProvider } from "@/context/FantasyCalcContext";


export const metadata = {
  title: "The Fantasy Arsenal by StickyPicky",
  description: "Misc. Tools for Sleeper fantasy leagues.",
};

export default async function RootLayout({ children }) {

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fantasy Trade Analyzer</title>
      </head>
      <body className="bg-gray-100 text-gray-800 min-h-screen font-sans">
        <FantasyCalcProvider values={null}>
          <main>{children}</main>
        </FantasyCalcProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
