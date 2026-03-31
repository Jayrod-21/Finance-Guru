/**
 * Budget view — shows all categories with remaining amounts and danger zone indicators.
 * Color-coded progress bars: green (ok), yellow (warning), orange (critical), red (exceeded).
 */
import React, { useEffect, useState } from "react";
import { getBudgetOverview } from "../services/api";

const statusColors = {
  ok: "bg-primary-500",
  warning: "bg-yellow-500",
  critical: "bg-orange-500",
  exceeded: "bg-red-500",
};

const statusLabels = {
  ok: "On Track",
  warning: "Warning (80%+)",
  critical: "Critical (95%+)",
  exceeded: "Exceeded!",
};

function BudgetView() {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBudgetOverview()
      .then((res) => setBudget(res.data))
      .catch((err) => console.error("Budget load error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Budget Overview</h1>

      {/* Aggregate summary */}
      {budget && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <p className="text-sm text-muted-light dark:text-muted-dark">Total Budget</p>
            <p className="text-2xl font-bold">${budget.total_budget.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <p className="text-sm text-muted-light dark:text-muted-dark">Total Spent</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">${budget.total_spent.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <p className="text-sm text-muted-light dark:text-muted-dark">Remaining</p>
            <p className={`text-2xl font-bold ${budget.total_remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              ${budget.total_remaining.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Per-category cards */}
      {budget && budget.categories.length > 0 ? (
        <div className="space-y-4">
          {budget.categories.map((cat) => (
            <div key={cat.category_id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{cat.category_name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    cat.status === "exceeded" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" :
                    cat.status === "critical" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
                    cat.status === "warning" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  }`}>
                    {statusLabels[cat.status]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${cat.remaining.toFixed(2)}</p>
                  <p className="text-xs text-muted-light dark:text-muted-dark">remaining</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-muted-light dark:text-muted-dark mb-2">
                <span>Spent: ${cat.spent_this_month.toFixed(2)}</span>
                <span>Budget: ${cat.budget_amount.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${statusColors[cat.status]}`}
                  style={{ width: `${Math.min(cat.percentage_used, 100)}%` }}
                />
              </div>
              <p className="text-xs text-right mt-1 text-muted-light dark:text-muted-dark">{cat.percentage_used.toFixed(1)}% used</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-light dark:text-muted-dark">No budgets set. Create categories and set budget amounts to get started.</p>
      )}
    </div>
  );
}

export default BudgetView;
