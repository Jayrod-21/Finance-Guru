/**
 * Dashboard — primary landing page.
 * Shows running balance, budget overview summary, and recent transactions.
 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBalance, getTransactions, getBudgetOverview, getRecurring, getMonthlyIncome, getGoals, getGoalFeasibility } from "../services/api";
import NotificationBanner from "../components/NotificationBanner";

function Dashboard() {
  const [balance, setBalance] = useState(null);
  const [recent, setRecent] = useState([]);
  const [budget, setBudget] = useState(null);
  const [recurringTotal, setRecurringTotal] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [goals, setGoals] = useState([]);
  const [feasibility, setFeasibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [balRes, txRes, budRes, recRes, incRes, goalRes, feasRes] = await Promise.all([
          getBalance(),
          getTransactions(),
          getBudgetOverview(),
          getRecurring(),
          getMonthlyIncome(),
          getGoals(),
          getGoalFeasibility(),
        ]);
        setBalance(balRes.data);
        setRecent(txRes.data.slice(0, 5));
        setBudget(budRes.data);
        setRecurringTotal(recRes.data.reduce((sum, e) => sum + e.monthly_cost, 0));
        setMonthlyIncome(incRes.data.total_monthly_income);
        setGoals(goalRes.data);
        setFeasibility(feasRes.data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div className="space-y-6">
      <NotificationBanner />
      {/* Balance card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide">Running Balance</h2>
        <p className={`text-4xl font-bold mt-1 ${balance && balance.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          ${balance ? balance.balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
        </p>
        <div className="flex gap-6 mt-3 text-sm text-muted-light dark:text-muted-dark">
          <span>Income: ${balance ? balance.total_income.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}</span>
          <span>Expenses: ${balance ? balance.total_expenses.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}</span>
        </div>
      </div>

      {/* Monthly income / recurring / net summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <p className="text-sm text-muted-light dark:text-muted-dark">Monthly Income</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">${monthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <p className="text-sm text-muted-light dark:text-muted-dark">Monthly Recurring</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">${recurringTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <p className="text-sm text-muted-light dark:text-muted-dark">Net (Income - Recurring)</p>
          <p className={`text-2xl font-bold ${monthlyIncome - recurringTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            ${(monthlyIncome - recurringTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide">Budget Overview</h2>
            <Link to="/budget" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          {budget && budget.categories.length > 0 ? (
            <div className="space-y-3">
              {budget.categories.slice(0, 4).map((cat) => (
                <div key={cat.category_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{cat.category_name}</span>
                    <span className={cat.status === "exceeded" ? "text-red-600 dark:text-red-400" : cat.status === "critical" ? "text-orange-600 dark:text-orange-400" : cat.status === "warning" ? "text-yellow-600 dark:text-yellow-400" : "text-muted-light dark:text-muted-dark"}>
                      ${cat.spent_this_month.toFixed(2)} / ${cat.budget_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${cat.status === "exceeded" ? "bg-red-500" : cat.status === "critical" ? "bg-orange-500" : cat.status === "warning" ? "bg-yellow-500" : "bg-primary-500"}`}
                      style={{ width: `${Math.min(cat.percentage_used, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-light dark:text-muted-dark">No categories yet. <Link to="/categories" className="text-primary-600 dark:text-primary-400 hover:underline">Create one</Link></p>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          {recent.length > 0 ? (
            <ul className="space-y-2">
              {recent.map((tx) => (
                <li key={tx.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{tx.description || "No description"}</span>
                    <span className="text-muted-light dark:text-muted-dark ml-2">{tx.date}</span>
                  </div>
                  <span className={tx.type === "income" ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                    {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-light dark:text-muted-dark">No transactions yet. <Link to="/add" className="text-primary-600 dark:text-primary-400 hover:underline">Add one</Link></p>
          )}
        </div>
      </div>

      {/* Goal progress & feasibility */}
      {(goals.length > 0 || (feasibility && !feasibility.is_feasible)) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide">Goal Progress</h2>
            <Link to="/goals" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          {feasibility && !feasibility.is_feasible && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-300">
              Budget-savings conflict: deficit of ${feasibility.deficit.toFixed(2)}/mo
            </div>
          )}
          <div className="space-y-3">
            {goals.slice(0, 3).map((g) => (
              <div key={g.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-muted-light dark:text-muted-dark">{g.progress_percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-primary-500" style={{ width: `${Math.min(g.progress_percentage, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
