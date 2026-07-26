"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sun, Moon, Clock, Zap, Shield, Sparkles, BatteryCharging, Check } from "lucide-react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ThemeSettingsModal({ open, onClose }: Props) {
  const {
    themeMode,
    effectiveTheme,
    batterySaver,
    scheduleConfig,
    setThemeMode,
    setBatterySaver,
    setScheduleConfig,
    getScheduleInfo,
  } = useTheme();

  const { isNightTime, nextSwitchText } = getScheduleInfo();

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm"
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl p-6 md:p-8 text-white overflow-hidden">
              {/* Top Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Theme & Battery Settings</h2>
                    <p className="text-xs text-gray-400">Smart Scheduling & Driver OLED Optimization</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content Body */}
              <div className="mt-6 space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                {/* 1. Theme Mode Selection Cards */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-3">
                    Select Display Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Light Mode Card */}
                    <button
                      onClick={() => setThemeMode("light")}
                      className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between h-24 ${
                        themeMode === "light"
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-white/5 border-white/10 hover:border-white/20 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Sun size={22} className="text-amber-400" />
                        {themeMode === "light" && <Check size={18} className="text-amber-400" />}
                      </div>
                      <div>
                        <span className="block font-bold text-sm">Light Mode</span>
                        <span className="text-[11px] text-gray-400">Daytime clarity</span>
                      </div>
                    </button>

                    {/* Dark Mode Card */}
                    <button
                      onClick={() => setThemeMode("dark")}
                      className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between h-24 ${
                        themeMode === "dark"
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-white/5 border-white/10 hover:border-white/20 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Moon size={22} className="text-indigo-400" />
                        {themeMode === "dark" && <Check size={18} className="text-amber-400" />}
                      </div>
                      <div>
                        <span className="block font-bold text-sm">Dark Mode</span>
                        <span className="text-[11px] text-gray-400">Low-light comfort</span>
                      </div>
                    </button>

                    {/* Auto Smart Schedule Card */}
                    <button
                      onClick={() => setThemeMode("auto")}
                      className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between h-24 ${
                        themeMode === "auto"
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-white/5 border-white/10 hover:border-white/20 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Clock size={22} className="text-sky-400" />
                        {themeMode === "auto" && <Check size={18} className="text-amber-400" />}
                      </div>
                      <div>
                        <span className="block font-bold text-sm">Smart Auto</span>
                        <span className="text-[11px] text-gray-400">Auto Day/Night</span>
                      </div>
                    </button>

                    {/* OLED Pitch Black Saver Card */}
                    <button
                      onClick={() => setThemeMode("oled")}
                      className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between h-24 ${
                        themeMode === "oled"
                          ? "bg-amber-500/10 border-amber-500 text-white"
                          : "bg-white/5 border-white/10 hover:border-white/20 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Zap size={22} className="text-amber-400" />
                        {themeMode === "oled" && <Check size={18} className="text-amber-400" />}
                      </div>
                      <div>
                        <span className="block font-bold text-sm">OLED Battery</span>
                        <span className="text-[11px] text-amber-400 font-semibold">Pure #000000 Black</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Night Driver OLED & Battery Saver Toggle */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-black border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                        <BatteryCharging size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Night Driver OLED Optimization</h4>
                        <p className="text-xs text-gray-400">Saves up to 40% screen power during night rides</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setBatterySaver(!batterySaver)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${
                        batterySaver ? "bg-amber-500" : "bg-white/20"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ease-in-out ${
                          batterySaver ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed pt-1 border-t border-white/10">
                    ⚡ Enables true pitch black OLED theme and reduces GPU animation load for drivers navigating long shifts.
                  </p>
                </div>

                {/* 3. Smart Schedule Customizer */}
                {themeMode === "auto" && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
                        <Clock size={15} />
                        Smart Time Schedule
                      </div>
                      <span className="text-xs text-gray-400 font-mono">{nextSwitchText}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Day Starts At</label>
                        <select
                          value={scheduleConfig.dayStartHour}
                          onChange={(e) =>
                            setScheduleConfig({
                              ...scheduleConfig,
                              dayStartHour: parseInt(e.target.value),
                            })
                          }
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 4).map((hour) => (
                            <option key={hour} value={hour}>
                              {hour}:00 AM
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Night Starts At</label>
                        <select
                          value={scheduleConfig.nightStartHour}
                          onChange={(e) =>
                            setScheduleConfig({
                              ...scheduleConfig,
                              nightStartHour: parseInt(e.target.value),
                            })
                          }
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                        >
                          {[17, 18, 19, 20, 21, 22, 23].map((hour) => (
                            <option key={hour} value={hour}>
                              {hour > 12 ? hour - 12 : hour}:00 PM
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Active Status Footer Badge */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      Active: <strong className="text-white capitalize">{effectiveTheme}</strong>
                    </span>
                  </div>
                  <span>{isNightTime ? "🌙 Night Hours" : "☀️ Daylight Hours"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
