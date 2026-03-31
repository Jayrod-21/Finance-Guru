/**
 * Transaction list page — sortable, filterable table of all transactions.
 * Supports inline delete and links to edit (future).
 */
import React, { useEffect, useState, useCallback } from "react";
import { getTransactions, getCategories, deleteTransaction } from "../services/api";

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", category_id: "", date_start: "", date_end: "" });

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.date_start) params.date_start = filters.date_start;
      if (filters.date_end) params.date_end = filters.date_end;

      const [txRes, catRes] = await Promise.all([getTransactions(params), getCategories()]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>

      {/* Filters row */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm">
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={filters.date_start} onChange={(e) => setFilters({ ...filters, date_start: e.target.value })} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm" placeholder="From" />
        <input type="date" value={filters.date_end} onChange={(e) => setFilters({ ...filters, date_end: e.target.value })} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm" placeholder="To" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <p className="p-6 text-muted-light dark:text-muted-dark">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="p-6 text-muted-light dark:text-muted-dark">No transactions found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="p-3">{tx.date}</td>
                  <td className="p-3">{tx.description || "—"}</td>
                  <td className="p-3">{catMap[tx.category_id] || "—"}</td>
                  <td className={`p-3 text-right font-medium ${tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleDelete(tx.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TransactionList;
