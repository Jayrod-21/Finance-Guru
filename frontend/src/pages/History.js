/**
 * History browser — browse monthly snapshots with side-by-side comparison.
 * Snapshots are stored indefinitely — never auto-deleted.
 */
import React, { useEffect, useState } from "react";
import { getSnapshots, generateSnapshot } from "../services/api";

const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function History() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);

  const load = async () => {
    try {
      const res = await getSnapshots();
      setSnapshots(res.data);
    } catch (err) {
      console.error("Failed to load snapshots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateSnapshot();
      load();
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to generate snapshot";
      alert(detail);
    } finally {
      setGenerating(false);
    }
  };

  const SnapshotCard = ({ snap, label }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      {label && <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-2">{label}</p>}
      <h3 className="text-lg font-bold mb-3">{monthNames[snap.month]} {snap.year}</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Income:</span><span className="font-medium text-green-600 dark:text-green-400">${snap.total_income.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Expenses:</span><span className="font-medium text-red-600 dark:text-red-400">${snap.total_expenses.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Net Savings:</span><span className={`font-medium ${snap.net_savings >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>${snap.net_savings.toFixed(2)}</span></div>
      </div>
      {snap.category_breakdown && Object.keys(snap.category_breakdown).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-muted-light dark:text-muted-dark mb-2">Category Breakdown</p>
          {Object.entries(snap.category_breakdown).map(([name, amount]) => (
            <div key={name} className="flex justify-between text-xs"><span>{name}</span><span>${amount.toFixed(2)}</span></div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
          {generating ? "Generating..." : "Generate Last Month Snapshot"}
        </button>
      </div>

      {/* Comparison view */}
      {compareA && compareB && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide">Comparison</h2>
            <button onClick={() => { setCompareA(null); setCompareB(null); }} className="text-xs text-red-500">Clear comparison</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SnapshotCard snap={compareA} label="Month A" />
            <SnapshotCard snap={compareB} label="Month B" />
          </div>
        </div>
      )}

      {/* Snapshot list */}
      {snapshots.length === 0 ? (
        <p className="text-muted-light dark:text-muted-dark">No snapshots yet. Generate one to start tracking history!</p>
      ) : (
        <div className="space-y-3">
          {snapshots.map((snap) => (
            <div key={snap.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
              <div>
                <span className="font-semibold">{monthNames[snap.month]} {snap.year}</span>
                <div className="text-sm text-muted-light dark:text-muted-dark mt-1">
                  Income: ${snap.total_income.toFixed(2)} | Expenses: ${snap.total_expenses.toFixed(2)} | Net: ${snap.net_savings.toFixed(2)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => !compareA ? setCompareA(snap) : !compareB ? setCompareB(snap) : null}
                  disabled={compareA && compareB}
                  className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded disabled:opacity-50"
                >
                  {!compareA ? "Compare A" : !compareB ? "Compare B" : "Full"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
