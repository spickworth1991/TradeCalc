import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ClientProviders from "./providers";

export const metadata = {
  title: "The Fantasy Arsenal by StickyPicky",
  description: "Misc. Tools for Sleeper fantasy leagues.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen font-sans">
        <ClientProviders>
          {children}
        </ClientProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
