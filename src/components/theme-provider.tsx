
"use client";

import { useEffect, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = window.document.documentElement;
    // Ensure dark class is applied and light class is removed
    root.classList.remove("light");
    root.classList.add("dark");
    // Optionally, set a data attribute if other CSS relies on it, though not strictly necessary
    // if all styles are now effectively "dark" theme styles.
    // root.setAttribute("data-theme", "dark"); 
  }, []);

  return <>{children}</>;
}

// This hook might not be very useful anymore if the theme is locked.
// Components relying on it might need adjustment or could just assume dark theme.
export const useTheme = () => {
  return {
    theme: "dark" as const,
    resolvedTheme: "dark" as const,
    setTheme: () => {
      console.warn("Theme is locked to dark mode and cannot be changed.");
    },
  };
};
