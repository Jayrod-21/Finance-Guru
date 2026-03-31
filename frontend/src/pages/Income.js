/**
 * Income management page — add, edit, and track income sources.
 * Shows calculated total monthly income with frequency normalization.
 */
import React, { useEffect, useState } from "react";
import { getMonthlyIncome, createIncome, updateIncome, deleteIncome } from "../services/api";

const freqLabels = { weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", irregular: "Irregular" };

function Income() {
  const [data, setData] = useState({ total_monthly_income: 0, sources: [] });
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly", is_variable: false });

  const load = async () => {
    try {
      const res = await getMonthlyIncome();
      setData(res.data);
    } catch (err) {
      console.error("Failed to load income:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", amount: "", frequency: "monthly", is_variable: false });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      is_variable: form.is_variable,
    };

    try {
      if (editId) {
        await updateIncome(editId, payload);
      } else {
        await createIncome(payload);
      }
      resetForm();
      load();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const startEdit = (src) => {
    setEditId(src.id);
    setForm({
      name: src.name,
      amount: src.amount.toString(),
      frequency: src.frequency,
      is_variable: src.is_variable,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this income source?")) return;
    try {
      await deleteIncome(id);
      load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Income Sources</h1>

      {/* Monthly total */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 text-center">
        <p className="text-sm text-muted-light dark:text-muted-dark">Total Monthly Income</p>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">${data.total_monthly_income.toFixed(2)}</p>
      </div>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Income source name" required className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount per period" step="0.01" min="0.01" required className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>
        <div className="flex gap-3 items-center">
          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm flex-1">
            {Object.entries(freqLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_variable} onChange={(e) => setForm({ ...form, is_variable: e.target.checked })} className="rounded" />
            Variable
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            {editId ? "Update" : "Add"} Income
          </button>
          {editId && <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg">Cancel</button>}
        </div>
      </form>

      {/* Income list */}
      {data.sources.length === 0 ? (
        <p className="text-muted-light dark:text-muted-dark">No income sources yet.</p>
      ) : (
        <div className="space-y-2">
          {data.sources.map((src) => (
            <div key={src.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{src.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">{freqLabels[src.frequency] || src.frequency}</span>
                  {src.is_variable && <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full">Variable</span>}
                </div>
                <div className="text-sm text-muted-light dark:text-muted-dark mt-1">
                  ${src.amount.toFixed(2)} / {src.frequency} = <span className="font-medium text-gray-800 dark:text-gray-200">${src.monthly_amount.toFixed(2)}/mo</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => startEdit(src)} className="text-primary-600 dark:text-primary-400 text-xs font-medium hover:underline">Edit</button>
                <button onClick={() => handleDelete(src.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Income;
