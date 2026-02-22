// ThemeContext.js
import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "./theme";

const ThemeContext = createContext(null);

// mode: "system" | "light" | "dark"
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // "light" | "dark" | null
  const [mode, setMode] = useState("system");

  const theme = useMemo(() => {
    const pick =
      mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

    const t = pick === "dark" ? darkTheme : lightTheme;

    console.log("ThemeProvider -> mode:", mode, "system:", systemScheme, "picked:", t.name);
    return t;
  }, [mode, systemScheme]);

  const value = useMemo(() => ({ theme, mode, setMode }), [theme, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}