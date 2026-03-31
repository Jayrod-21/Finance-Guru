/**
 * Goals page — create, track, and manage financial goals.
 * Shows progress bars, deadlines, feasibility indicators, and monthly contribution needed.
 */
import React, { useEffect, useState } from "react";
import { getGoals, getDebts, createGoal, updateGoal, deleteGoal, getGoalFeasibility } from "../services/api";

const typeLabels = { debt_payoff: "Debt Payoff", savings: "Savings", custom: "Custom" };

function Goals() {
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [feasibility, setFeasibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "savings", target_amount: "", current_amount: "0", deadline: "", linked_debt_id: "" });

  const load = async () => {
    try {
      const [gRes, dRes, fRes] = await Promise.all([getGoals(), getDebts(), getGoalFeasibility()]);
      setGoals(gRes.data);
      setDebts(dRes.data);
      setFeasibility(fRes.data);
    } catch (err) {
      console.error("Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", type: "savings", target_amount: "", current_amount: "0", deadline: "", linked_debt_id: "" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
      deadline: form.deadline || null,
      linked_debt_id: form.linked_debt_id ? parseInt(form.linked_debt_id) : null,
    };

    try {
      if (editId) {
        await updateGoal(editId, payload);
      } else {
        await createGoal(payload);
      }
      resetForm();
      load();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const startEdit = (g) => {
    setEditId(g.id);
    setForm({
      name: g.name,
      type: g.type,
      target_amount: g.target_amount.toString(),
      current_amount: g.current_amount.toString(),
      deadline: g.deadline || "",
      linked_debt_id: g.linked_debt_id ? g.linked_debt_id.toString() : "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try { await deleteGoal(id); load(); } catch (err) { console.error("Delete failed:", err); }
  };

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Financial Goals</h1>

      {/* Feasibility alert */}
      {feasibility && !feasibility.is_feasible && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="font-semibold text-red-700 dark:text-red-300">Budget-Savings Conflict</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            Your monthly surplus is ${feasibility.monthly_surplus.toFixed(2)}, but your goals need ${feasibility.total_monthly_goal_contributions.toFixed(2)}/mo.
            Deficit: <span className="font-bold">${feasibility.deficit.toFixed(2)}/mo</span>
          </p>
        </div>
      )}

      {feasibility && feasibility.is_feasible && goals.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="font-semibold text-green-700 dark:text-green-300">Goals are feasible</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Monthly surplus: ${feasibility.monthly_surplus.toFixed(2)} covers goal contributions of ${feasibility.total_monthly_goal_contributions.toFixed(2)}/mo
          </p>
        </div>
      )}

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Goal name" required className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm">
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} placeholder="Target $" step="0.01" min="0.01" required className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          <input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} placeholder="Current $" step="0.01" min="0" className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm" />
        </div>
        {form.type === "debt_payoff" && (
          <select value={form.linked_debt_id} onChange={(e) => setForm({ ...form, linked_debt_id: e.target.value })} className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm">
            <option value="">Link to debt (optional)</option>
            {debts.map((d) => <option key={d.id} value={d.id}>{d.name} — ${d.balance.toFixed(2)}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">{editId ? "Update" : "Add"} Goal</button>
          {editId && <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg">Cancel</button>}
        </div>
      </form>

      {/* Goal list */}
      {goals.length === 0 ? (
        <p className="text-muted-light dark:text-muted-dark">No goals yet. Create one above!</p>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{g.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">{typeLabels[g.type] || g.type}</span>
                    {g.deadline && <span className="text-xs text-muted-light dark:text-muted-dark">{g.days_remaining} days left</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${g.current_amount.toFixed(2)} <span className="text-sm font-normal text-muted-light dark:text-muted-dark">/ ${g.target_amount.toFixed(2)}</span></p>
                  {g.monthly_contribution_needed && <p className="text-xs text-muted-light dark:text-muted-dark">Need ${g.monthly_contribution_needed.toFixed(2)}/mo</p>}
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <div className="h-3 rounded-full bg-primary-500 transition-all" style={{ width: `${Math.min(g.progress_percentage, 100)}%` }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-light dark:text-muted-dark">{g.progress_percentage.toFixed(1)}% complete</span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(g)} className="text-primary-600 dark:text-primary-400 text-xs font-medium hover:underline">Edit</button>
                  <button onClick={() => handleDelete(g.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Goals;
