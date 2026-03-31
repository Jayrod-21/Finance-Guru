/**
 * Category management page — create, edit, and delete spending categories.
 * Categories start from a blank slate (no presets).
 */
import React, { useEffect, useState } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/api";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const load = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createCategory({ name: newName.trim(), budget_amount: parseFloat(newBudget) || 0 });
      setNewName("");
      setNewBudget("");
      load();
    } catch (err) {
      console.error("Create failed:", err);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await updateCategory(id, { name: editName, budget_amount: parseFloat(editBudget) || 0 });
      setEditId(null);
      load();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? Historical transactions will keep their reference.")) return;
    try {
      await deleteCategory(id);
      load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditBudget(cat.budget_amount.toString());
  };

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name"
          className="flex-1 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          required
        />
        <input
          type="number"
          value={newBudget}
          onChange={(e) => setNewBudget(e.target.value)}
          placeholder="Budget ($)"
          step="0.01"
          min="0"
          className="w-32 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
        <button type="submit" className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          Add
        </button>
      </form>

      {/* Category list */}
      {categories.length === 0 ? (
        <p className="text-muted-light dark:text-muted-dark">No categories yet. Create your first one above!</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
              {editId === cat.id ? (
                <div className="flex gap-2 flex-1">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm" />
                  <input type="number" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} step="0.01" min="0" className="w-28 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm" />
                  <button onClick={() => handleUpdate(cat.id)} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg">Save</button>
                  <button onClick={() => setEditId(null)} className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-xs rounded-lg">Cancel</button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-sm text-muted-light dark:text-muted-dark ml-3">Budget: ${cat.budget_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="text-primary-600 dark:text-primary-400 text-xs font-medium hover:underline">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Categories;
