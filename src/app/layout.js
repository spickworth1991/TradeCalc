// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Fantasy Trade Analyzer',
  description: 'Analyze fantasy trades with live values from FantasyCalc',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className="bg-gray-100 text-gray-800 min-h-screen font-sans">
        <main>{children}</main>
      </body>
    </html>
  )
}
