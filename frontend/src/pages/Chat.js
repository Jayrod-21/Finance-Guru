/**
 * AI Financial Advisor chat page.
 * Sends messages to the backend which calls Anthropic Claude Sonnet 4.
 * Includes quick action buttons and persistent chat history.
 */
import React, { useEffect, useRef, useState } from "react";
import { sendChat, getChatHistory, getApiKeyStatus } from "../services/api";
import { Link } from "react-router-dom";

const quickActions = [
  { label: "Analyze my budget", message: "Analyze my current budget. Where am I overspending? What can I cut?" },
  { label: "Can I afford my goals?", message: "Based on my current income and expenses, are my financial goals realistic? What adjustments should I make?" },
  { label: "Suggest categories", message: "Look at my recent transactions and suggest how I should organize my spending categories." },
];

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [keySet, setKeySet] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Check if API key is set and load history
    Promise.all([getApiKeyStatus(), getChatHistory()])
      .then(([keyRes, histRes]) => {
        setKeySet(keyRes.data.is_set);
        // Convert history to message format
        const msgs = [];
        histRes.data.forEach((h) => {
          msgs.push({ role: "user", content: h.user_message });
          msgs.push({ role: "assistant", content: h.ai_response });
        });
        setMessages(msgs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await sendChat(userMsg);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.response }]);
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to get response";
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${detail}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  // No API key — show setup prompt
  if (keySet === false) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">AI Financial Advisor</h1>
        <p className="text-muted-light dark:text-muted-dark mb-6">
          You need to configure your Anthropic API key to use the AI advisor.
        </p>
        <Link to="/settings" className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
      <h1 className="text-2xl font-bold mb-4">AI Financial Advisor</h1>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            onClick={() => send(qa.message)}
            disabled={loading}
            className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <p className="text-center text-muted-light dark:text-muted-dark py-8">
            Ask me anything about your budget, goals, or spending patterns!
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm text-muted-light dark:text-muted-dark">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your finances..."
          disabled={loading}
          className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
