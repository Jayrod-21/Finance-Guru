/**
 * Top navigation bar with route links, dark mode toggle, and responsive hamburger menu.
 * Collapses to a hamburger on small screens. Shows keyboard shortcut hint.
 */
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/add", label: "Quick Add" },
  { to: "/transactions", label: "Transactions" },
  { to: "/budget", label: "Budget" },
  { to: "/categories", label: "Categories" },
  { to: "/recurring", label: "Recurring" },
  { to: "/income", label: "Income" },
  { to: "/goals", label: "Goals" },
  { to: "/debts", label: "Debts" },
  { to: "/analytics", label: "Analytics" },
  { to: "/chat", label: "AI Advisor" },
  { to: "/history", label: "History" },
  { to: "/notifications", label: "Alerts" },
  { to: "/settings", label: "Settings" },
];

function Navbar({ darkMode, setDarkMode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (to) =>
    `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
      location.pathname === to
        ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
    }`;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold text-primary-700 dark:text-primary-400 shrink-0">
          Financial Guru
        </Link>

        {/* Desktop nav links — hidden on small screens */}
        <div className="hidden lg:flex items-center gap-1 flex-wrap">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass(l.to)}>
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="ml-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>

        {/* Mobile hamburger — visible on small screens */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "Light" : "Dark"}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden mt-3 pb-2 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex flex-wrap gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={linkClass(l.to)}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-3">
            Tip: Press Ctrl+N to quickly add a transaction
          </p>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
