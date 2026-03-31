/**
 * Transaction list page — sortable, filterable table of all transactions.
 * Supports inline editing and deletion with confirmation.
 */
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getTransactions, getCategories, updateTransaction, deleteTransaction } from "../services/api";

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", category_id: "", date_start: "", date_end: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const startEdit = (tx) => {
    setEditId(tx.id);
    setEditForm({
      date: tx.date,
      amount: tx.amount.toString(),
      description: tx.description || "",
      type: tx.type,
      category_id: tx.category_id ? tx.category_id.toString() : "",
    });
  };

  const handleSave = async () => {
    try {
      await updateTransaction(editId, {
        date: editForm.date,
        amount: parseFloat(editForm.amount),
        description: editForm.description,
        type: editForm.type,
        category_id: editForm.category_id ? parseInt(editForm.category_id) : null,
      });
      setEditId(null);
      load();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const inputClass = "p-1.5 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Link to="/add" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          + Add Transaction
        </Link>
      </div>

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
        <input type="date" value={filters.date_start} onChange={(e) => setFilters({ ...filters, date_start: e.target.value })} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm" />
        <input type="date" value={filters.date_end} onChange={(e) => setFilters({ ...filters, date_end: e.target.value })} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm" />
        {(filters.type || filters.category_id || filters.date_start || filters.date_end) && (
          <button onClick={() => setFilters({ type: "", category_id: "", date_start: "", date_end: "" })} className="text-xs text-red-500 hover:text-red-700 font-medium self-center">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-muted-light dark:text-muted-dark">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">No transactions found</p>
            <p className="text-sm text-muted-light dark:text-muted-dark mb-4">
              {filters.type || filters.category_id || filters.date_start || filters.date_end
                ? "Try adjusting your filters."
                : "Start tracking your finances by adding your first transaction."}
            </p>
            {!filters.type && !filters.category_id && (
              <Link to="/add" className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline">
                Add your first transaction
              </Link>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    {editId === tx.id ? (
                      <>
                        <td className="p-2"><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className={inputClass} /></td>
                        <td className="p-2"><input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={`${inputClass} w-full`} /></td>
                        <td className="p-2">
                          <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })} className={inputClass}>
                            <option value="">None</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className={inputClass}>
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        </td>
                        <td className="p-2 text-right"><input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} step="0.01" min="0.01" className={`${inputClass} w-24 text-right`} /></td>
                        <td className="p-2 text-right space-x-1">
                          <button onClick={handleSave} className="text-green-600 hover:text-green-700 text-xs font-medium">Save</button>
                          <button onClick={() => setEditId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3">{tx.date}</td>
                        <td className="p-3">{tx.description || "—"}</td>
                        <td className="p-3">{catMap[tx.category_id] || "—"}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === "income" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-medium ${tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button onClick={() => startEdit(tx)} className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(tx.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 text-xs text-muted-light dark:text-muted-dark text-center">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TransactionList;
