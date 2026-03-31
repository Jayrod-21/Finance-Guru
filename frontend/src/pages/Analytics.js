/**
 * Analytics dashboard — spending insights and visualizations.
 * Uses Recharts for bar charts, line charts, treemaps, and a Sankey-style cash flow.
 * CRITICAL: NO PIE CHARTS. Not one. Not ever.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Treemap, Sankey as RechartsSankey, Rectangle, Layer,
} from "recharts";
import {
  getTopCategories, getFrequency, getWeeklyComparison, getMonthlyComparison,
  getInsights, getProjection, getBurnRate, getCashflow,
} from "../services/api";

/* Custom treemap content renderer */
const TreemapContent = ({ x, y, width, height, name, value }) => {
  if (width < 40 || height < 25) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#5c7cfa" stroke="#fff" strokeWidth={2} rx={4} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
        {name?.length > 12 ? name.slice(0, 10) + "..." : name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#dbe4ff" fontSize={10}>
        ${value}
      </text>
    </g>
  );
};

/* Color palette for Sankey nodes */
const SANKEY_COLORS = ["#5c7cfa", "#748ffc", "#91a7ff", "#4c6ef5", "#3b5bdb", "#4263eb", "#364fc7", "#bac8ff", "#dbe4ff"];

function Analytics() {
  const [topCats, setTopCats] = useState([]);
  const [freqData, setFreqData] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [insights, setInsights] = useState([]);
  const [projection, setProjection] = useState(null);
  const [burnRate, setBurnRate] = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("monthly");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.start) params.date_start = dateRange.start;
      if (dateRange.end) params.date_end = dateRange.end;

      const [tc, fr, wk, mo, ins, proj, burn, cf] = await Promise.all([
        getTopCategories(params),
        getFrequency(params),
        getWeeklyComparison(),
        getMonthlyComparison(),
        getInsights(),
        getProjection(),
        getBurnRate(),
        getCashflow(),
      ]);
      setTopCats(tc.data);
      setFreqData(fr.data);
      setWeekly(wk.data);
      setMonthly(mo.data);
      setInsights(ins.data);
      setProjection(proj.data);
      setBurnRate(burn.data);
      setCashflow(cf.data);
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>

        {/* Date range picker */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
            aria-label="Start date"
          />
          <span className="text-sm text-muted-light dark:text-muted-dark">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
            aria-label="End date"
          />
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: "", end: "" })}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Insights cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, i) => (
            <div key={i} className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4 text-sm text-primary-700 dark:text-primary-300">
              {insight}
            </div>
          ))}
        </div>
      )}

      {/* Projection + Burn Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projection && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide mb-4">End-of-Month Projection</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Daily spending pace:</span><span className="font-medium">${projection.daily_spending_pace}/day</span></div>
              <div className="flex justify-between"><span>Spent so far:</span><span className="font-medium">${projection.total_spent_so_far}</span></div>
              <div className="flex justify-between"><span>Projected total:</span><span className="font-medium">${projection.projected_total_spending}</span></div>
              <div className="flex justify-between"><span>Monthly income:</span><span className="font-medium">${projection.monthly_income}</span></div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg">
                <span className="font-medium">Projected balance:</span>
                <span className={`font-bold ${projection.projected_end_balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  ${projection.projected_end_balance}
                </span>
              </div>
            </div>
          </div>
        )}

        {burnRate && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide mb-4">Budget Burn Rate</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Expected: {burnRate.expected_percentage}%</span>
                <span>Actual: {burnRate.actual_percentage}%</span>
              </div>
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div className="h-4 rounded-full bg-gray-400 dark:bg-gray-500 opacity-50" style={{ width: `${Math.min(burnRate.expected_percentage, 100)}%` }} />
                <div className={`absolute top-0 h-4 rounded-full ${burnRate.status === "overspending" ? "bg-red-500" : burnRate.status === "ahead" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(burnRate.actual_percentage, 100)}%` }} />
              </div>
              <p className="text-sm text-center">
                <span className={`font-medium px-2 py-0.5 rounded ${burnRate.status === "overspending" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : burnRate.status === "ahead" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"}`}>
                  {burnRate.status === "overspending" ? "Overspending" : burnRate.status === "ahead" ? "Slightly Ahead" : "On Track"}
                </span>
              </p>
              <p className="text-xs text-center text-muted-light dark:text-muted-dark">
                Day {burnRate.days_passed} of {burnRate.days_in_month} — ${burnRate.total_spent} of ${burnRate.total_budget} budget
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cash Flow Sankey-style visualization */}
      {cashflow && (cashflow.income_sources.length > 0 || cashflow.expense_categories.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide mb-4">Cash Flow</h2>
          <div className="flex items-start gap-4 overflow-x-auto">
            {/* Income sources column */}
            <div className="flex flex-col gap-2 min-w-[160px]">
              <p className="text-xs font-medium text-muted-light dark:text-muted-dark uppercase mb-1">Income</p>
              {cashflow.income_sources.map((src, i) => (
                <div key={i} className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">{src.name}</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">${src.amount.toLocaleString()}</p>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50 border-2 border-green-300 dark:border-green-700">
                <p className="text-xs font-medium text-green-700 dark:text-green-300">Total</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">${cashflow.total_income.toLocaleString()}</p>
              </div>
            </div>

            {/* Flow arrows */}
            <div className="flex items-center self-center text-3xl text-gray-300 dark:text-gray-600 px-2">
              &rarr;
            </div>

            {/* Expense categories column */}
            <div className="flex flex-col gap-2 min-w-[160px] flex-1">
              <p className="text-xs font-medium text-muted-light dark:text-muted-dark uppercase mb-1">Expenses</p>
              <div className="grid grid-cols-2 gap-2">
                {cashflow.expense_categories.map((cat, i) => {
                  const pct = cashflow.total_income > 0 ? ((cat.amount / cashflow.total_income) * 100).toFixed(1) : 0;
                  return (
                    <div key={i} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-xs font-medium text-red-700 dark:text-red-300 truncate">{cat.name}</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">${cat.amount.toLocaleString()}</p>
                      <p className="text-xs text-red-400 dark:text-red-500">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flow arrows */}
            <div className="flex items-center self-center text-3xl text-gray-300 dark:text-gray-600 px-2">
              &rarr;
            </div>

            {/* Remaining column */}
            <div className="flex flex-col gap-2 min-w-[140px]">
              <p className="text-xs font-medium text-muted-light dark:text-muted-dark uppercase mb-1">Remaining</p>
              <div className={`p-4 rounded-lg border-2 ${cashflow.remaining >= 0 ? "bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700" : "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700"}`}>
                <p className="text-xs font-medium text-muted-light dark:text-muted-dark">Balance</p>
                <p className={`text-2xl font-bold ${cashflow.remaining >= 0 ? "text-primary-600 dark:text-primary-400" : "text-red-600 dark:text-red-400"}`}>
                  ${cashflow.remaining.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time period toggle + comparison chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide">Spending Over Time</h2>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <button onClick={() => setView("weekly")} className={`px-3 py-1 text-xs font-medium ${view === "weekly" ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-800"}`}>Weekly</button>
            <button onClick={() => setView("monthly")} className={`px-3 py-1 text-xs font-medium ${view === "monthly" ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-800"}`}>Monthly</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={view === "weekly" ? weekly.map(w => ({ name: w.week_start.slice(5), total: w.total })) : monthly.map(m => ({ name: m.month, total: m.total }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v) => [`$${v}`, "Spending"]} />
            <Line type="monotone" dataKey="total" stroke="#5c7cfa" strokeWidth={2} dot={{ fill: "#5c7cfa" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top categories bar chart + Treemap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide mb-4">Top Categories</h2>
          {topCats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCats.map(c => ({ name: c.category_name, total: c.total }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                <Tooltip formatter={(v) => [`$${v}`, "Spent"]} />
                <Bar dataKey="total" fill="#5c7cfa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-light dark:text-muted-dark">No spending data yet.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide mb-4">Spending Distribution</h2>
          {topCats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <Treemap data={topCats.map(c => ({ name: c.category_name, value: c.total }))} dataKey="value" content={<TreemapContent />} />
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-light dark:text-muted-dark">No spending data yet.</p>
          )}
        </div>
      </div>

      {/* Frequency analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide mb-4">Purchase Frequency</h2>
        {freqData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={freqData.map(f => ({ name: f.category_name, count: f.count, average: f.average }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#748ffc" name="# Purchases" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-light dark:text-muted-dark">No frequency data yet.</p>
        )}
      </div>
    </div>
  );
}

export default Analytics;
