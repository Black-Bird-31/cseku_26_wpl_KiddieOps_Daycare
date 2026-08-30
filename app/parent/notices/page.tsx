"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BellRing, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  User, 
  ShieldAlert,
  Search,
  Filter
} from "lucide-react";
import { store, NoticeRecord } from "@/lib/mock-data";
import AuthGuard from "@/components/auth/AuthGuard";

export default function ParentNoticesPage() {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setNotices(store.getNotices());
  }, []);

  const filteredNotices = notices.filter((ntc) => {
    const matchesPriority = filterPriority === "all" || ntc.priority === filterPriority;
    const matchesSearch =
      ntc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ntc.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <AuthGuard allowedRoles={["parent"]}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Navigation & Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/parent"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Child Dashboard
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/parent/complaints"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
              >
                Go to Incident Reports →
              </Link>
            </div>
          </div>

          {/* Header Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <BellRing className="w-7 h-7 text-amber-500" />
                Center Notices & Announcements
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Official holiday schedules, health alerts, menu updates, and notices from daycare administration.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 self-start sm:self-auto">
              {notices.length} Total Notices
            </span>
          </div>

          {/* Search & Priority Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search announcements..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Priority:
              </span>
              {["all", "urgent", "holiday", "normal"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    filterPriority === p
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notices Feed */}
          <div className="space-y-4">
            {filteredNotices.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                No notices found matching the selected filter.
              </div>
            ) : (
              filteredNotices.map((ntc) => (
                <div
                  key={ntc.id}
                  className={`p-6 rounded-2xl border shadow-xs space-y-3 bg-white ${
                    ntc.priority === "urgent"
                      ? "border-rose-300 bg-rose-50/20"
                      : ntc.priority === "holiday"
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="font-child text-lg font-bold text-slate-900">
                      {ntc.title}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize self-start sm:self-auto ${
                        ntc.priority === "urgent"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : ntc.priority === "holiday"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {ntc.priority} Alert
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {ntc.content}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Published by <strong>{ntc.authorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(ntc.publishedAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
