"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type PublicTheme = "light" | "dark";

type PublicThemeContextValue = {
  theme: PublicTheme;
  setTheme: (theme: PublicTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "smart-aquaponics-theme";

const PublicThemeContext = createContext<PublicThemeContextValue | null>(null);

function readInitialTheme(): PublicTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: PublicTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PublicTheme>(readInitialTheme);

  const setTheme = useCallback((nextTheme: PublicTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return (
    <PublicThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme() {
  const context = useContext(PublicThemeContext);
  if (!context) {
    throw new Error("usePublicTheme must be used inside PublicThemeProvider.");
  }
  return context;
}
