/**
 * Notification preferences page — toggle which alerts are enabled.
 * Also displays currently active notifications.
 */
import React, { useEffect, useState } from "react";
import { getNotificationPrefs, updateNotificationPref, getActiveNotifications } from "../services/api";

const triggerLabels = {
  transaction_confirm: "Transaction confirmation",
  budget_warning: "Budget warning (80%+)",
  budget_exceeded: "Budget exceeded (100%+)",
  upcoming_bill: "Upcoming bills (1-3 days before)",
  savings_conflict: "Savings goal conflict",
  goal_milestone: "Goal milestones (25%, 50%, 75%, 100%)",
};

const severityStyles = {
  critical: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
  warning: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
  info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
  success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
};

function Notifications() {
  const [prefs, setPrefs] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [prefRes, activeRes] = await Promise.all([getNotificationPrefs(), getActiveNotifications()]);
      setPrefs(prefRes.data);
      setActive(activeRes.data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (triggerType, currentState) => {
    try {
      await updateNotificationPref({ trigger_type: triggerType, is_enabled: !currentState });
      setPrefs((prev) => prev.map((p) => p.trigger_type === triggerType ? { ...p, is_enabled: !currentState } : p));
    } catch (err) {
      console.error("Failed to update preference:", err);
    }
  };

  if (loading) return <p className="text-muted-light dark:text-muted-dark">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {/* Active notifications */}
      {active.length > 0 && (
        <div className="mb-6 space-y-2">
          <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide mb-3">Active Alerts</h2>
          {active.map((n, i) => (
            <div key={i} className={`p-3 rounded-lg border text-sm ${severityStyles[n.severity] || severityStyles.info}`}>
              {n.message}
            </div>
          ))}
        </div>
      )}

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-sm font-medium text-muted-light dark:text-muted-dark uppercase tracking-wide mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {prefs.map((p) => (
            <div key={p.trigger_type} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">{triggerLabels[p.trigger_type] || p.trigger_type}</span>
              <button
                onClick={() => toggle(p.trigger_type, p.is_enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${p.is_enabled ? "bg-primary-600" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${p.is_enabled ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
