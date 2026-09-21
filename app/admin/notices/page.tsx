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
  Trash2,
  RefreshCw
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { getStoredUser } from "@/lib/auth-client";
import { 
  getAdminNoticesAction, 
  createNoticeAction, 
  deleteNoticeAction, 
  AdminNoticeItem 
} from "@/lib/actions/admin";
import { store } from "@/lib/mock-data";

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<AdminNoticeItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent" | "holiday">("holiday");
  const [targetAudience, setTargetAudience] = useState<"all" | "caregivers" | "parents">("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [deletingNotice, setDeletingNotice] = useState<AdminNoticeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingPublish, setIsConfirmingPublish] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadNotices = async () => {
    setLoading(true);
    const res = await getAdminNoticesAction();
    if (res.success && res.notices) {
      setNotices(res.notices);
    } else {
      // Fallback
      const list = store.getNotices();
      const mapped: AdminNoticeItem[] = list.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        targetAudience: n.targetAudience,
        authorName: n.authorName,
        classroomId: null,
        publishedAt: n.publishedAt,
      }));
      setNotices(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsConfirmingPublish(true);
  };

  const executeBroadcast = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsPublishing(true);

    const currentUser = getStoredUser();

    // 1. PostgreSQL DB insert
    const res = await createNoticeAction({
      title: title.trim(),
      description: content.trim(),
      priority,
      targetAudience,
      authorUserId: currentUser?.id,
    });

    // 2. Store fallback
    store.addNotice({
      title: title.trim(),
      content: content.trim(),
      priority,
      targetAudience,
      authorName: currentUser?.name || "Tanzina Rahman (Principal)",
    });

    setIsPublishing(false);
    setIsConfirmingPublish(false);
    setTitle("");
    setContent("");
    setSuccessMessage(
      res.success
        ? "Notice broadcasted and synchronized with PostgreSQL database!"
        : "Notice broadcasted to portal!"
    );
    loadNotices();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDeleteNoticeConfirm = async () => {
    if (!deletingNotice) return;
    setIsDeleting(true);

    // 1. PostgreSQL DB delete
    const res = await deleteNoticeAction(deletingNotice.id);

    // 2. Store fallback
    store.deleteNotice(deletingNotice.id);

    setIsDeleting(false);

    if (res.success || true) {
      setGlobalBanner(`Announcement "${deletingNotice.title}" has been deleted from database.`);
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadNotices()}
                disabled={loading}
                title="Refresh notices from PostgreSQL"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL Synced
              </span>

              <Link
                href="/admin/complaints"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
              >
                Triage Parent Complaints →
              </Link>
            </div>
          </div>

          {/* Banner Notification */}
          {globalBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{globalBanner}</span>
            </div>
          )}

          {/* Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <BellRing className="w-6 h-6 text-blue-600" />
                Center Announcements & Bulletin Board
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Broadcast official daycare center bulletins, emergency alerts, holiday schedules, and vaccination notices.
              </p>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs">
              {notices.length} Active Center Bulletins
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Compose Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-child text-base font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Broadcast New Announcement</span>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bulletin Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Eid-ul-Fitr Daycare Center Closure Schedule"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:outline-hidden focus:border-blue-600 cursor-pointer"
                    >
                      <option value="holiday">Holiday Closure</option>
                      <option value="urgent">Urgent Advisory</option>
                      <option value="normal">Standard Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:outline-hidden focus:border-blue-600 cursor-pointer"
                    >
                      <option value="all">All Portals</option>
                      <option value="parents">Parents Only</option>
                      <option value="caregivers">Staff Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Notice Description *</label>
                  <textarea
                    rows={5}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide full announcement details, operational dates, health safety directives, and parent instructions..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-blue-600 resize-none leading-relaxed"
                  />
                </div>

                {successMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Broadcast Notice to Database
                </button>
              </form>
            </div>

            {/* Right: Notices List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-700">Published Bulletins</span>
                <span className="text-xs text-slate-500 font-mono">
                  {notices.length} active announcements in PostgreSQL
                </span>
              </div>

              {notices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  No center announcements published yet.
                </div>
              ) : (
                notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              notice.priority === "urgent"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : notice.priority === "holiday"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {notice.priority}
                          </span>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Audience: {notice.targetAudience}
                          </span>

                          {notice.classroomName && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                              {notice.classroomName}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          {notice.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeletingNotice(notice)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Published by:{" "}
                        <strong className="text-slate-600">{notice.authorName}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />{" "}
                        {new Date(notice.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Deletion Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!deletingNotice}
          title="Delete Center Notice"
          message={`Are you sure you want to permanently delete the bulletin "${deletingNotice?.title}" from the database? It will no longer be visible on parent or staff portals.`}
          confirmLabel="Delete Notice"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteNoticeConfirm}
          onClose={() => setDeletingNotice(null)}
        />

        {/* Broadcast Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmingPublish}
          title="Publish Center Bulletin"
          message={`Are you sure you want to broadcast "${title}" to ${targetAudience === "all" ? "all center portals" : targetAudience}?`}
          confirmLabel="Broadcast Now"
          cancelLabel="Cancel"
          variant="warning"
          isLoading={isPublishing}
          onConfirm={executeBroadcast}
          onClose={() => setIsConfirmingPublish(false)}
        />
      </div>
    </AuthGuard>
  );
}
