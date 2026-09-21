"use client";

import React, { useState, useEffect } from "react";
import { Clock, Check, X } from "lucide-react";

interface ClockTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  format?: "12h" | "24h";
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  label?: string;
}

// Helper to convert 24h (HH:mm) to 12h (hh:mm AM/PM)
export function to12h(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parts[1].substring(0, 2);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  const hh = String(h).padStart(2, "0");
  return `${hh}:${m} ${ampm}`;
}

// Helper to convert 12h (hh:mm AM/PM) to 24h (HH:mm)
export function to24h(time12: string): string {
  if (!time12) return "";
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    if (/^\d{1,2}:\d{2}$/.test(time12)) {
      const [h, m] = time12.split(":");
      return `${String(h).padStart(2, "0")}:${m}`;
    }
    return time12;
  }
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = (match[3] || "AM").toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export default function ClockTimePicker({
  value,
  onChange,
  format = "12h",
  placeholder,
  className = "",
  inputClassName = "",
  buttonClassName = "",
  label,
}: ClockTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempTime, setTempTime] = useState("12:00");

  // Sync tempTime whenever the dialog is opened
  useEffect(() => {
    if (isOpen) {
      if (format === "12h") {
        setTempTime(to24h(value) || "12:00");
      } else {
        setTempTime(value || "12:00");
      }
    }
  }, [isOpen, value, format]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleApplyCustomTime = (chosen24: string) => {
    if (!chosen24) return;
    if (format === "12h") {
      onChange(to12h(chosen24));
    } else {
      onChange(chosen24);
    }
    setIsOpen(false);
  };

  const handleCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    handleApplyCustomTime(`${hh}:${mm}`);
  };

  const PRESETS_12H = [
    "08:00 AM",
    "08:30 AM",
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
    "05:30 PM",
  ];

  const PRESETS_24H = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];

  const presets = format === "12h" ? PRESETS_12H : PRESETS_24H;

  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>}

      <div className="flex items-center gap-1.5">
        <input
          type={format === "24h" ? "time" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || (format === "12h" ? "e.g. 09:30 AM" : "09:30")}
          className={`w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-hidden focus:border-blue-600 ${inputClassName}`}
        />

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Choose any time with clock"
          className={`p-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 rounded-xl text-slate-600 border border-slate-200 transition-all cursor-pointer flex-shrink-0 flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 ${buttonClassName}`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* Centered Fixed Time Picker Modal (Never Clipped by Overflow) */}
      {/* ============================================================ */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 max-w-sm w-full space-y-4 animate-in zoom-in-95 text-xs text-slate-800 modal-scrollbar max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>{label ? `Choose ${label}` : "Choose Any Time"}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Interactive Time Stepper / Clock */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-700">
                Custom Clock Time ({format === "12h" ? "12-Hour" : "24-Hour"})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white text-slate-900 focus:outline-hidden focus:border-blue-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomTime(tempTime)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  <Check className="w-4 h-4" /> Apply Time
                </button>
              </div>
            </div>

            {/* Quick Schedule Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Common Daycare Schedule Times
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto modal-scrollbar p-0.5">
                {presets.map((p) => {
                  const isSelected = value === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        onChange(p);
                        setIsOpen(false);
                      }}
                      className={`py-2 px-2 rounded-xl text-center font-semibold text-xs border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick "Now" Button & Close Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCurrentTime}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-200"
              >
                <Clock className="w-4 h-4 text-amber-700" />
                Current Time (Now)
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
