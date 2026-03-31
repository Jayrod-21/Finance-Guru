/**
 * Recurring expenses page — manage fixed recurring payments.
 * Displays billing cycle, next payment date, and calculated monthly cost.
 */
import React, { useEffect, useState } from "react";
import { getRecurring, getCategories, createRecurring, updateRecurring, deleteRecurring } from "../services/api";

const cycleLabels = { weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };

function RecurringExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", amount: "", category_id: "", billing_cycle: "monthly", next_payment_date: "" });

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const load = async () => {
    try {
      const [expRes, catRes] = await Promise.all([getRecurring(), getCategories()]);
      setExpenses(expRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Failed to load recurring expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", amount: "", category_id: "", billing_cycle: "monthly", next_payment_date: "" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      amount: parseFloat(form.amount),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      billing_cycle: form.billing_cycle,
      next_payment_date: form.next_payment_date || null,
    };

    try {
      if (editId) {
        await updateRecurring(editId, payload);
      } else {
        await createRecurring(payload);
      }
      resetForm();
      load();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const startEdit = (exp) => {
    setEditId(exp.id);
    setForm({
      name: exp.name,
      amount: exp.amount.toString(),
      category_id: exp.category_id ? exp.category_id.toString() : "",
      billing_cycle: exp.billing_cycle,
      next_payment_date: exp.next_payment_date || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this recurring expense?")) return;
    try {
      await deleteRecurring(id);
      load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const totalMonthly = expenses.reduce((sum, e) => sum + e.monthly_cost, 0);

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Recurring Expenses</h1>

      {/* Monthly total */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 text-center">
        <p className="text-sm text-muted-light dark:text-muted-dark">Total Monthly Recurring</p>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400">${totalMonthly.toFixed(2)}</p>
      </div>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Expense name" required className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" step="0.01" min="0.01" required className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm">
            {Object.entries(cycleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm">
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={form.next_payment_date} onChange={(e) => setForm({ ...form, next_payment_date: e.target.value })} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            {editId ? "Update" : "Add"} Expense
          </button>
          {editId && <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg">Cancel</button>}
        </div>
      </form>

      {/* Expense list */}
      {expenses.length === 0 ? (
        <p className="text-muted-light dark:text-muted-dark">No recurring expenses yet.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div key={exp.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{exp.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">{cycleLabels[exp.billing_cycle] || exp.billing_cycle}</span>
                  {exp.category_id && <span className="text-xs text-muted-light dark:text-muted-dark">{catMap[exp.category_id]}</span>}
                </div>
                <div className="text-sm text-muted-light dark:text-muted-dark mt-1">
                  ${exp.amount.toFixed(2)} / {exp.billing_cycle} = <span className="font-medium text-gray-800 dark:text-gray-200">${exp.monthly_cost.toFixed(2)}/mo</span>
                  {exp.next_payment_date && <span className="ml-3">Next: {exp.next_payment_date}</span>}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => startEdit(exp)} className="text-primary-600 dark:text-primary-400 text-xs font-medium hover:underline">Edit</button>
                <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecurringExpenses;
