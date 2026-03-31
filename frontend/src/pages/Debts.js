/**
 * Debt tracking page — manage debts with interest rates and payoff projections.
 * Shows monthly interest, estimated payoff timeline, and total interest cost.
 */
import React, { useEffect, useState } from "react";
import { getDebts, createDebt, updateDebt, deleteDebt } from "../services/api";

function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", balance: "", interest_rate: "", minimum_payment: "" });

  const load = async () => {
    try {
      const res = await getDebts();
      setDebts(res.data);
    } catch (err) {
      console.error("Failed to load debts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", balance: "", interest_rate: "", minimum_payment: "" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      balance: parseFloat(form.balance),
      interest_rate: parseFloat(form.interest_rate) || 0,
      minimum_payment: parseFloat(form.minimum_payment) || 0,
    };

    try {
      if (editId) {
        await updateDebt(editId, payload);
      } else {
        await createDebt(payload);
      }
      resetForm();
      load();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const startEdit = (d) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      balance: d.balance.toString(),
      interest_rate: d.interest_rate.toString(),
      minimum_payment: d.minimum_payment.toString(),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this debt?")) return;
    try { await deleteDebt(id); load(); } catch (err) { console.error("Delete failed:", err); }
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMonthlyInterest = debts.reduce((sum, d) => sum + d.monthly_interest, 0);

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debt Tracker</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <p className="text-sm text-muted-light dark:text-muted-dark">Total Debt</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">${totalDebt.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <p className="text-sm text-muted-light dark:text-muted-dark">Monthly Interest</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">${totalMonthlyInterest.toFixed(2)}</p>
        </div>
      </div>

      {/* Add/Edit form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Debt name" required className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          <input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="Balance ($)" step="0.01" min="0.01" required className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} placeholder="Interest rate (%)" step="0.01" min="0" className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
          <input type="number" value={form.minimum_payment} onChange={(e) => setForm({ ...form, minimum_payment: e.target.value })} placeholder="Min. payment ($)" step="0.01" min="0" className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">{editId ? "Update" : "Add"} Debt</button>
          {editId && <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg">Cancel</button>}
        </div>
      </form>

      {/* Debt list */}
      {debts.length === 0 ? (
        <p className="text-muted-light dark:text-muted-dark">No debts tracked. Add one above!</p>
      ) : (
        <div className="space-y-3">
          {debts.map((d) => (
            <div key={d.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{d.name}</h3>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">${d.balance.toFixed(2)}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <p className="text-muted-light dark:text-muted-dark">Interest Rate</p>
                  <p className="font-medium">{d.interest_rate.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-light dark:text-muted-dark">Monthly Interest</p>
                  <p className="font-medium text-orange-600 dark:text-orange-400">${d.monthly_interest.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-light dark:text-muted-dark">Min. Payment</p>
                  <p className="font-medium">${d.minimum_payment.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  {d.payoff_months ? (
                    <span className="text-muted-light dark:text-muted-dark">
                      Payoff in <span className="font-medium text-gray-800 dark:text-gray-200">{d.payoff_months} months</span>
                      {d.total_interest_cost > 0 && <span> (${d.total_interest_cost.toFixed(2)} in interest)</span>}
                    </span>
                  ) : d.minimum_payment > 0 ? (
                    <span className="text-red-600 dark:text-red-400 font-medium">Payment doesn't cover interest</span>
                  ) : (
                    <span className="text-muted-light dark:text-muted-dark">Set min. payment to see payoff projection</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(d)} className="text-primary-600 dark:text-primary-400 text-xs font-medium hover:underline">Edit</button>
                  <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Debts;
