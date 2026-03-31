/**
 * Global keyboard shortcuts handler.
 * Ctrl+N / Cmd+N: Navigate to Quick Add transaction page
 * Ctrl+K / Cmd+K: Focus search/filter (future)
 * Escape: Close modals (future)
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function KeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      const isModifier = e.ctrlKey || e.metaKey;

      // Ctrl+N: Quick add transaction
      if (isModifier && e.key === "n") {
        e.preventDefault();
        navigate("/add");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return null;
}

export default KeyboardShortcuts;
