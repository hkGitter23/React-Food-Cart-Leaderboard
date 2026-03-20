"use client";

import { useEffect } from "react";

export default function ThemeInit() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("drexel_theme");
      const theme = saved === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
    } catch {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  return null;
}