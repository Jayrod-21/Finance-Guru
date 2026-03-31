/**
 * Quick transaction entry form.
 * Designed for speed — target is under 10 seconds per entry.
 * Auto-focuses amount field, supports keyboard submission.
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTransaction, getCategories } from "../services/api";

function TransactionEntry() {
  const navigate = useNavigate();
  const amountRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    type: "expense",
    category_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data)).catch(() => {});
    amountRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSubmitting(true);

    try {
      await createTransaction({
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      });
      setSuccess(true);
      /* Reset form but keep date and type for rapid consecutive entries */
      setForm((f) => ({ ...f, amount: "", description: "", category_id: "" }));
      amountRef.current?.focus();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to create transaction:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quick Add Transaction</h1>

      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
          Transaction added!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        {/* Type toggle — large, easy to tap */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setForm({ ...form, type: "expense" })}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.type === "expense" ? "bg-red-500 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, type: "income" })}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.type === "income" ? "bg-green-500 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >
            Income
          </button>
        </div>

        {/* Amount — largest, most prominent field */}
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            ref={amountRef}
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full text-3xl font-bold p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            required
          />
        </div>

        {/* Date and Category side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What was this for?"
            className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Add Transaction"}
        </button>
      </form>
    </div>
  );
}

export default TransactionEntry;
