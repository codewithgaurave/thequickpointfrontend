// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

// ---- 4 Color Theme Core ----
const BASE_COLORS = {
  primary: "#000000",       // Black
  secondary: "#ffffff",     // White

  accent: "#f59e0b",        // Orange
  success: "#10b981",       // Green
  warning: "#f59e0b",       // Orange

  backgroundLight: "#ffffff",
  backgroundDark: "#000000",

  surfaceLight: "#ffffff",
  surfaceDark: "#111111",

  textLight: "#000000",
  textDark: "#ffffff",

  borderLight: "#f59e0b",   // Orange Border
  borderDark: "#f59e0b",

  hoverLight: "#ffe8c7",    // Light Orange Hover
  hoverDark: "#f59e0b33",   // Orange Transparent Hover

  activeLight: "#f59e0b",   // Active Orange
  activeDark: "#f59e0b",
};

// ---- All palettes same now ----
const colorPalettes = {
  corporate: BASE_COLORS,
  luxury: BASE_COLORS,
  modern: BASE_COLORS,
  minimal: BASE_COLORS,
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => localStorage.getItem("theme") || "light";
  const getInitialPalette = () => localStorage.getItem("palette") || "corporate";

  const [theme, setTheme] = useState(getInitialTheme);
  const [palette, setPalette] = useState(getInitialPalette);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    theme === "dark" ? html.classList.add("dark") : html.classList.remove("dark");

    localStorage.setItem("theme", theme);
    localStorage.setItem("palette", palette);
  }, [theme, palette]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const changePalette = (newPalette) => {
    if (colorPalettes[newPalette]) setPalette(newPalette);
  };

  const colors = colorPalettes[palette];

  // --- FINAL DESIGN: All 4 colors applied consistently! ---
  const themeColors = {
    light: {
      mode: "light",
      primary: colors.primary,
      secondary: colors.secondary,

      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,

      background: colors.backgroundLight,
      surface: colors.surfaceLight,
      text: colors.textLight,

      border: colors.borderLight,

      hover: {
        background: colors.hoverLight,
        text: colors.textLight,
        border: colors.accent,
      },

      active: {
        background: colors.activeLight,
        text: colors.secondary,
        border: colors.accent,
      },

      onPrimary: "#ffffff",
    },

    dark: {
      mode: "dark",

      primary: colors.primary,
      secondary: colors.secondary,

      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,

      background: colors.backgroundDark,
      surface: colors.surfaceDark,
      text: colors.textDark,

      border: colors.borderDark,

      hover: {
        background: colors.hoverDark,
        text: colors.textDark,
        border: colors.accent,
      },

      active: {
        background: colors.activeDark,
        text: colors.secondary,
        border: colors.accent,
      },

      onPrimary: "#ffffff",
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        palette,
        changePalette,
        themeColors: themeColors[theme],
        availablePalettes: Object.keys(colorPalettes),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
