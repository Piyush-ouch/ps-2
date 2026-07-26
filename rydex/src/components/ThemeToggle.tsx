"use client";

import React, { useState } from "react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { Sun, Moon, Clock, Zap, Settings } from "lucide-react";
import ThemeSettingsModal from "./ThemeSettingsModal";

export default function ThemeToggle() {
  const { themeMode, effectiveTheme, batterySaver, toggleTheme, getScheduleInfo } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { nextSwitchText } = getScheduleInfo();

  const getIcon = () => {
    if (themeMode === "oled" || batterySaver) {
      return <Zap size={17} className="text-amber-400 animate-pulse" />;
    }
    if (themeMode === "auto") {
      return <Clock size={17} className="text-sky-400" />;
    }
    if (effectiveTheme === "dark") {
      return <Moon size={17} className="text-amber-300" />;
    }
    return <Sun size={17} className="text-amber-500" />;
  };

  const getBadgeLabel = () => {
    if (themeMode === "oled") return "OLED";
    if (themeMode === "auto") return "Auto";
    if (batterySaver) return "Saver";
    return themeMode === "dark" ? "Night" : "Day";
  };

  return (
    <>
      <div className="relative flex items-center gap-1.5 bg-white/10 dark:bg-neutral-800/80 border border-white/10 rounded-full p-1 shadow-inner backdrop-blur-md">
        {/* Quick Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Current Theme: ${themeMode.toUpperCase()} (${nextSwitchText}). Click to cycle.`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-white/20 dark:hover:bg-neutral-700/80 transition active:scale-95 text-white"
        >
          {getIcon()}
          <span className="hidden sm:inline capitalize font-medium">{getBadgeLabel()}</span>
        </button>

        {/* Detailed Settings Modal Opener */}
        <button
          onClick={() => setSettingsOpen(true)}
          title="Open Theme & Battery Saver Settings"
          className="p-1.5 rounded-full hover:bg-white/20 dark:hover:bg-neutral-700/80 transition text-gray-300 hover:text-white"
        >
          <Settings size={15} />
        </button>
      </div>

      {/* Full Modal */}
      <ThemeSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
