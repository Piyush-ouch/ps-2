"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto" | "oled";

export interface ScheduleConfig {
  dayStartHour: number;   // e.g. 6 (6:00 AM)
  nightStartHour: number; // e.g. 19 (7:00 PM)
}

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: "light" | "dark" | "oled";
  batterySaver: boolean;
  scheduleConfig: ScheduleConfig;
  setThemeMode: (mode: ThemeMode) => void;
  setBatterySaver: (enabled: boolean) => void;
  setScheduleConfig: (config: ScheduleConfig) => void;
  toggleTheme: () => void;
  getScheduleInfo: () => { isNightTime: boolean; nextSwitchText: string };
}

const STORAGE_KEY = "rydex_theme_config_v1";

const DEFAULT_SCHEDULE: ScheduleConfig = {
  dayStartHour: 6,
  nightStartHour: 19,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
  const [batterySaver, setBatterySaverState] = useState<boolean>(false);
  const [scheduleConfig, setScheduleConfigState] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark" | "oled">("dark");

  // Load stored preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.themeMode) setThemeModeState(parsed.themeMode);
        if (typeof parsed.batterySaver === "boolean") setBatterySaverState(parsed.batterySaver);
        if (parsed.scheduleConfig) setScheduleConfigState(parsed.scheduleConfig);
      }
    } catch (e) {
      console.error("Failed to load theme preference:", e);
    }
  }, []);

  // Save preferences
  const savePreferences = (
    mode: ThemeMode,
    saver: boolean,
    schedule: ScheduleConfig
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          themeMode: mode,
          batterySaver: saver,
          scheduleConfig: schedule,
        })
      );
    } catch (e) {
      console.error("Failed to save theme preference:", e);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    savePreferences(mode, batterySaver, scheduleConfig);
  };

  const setBatterySaver = (enabled: boolean) => {
    setBatterySaverState(enabled);
    savePreferences(themeMode, enabled, scheduleConfig);
  };

  const setScheduleConfig = (config: ScheduleConfig) => {
    setScheduleConfigState(config);
    savePreferences(themeMode, batterySaver, config);
  };

  const toggleTheme = () => {
    const modes: ThemeMode[] = ["light", "dark", "auto", "oled"];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
  };

  // Evaluate effective theme
  useEffect(() => {
    const evaluateTheme = () => {
      const now = new Date();
      const currentHour = now.getHours();

      let computed: "light" | "dark" | "oled" = "dark";

      if (themeMode === "light") {
        computed = "light";
      } else if (themeMode === "dark") {
        computed = batterySaver ? "oled" : "dark";
      } else if (themeMode === "oled") {
        computed = "oled";
      } else if (themeMode === "auto") {
        const isNight =
          currentHour >= scheduleConfig.nightStartHour ||
          currentHour < scheduleConfig.dayStartHour;
        if (isNight) {
          computed = batterySaver ? "oled" : "dark";
        } else {
          computed = "light";
        }
      }

      setEffectiveTheme(computed);

      // DOM manipulation for CSS variables & tailwind
      const root = document.documentElement;
      root.classList.remove("dark", "light", "oled-theme", "battery-saver-active");

      if (computed === "dark") {
        root.classList.add("dark");
      } else if (computed === "oled") {
        root.classList.add("dark", "oled-theme");
      }

      if (batterySaver || computed === "oled") {
        root.classList.add("battery-saver-active");
      }

      root.setAttribute("data-theme", computed);
    };

    evaluateTheme();

    // Re-evaluate every 60 seconds for auto time scheduling
    const interval = setInterval(evaluateTheme, 60000);
    return () => clearInterval(interval);
  }, [themeMode, batterySaver, scheduleConfig]);

  const getScheduleInfo = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const isNightTime =
      currentHour >= scheduleConfig.nightStartHour ||
      currentHour < scheduleConfig.dayStartHour;

    let nextSwitchText = "";
    if (isNightTime) {
      nextSwitchText = `Day mode starts at ${scheduleConfig.dayStartHour}:00 AM`;
    } else {
      nextSwitchText = `Night mode starts at ${
        scheduleConfig.nightStartHour > 12
          ? scheduleConfig.nightStartHour - 12
          : scheduleConfig.nightStartHour
      }:00 PM`;
    }

    return { isNightTime, nextSwitchText };
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        effectiveTheme,
        batterySaver,
        scheduleConfig,
        setThemeMode,
        setBatterySaver,
        setScheduleConfig,
        toggleTheme,
        getScheduleInfo,
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
