"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Trade Calculator", href: "/trade" },
    { name: "Player Stock", href: "/player-stock" },
    { name: "Player Availability", href: "/player-availability" },
    {
      name: "More Tools ▾",
      submenu: [
        { name: "Coming Soon #1", href: "#" },
        { name: "Coming Soon #2", href: "#" },
      ],
    },
  ];

  const isActive = (href) => pathname === href;

  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-400">
          The Fantasy Arsenal
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-4">
          {navLinks.map((link) =>
            link.submenu ? (
              <div key={link.name} className="relative group">
                <button
                  className="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-sm transition flex items-center"
                >
                  {link.name}
                </button>
                <div className="absolute hidden group-hover:block bg-gray-800 rounded mt-2 shadow-lg border border-gray-700 w-48">
                  {link.submenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-2 hover:bg-gray-700 text-sm"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  isActive(link.href)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-white"
                }`}
              >
                {link.name}
              </Link>
            )
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-2xl text-blue-400"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700 p-4 space-y-3">
          {navLinks.map((link) =>
            link.submenu ? (
              <div key={link.name}>
                <p className="font-semibold">{link.name}</p>
                <div className="ml-4 space-y-2">
                  {link.submenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block hover:text-blue-400"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className={`block px-4 py-2 rounded ${
                  isActive(link.href)
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-800"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}
