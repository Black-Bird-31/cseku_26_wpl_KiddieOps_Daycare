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
  Filter,
  RefreshCw,
  Clock,
  ExternalLink
} from "lucide-react";
import { store } from "@/lib/mock-data";
import { getCenterNoticesAction, createNoticeAction, AdminNoticeItem } from "@/lib/actions/admin";
import { getStoredUser } from "@/lib/auth-client";
import AuthGuard from "@/components/auth/AuthGuard";
import { X, Check } from "lucide-react";

export default function CaregiverNoticesPage() {
  const [notices, setNotices] = useState<AdminNoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Broadcast modal state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastDescription, setBroadcastDescription] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState<"normal" | "urgent" | "holiday">("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await getCenterNoticesAction();
      if (res.success && res.notices) {
        // Show directives for caregivers and notices authored by caregivers
        const forCaregivers = res.notices.filter((n) => n.targetAudience !== "parents" || n.authorRole === "caregiver");
        setNotices(forCaregivers);
      } else {
        const fallback = store.getNotices().filter((n) => n.targetAudience !== "parents" || n.authorRole === "caregiver").map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          priority: n.priority,
          targetAudience: n.targetAudience,
          authorName: n.authorName,
          authorRole: n.authorRole || "administrator",
          classroomId: null,
          classroomName: undefined,
          publishedAt: n.publishedAt,
        }));
        setNotices(fallback);
      }
    } catch {
      const fallback = store.getNotices().filter((n) => n.targetAudience !== "parents" || n.authorRole === "caregiver").map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        targetAudience: n.targetAudience,
        authorName: n.authorName,
        authorRole: n.authorRole || "administrator",
        classroomId: null,
        classroomName: undefined,
        publishedAt: n.publishedAt,
      }));
      setNotices(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastDescription.trim()) return;
    setIsSubmitting(true);
    try {
      const currentUser = getStoredUser();
      const res = await createNoticeAction({
        title: broadcastTitle.trim(),
        description: broadcastDescription.trim(),
        priority: broadcastPriority,
        targetAudience: "parents",
        authorUserId: currentUser?.id,
      });

      if (res.success) {
        setIsBroadcastModalOpen(false);
        setBroadcastTitle("");
        setBroadcastDescription("");
        setBroadcastPriority("normal");
        loadNotices();
      }
    } catch (err) {
      console.error("Broadcast notice error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const filteredNotices = notices.filter((ntc) => {
    const matchesPriority = filterPriority === "all" || ntc.priority === filterPriority;
    const matchesSearch =
      ntc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ntc.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <AuthGuard allowedRoles={["caregiver", "administrator"]}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/caregiver"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Classroom Portal
            </Link>

            <Link
              href="/caregiver/attendance"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Attendance Sheet →</span>
            </Link>
          </div>

          {/* Header Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <BellRing className="w-7 h-7 text-amber-500" />
                Staff Bulletins & Center Directives
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Administrative broadcasts, weather alerts, holiday schedules, and health advisories for classroom teachers.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-slate-950" />
                <span>+ Broadcast to Parents</span>
              </button>
              <button
                onClick={loadNotices}
                disabled={loading}
                title="Refresh notices from center"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {notices.length} Active Directives
              </span>
            </div>
          </div>

          {/* Search & Priority Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff notices..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-600"
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
                      ? "bg-slate-900 text-white shadow-xs"
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
            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>Loading latest center directives...</span>
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                No directives found matching the selected filter.
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
                      <span>Issued by <strong>{ntc.authorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(ntc.publishedAt).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Broadcast Modal */}
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <BellRing className="w-5 h-5 text-amber-500" />
                  <span>Broadcast Notice to Parents</span>
                </div>
                <button
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBroadcastNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notice Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Spare Clothes Needed for Sensory Art Play"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="normal">Normal Bulletin</option>
                    <option value="urgent">Urgent Alert</option>
                    <option value="holiday">Holiday / Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notice Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastDescription}
                    onChange={(e) => setBroadcastDescription(e.target.value)}
                    placeholder="Enter instructions, routine updates, or reminders for parents..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSubmitting ? "Broadcasting..." : "Broadcast Notice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
