/**
 * Root application component.
 * Sets up routing, dark mode state, and the navigation layout.
 */
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import TransactionEntry from "./pages/TransactionEntry";
import TransactionList from "./pages/TransactionList";
import BudgetView from "./pages/BudgetView";
import Categories from "./pages/Categories";
import RecurringExpenses from "./pages/RecurringExpenses";
import Income from "./pages/Income";

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
    <Router>
      <div className="min-h-screen">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<TransactionEntry />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/budget" element={<BudgetView />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/recurring" element={<RecurringExpenses />} />
            <Route path="/income" element={<Income />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
