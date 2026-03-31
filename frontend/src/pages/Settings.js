/**
 * Settings page — manages Anthropic API key.
 * Key is validated on submission and stored encrypted on the backend.
 */
import React, { useEffect, useState } from "react";
import { storeApiKey, getApiKeyStatus } from "../services/api";

function Settings() {
  const [keySet, setKeySet] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getApiKeyStatus()
      .then((res) => setKeySet(res.data.is_set))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      await storeApiKey(apiKey.trim());
      setKeySet(true);
      setApiKey("");
      setMessage({ type: "success", text: "API key validated and stored!" });
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to store API key";
      setMessage({ type: "error", text: detail });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Anthropic API Key</h2>
        <p className="text-sm text-muted-light dark:text-muted-dark mb-4">
          Required for the AI financial advisor. Your key is encrypted at rest and never shared.
          Get one at <span className="text-primary-600 dark:text-primary-400">console.anthropic.com</span>
        </p>

        <div className="mb-4">
          <span className={`text-sm font-medium px-2 py-1 rounded ${keySet ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"}`}>
            {keySet ? "API key is configured" : "No API key set"}
          </span>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={keySet ? "Enter new key to replace..." : "sk-ant-..."}
            className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Validating..." : keySet ? "Update API Key" : "Save API Key"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
