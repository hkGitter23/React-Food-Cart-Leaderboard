
"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let t = "light";
    try {
      const saved = localStorage.getItem("drexel_theme");
      if (saved === "dark") t = "dark";
    } catch {}
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    setReady(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);

    try {
      localStorage.setItem("drexel_theme", next);
    } catch {}

    document.documentElement.setAttribute("data-theme", next);
  }

  if (!ready) return null;

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      style={{
        position: "fixed",
        right: 16,
        top: 92,
        zIndex: 999999,
        width: 42,
        height: 42,
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "var(--card)",
        color: "var(--text)",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
        display: "grid",
        placeItems: "center",
      }}
    >
      {theme === "dark" ? "☾" : "☀"}
    </button>
  );
}