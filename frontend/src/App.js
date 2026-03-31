/**
 * Root application component.
 * Sets up routing, dark mode state, and the navigation layout.
 */
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import TransactionEntry from "./pages/TransactionEntry";
import TransactionList from "./pages/TransactionList";
import BudgetView from "./pages/BudgetView";
import Categories from "./pages/Categories";
import RecurringExpenses from "./pages/RecurringExpenses";
import Income from "./pages/Income";
import Goals from "./pages/Goals";
import Debts from "./pages/Debts";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Notifications from "./pages/Notifications";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  /* Apply dark class to html element for Tailwind dark mode */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  return (
    <ErrorBoundary>
    <Router>
      <div className="min-h-screen">
        <KeyboardShortcuts />
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="max-w-7xl mx-auto px-4 py-6 pb-16">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<TransactionEntry />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/budget" element={<BudgetView />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/recurring" element={<RecurringExpenses />} />
            <Route path="/income" element={<Income />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<History />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </main>
      </div>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
