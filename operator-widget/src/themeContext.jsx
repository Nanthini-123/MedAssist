import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("medassist_theme") || "dark";
    } catch { return "dark"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.style.setProperty("--bg", "var(--bg-dark)");
      root.style.setProperty("--card", "var(--card-dark)");
      root.style.setProperty("--text", "var(--text-dark)");
      root.style.setProperty("--primary", "var(--primary-dark)");
    } else {
      root.style.setProperty("--bg", "var(--bg-light)");
      root.style.setProperty("--card", "var(--card-light)");
      root.style.setProperty("--text", "var(--text-light)");
      root.style.setProperty("--primary", "var(--primary-light)");
    }
    try { localStorage.setItem("medassist_theme", theme); } catch {}
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}