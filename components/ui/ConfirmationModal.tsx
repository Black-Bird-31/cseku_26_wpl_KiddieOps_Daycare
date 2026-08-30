"use client";

import React from "react";
import { AlertTriangle, Trash2, Power, CheckCircle, X, ShieldAlert } from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "success" | "toggle";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-600" />,
          iconBg: "bg-rose-100",
          confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white",
        };
      case "toggle":
        return {
          icon: <Power className="w-6 h-6 text-amber-600" />,
          iconBg: "bg-amber-100",
          confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          iconBg: "bg-amber-100",
          confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "success":
        return {
          icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
          iconBg: "bg-emerald-100",
          confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-blue-600" />,
          iconBg: "bg-blue-100",
          confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-3">
          <div className={`w-12 h-12 rounded-2xl ${styles.iconBg} flex items-center justify-center mx-auto shadow-xs`}>
            {styles.icon}
          </div>

          <div className="space-y-1">
            <h3 className="font-child text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-2.5 pt-5 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${styles.confirmBtn}`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
