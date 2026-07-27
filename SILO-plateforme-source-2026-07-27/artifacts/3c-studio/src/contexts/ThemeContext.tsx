import { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeMode = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "silo-theme";

// Jour : 8h–17h → clair · Soir : 17h–8h → sombre
function themeForHour(hour: number): ResolvedTheme {
  return hour >= 8 && hour < 17 ? "light" : "dark";
}

interface ThemeContextValue {
  mode: ThemeMode;
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "auto",
  theme: "dark",
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "auto";
  });
  const [autoTheme, setAutoTheme] = useState<ResolvedTheme>(() => themeForHour(new Date().getHours()));

  // Réévalue le thème automatique chaque minute
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoTheme(themeForHour(new Date().getHours()));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const theme: ResolvedTheme = mode === "auto" ? autoTheme : mode;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    if (m === "auto") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, m);
  }, []);

  const toggle = useCallback(() => {
    setMode(theme === "dark" ? "light" : "dark");
  }, [theme, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
