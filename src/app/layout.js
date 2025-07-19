// app/layout.js
import './globals.css'
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"



export const metadata = {
  title: 'Fantasy Trade Analyzer',
  description: 'Analyze fantasy trades with live values from FantasyCalc',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fantasy Trade Analyzer</title>
      </head>
      <body className="bg-gray-100 text-gray-800 min-h-screen font-sans">
        <main>{children}</main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
