"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BellRing, 
  ArrowLeft, 
  PlusCircle, 
  Send, 
  CheckCircle2, 
  Calendar, 
  User, 
  ShieldAlert,
  Sparkles,
  Filter,
  Trash2
} from "lucide-react";
import { store, NoticeRecord } from "@/lib/mock-data";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent" | "holiday">("holiday");
  const [targetAudience, setTargetAudience] = useState<"all" | "caregivers" | "parents">("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Deletion modal state
  const [deletingNotice, setDeletingNotice] = useState<NoticeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadNotices = () => {
    setNotices(store.getNotices());
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    store.addNotice({
      title,
      content,
      priority,
      targetAudience,
      authorName: "Tanzina Rahman (Principal)",
    });

    loadNotices();
    setTitle("");
    setContent("");
    setSuccessMessage("Notice broadcasted successfully to all authorized portals!");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDeleteNoticeConfirm = () => {
    if (!deletingNotice) return;
    setIsDeleting(true);

    const deleted = store.deleteNotice(deletingNotice.id);
    setIsDeleting(false);

    if (deleted) {
      setGlobalBanner(`Announcement "${deletingNotice.title}" has been deleted.`);
      setDeletingNotice(null);
      loadNotices();
      setTimeout(() => setGlobalBanner(null), 4000);
    }
  };

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <Link
              href="/admin/complaints"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
            >
              Triage Parent Complaints →
            </Link>
          </div>

          {/* Banner Notification */}
          {globalBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{globalBanner}</span>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <BellRing className="w-7 h-7 text-amber-500" />
                Center Notices & Announcements Management
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Compose, schedule, and broadcast center closures, health guidelines, and event advisories.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 self-start sm:self-auto">
              {notices.length} Published Notices
            </span>
          </div>

          {/* Publisher Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Publisher Form (Left 1 Col) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Compose New Announcement
              </h2>

              <form onSubmit={handleBroadcast} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notice Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Daycare Closure for Holiday"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="holiday">Holiday Closure</option>
                      <option value="urgent">Urgent Alert</option>
                      <option value="normal">Normal Announcement</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Target Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="all">All Users</option>
                      <option value="parents">Parents Only</option>
                      <option value="caregivers">Caregivers Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Message Content *</label>
                  <textarea
                    rows={4}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide details about the announcement..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                {successMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Broadcast Announcement
                </button>
              </form>
            </div>

            {/* Published Notices Archive (Right 2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              {notices.map((ntc) => (
                <div
                  key={ntc.id}
                  className={`p-6 rounded-2xl border shadow-xs bg-white space-y-3 ${
                    ntc.priority === "urgent"
                      ? "border-rose-300 bg-rose-50/20"
                      : ntc.priority === "holiday"
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-child text-lg font-bold text-slate-900">{ntc.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {ntc.targetAudience}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          ntc.priority === "urgent"
                            ? "bg-rose-100 text-rose-700"
                            : ntc.priority === "holiday"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {ntc.priority}
                      </span>
                      <button
                        onClick={() => setDeletingNotice(ntc)}
                        title="Delete Notice"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {ntc.content}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Author: <strong>{ntc.authorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(ntc.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Notice Confirmation Modal */}
          <ConfirmationModal
            isOpen={!!deletingNotice}
            onClose={() => setDeletingNotice(null)}
            onConfirm={handleDeleteNoticeConfirm}
            title="Delete Center Notice"
            message={`Are you sure you want to remove the announcement "${deletingNotice?.title}"? It will no longer be visible on parent and staff portals.`}
            confirmLabel="Delete Notice"
            variant="danger"
            isLoading={isDeleting}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
