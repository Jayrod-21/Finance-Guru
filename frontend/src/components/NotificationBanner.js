/**
 * Notification banner — displays active alerts at the top of the dashboard.
 * Polls the backend for budget warnings, upcoming bills, and goal milestones.
 * Dismissible per session.
 */
import React, { useEffect, useState } from "react";
import { getActiveNotifications } from "../services/api";

const severityStyles = {
  critical: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
  warning: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
  info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
  success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
};

function NotificationBanner() {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    getActiveNotifications()
      .then((res) => setAlerts(res.data))
      .catch(() => {});
  }, []);

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert, i) => {
        if (dismissed.has(i)) return null;
        return (
          <div key={i} className={`p-3 rounded-lg border text-sm flex justify-between items-center ${severityStyles[alert.severity] || severityStyles.info}`}>
            <span>{alert.message}</span>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, i]))}
              className="ml-3 text-xs opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default NotificationBanner;
