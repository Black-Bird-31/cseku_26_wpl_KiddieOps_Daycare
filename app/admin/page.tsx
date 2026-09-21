"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Baby,
  School,
  ShieldAlert,
  UserPlus,
  PlusCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  HeartPulse,
  BellRing,
  AlertTriangle,
  FileText,
  Check,
  Eye,
  LayoutDashboard,
  Shield,
  Search,
  ExternalLink,
  Sparkles,
  Send,
  RefreshCw
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { getStoredUser } from "@/lib/auth-client";
import { 
  getAdminDashboardStatsAction, 
  resolveComplaintAction, 
  createNoticeAction,
  AdminComplaintItem,
  AdminNoticeItem
} from "@/lib/actions/admin";
import { getAllChildrenAction } from "@/lib/actions/children";
import { getUsersAction } from "@/lib/actions/users";
import { getClassroomsAction } from "@/lib/actions/classrooms";
import { store, ChildRecord, UserRecord, ClassroomRecord } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [complaints, setComplaints] = useState<AdminComplaintItem[]>([]);
  const [notices, setNotices] = useState<AdminNoticeItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "notices">("overview");
  const [loading, setLoading] = useState(true);

  // Live Stats from Database
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalStaff: 0,
    totalClassrooms: 0,
    pendingIncidents: 0,
  });

  // Selected complaint for resolution
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>("");
  const [complaintStatus, setComplaintStatus] = useState<"pending" | "under_review" | "resolved">("under_review");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolvedMessage, setIsResolvedMessage] = useState<string | null>(null);

  // New Notice form
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticePriority, setNoticePriority] = useState<"normal" | "urgent" | "holiday">("holiday");
  const [noticeAudience, setNoticeAudience] = useState<"all" | "caregivers" | "parents">("all");
  const [noticeSuccess, setNoticeSuccess] = useState<string | null>(null);

  // Confirmation modal states
  const [isConfirmingResolve, setIsConfirmingResolve] = useState(false);
  const [isConfirmingNotice, setIsConfirmingNotice] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    // 1. Fetch DB Stats & Complaints & Notices from PostgreSQL
    const statsRes = await getAdminDashboardStatsAction();
    if (statsRes.success) {
      setStats(statsRes.stats);
      setComplaints(statsRes.complaints);
      setNotices(statsRes.notices);

      if (statsRes.complaints.length > 0 && !selectedComplaintId) {
        const active = statsRes.complaints[0];
        setSelectedComplaintId(active.id);
        setComplaintStatus(active.status === "dismissed" ? "resolved" : active.status);
        setResolutionNotes(active.adminNotes || "");
      }
    }

    // 2. Fetch Children from DB
    const childRes = await getAllChildrenAction("administrator");
    if (childRes.success && childRes.children) {
      setChildren(childRes.children);
    } else {
      setChildren(store.getChildren());
    }

    // 3. Fetch Users from DB
    const userRes = await getUsersAction("administrator");
    if (userRes.success && userRes.users) {
      setUsers(userRes.users);
    } else {
      setUsers(store.getUsers());
    }

    // 4. Classrooms from PostgreSQL
    const roomRes = await getClassroomsAction();
    if (roomRes.success && roomRes.classrooms) {
      setClassrooms(roomRes.classrooms);
    } else {
      setClassrooms(store.getClassrooms());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectComplaint = (comp: AdminComplaintItem) => {
    setSelectedComplaintId(comp.id);
    setComplaintStatus(comp.status === "dismissed" ? "resolved" : comp.status);
    setResolutionNotes(comp.adminNotes || "");
  };

  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;
    setIsConfirmingResolve(true);
  };

  const executeResolveComplaint = async () => {
    if (!selectedComplaintId) return;
    setIsActionLoading(true);
    const currentUser = getStoredUser();
    // 1. Update in PostgreSQL
    const res = await resolveComplaintAction(
      selectedComplaintId,
      complaintStatus,
      resolutionNotes,
      currentUser?.id
    );

    // 2. Update in store for local fallback
    store.resolveComplaint(selectedComplaintId, resolutionNotes, complaintStatus);
    setIsActionLoading(false);
    setIsConfirmingResolve(false);

    if (res.success) {
      setIsResolvedMessage(`Complaint resolution successfully updated and synced with database.`);
      setTimeout(() => setIsResolvedMessage(null), 4000);
      loadData();
    } else {
      setIsResolvedMessage(`Error: ${res.error || "Failed to update complaint."}`);
    }
  };

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    setIsConfirmingNotice(true);
  };

  const executePublishNotice = async () => {
    setIsActionLoading(true);
    const currentUser = getStoredUser();

    // 1. Insert in PostgreSQL
    const res = await createNoticeAction({
      title: noticeTitle.trim(),
      description: noticeContent.trim(),
      priority: noticePriority,
      targetAudience: noticeAudience,
      authorUserId: currentUser?.id,
    });

    // 2. Store fallback
    store.addNotice({
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      priority: noticePriority,
      targetAudience: noticeAudience,
      authorName: currentUser?.name || "Tanzina Rahman (Principal)",
    });

    setIsActionLoading(false);
    setIsConfirmingNotice(false);

    if (res.success) {
      setNoticeTitle("");
      setNoticeContent("");
      setNoticeSuccess("Center Notice published and synchronized to all active portals in PostgreSQL!");
      setTimeout(() => setNoticeSuccess(null), 4000);
      loadData();
    } else {
      setNoticeSuccess(`Notice created locally: ${res.error || "Notice broadcasted."}`);
    }
  };

  const pendingComplaintsCount = stats.pendingIncidents;

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Persistent Left Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Admin Control</div>
                <div className="text-[11px] text-slate-500">Daycare Governance</div>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
                Dashboard Overview
              </button>

              <Link
                href="/admin/users"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <Users className="w-4 h-4 text-slate-500" />
                Staff & Parents Directory
              </Link>

              <Link
                href="/admin/children"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <Baby className="w-4 h-4 text-slate-500" />
                Enrolled Children Roster
              </Link>

              <Link
                href="/admin/complaints"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Parent Complaints</span>
                </div>
                {pendingComplaintsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                    {pendingComplaintsCount}
                  </span>
                )}
              </Link>

              <Link
                href="/admin/notices"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <BellRing className="w-4 h-4 text-slate-500" />
                  <span>Center Notices</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {notices.length}
                </span>
              </Link>
            </nav>
          </div>

          {/* Quick Actions Footer */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Quick Operations</div>
            <Link
              href="/admin/children"
              className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + Register Child
            </Link>
            <Link
              href="/admin/users"
              className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> + Add User
            </Link>
          </div>
        </aside>

        {/* Main Admin Workspace */}
        <main className="flex-1 p-6 sm:p-8 space-y-8 max-w-6xl">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Administrator Dashboard
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PostgreSQL Active
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Overview of capacity, staff directory, parent complaints triage, and center announcements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadData()}
                disabled={loading}
                title="Refresh database records"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <Link
                href="/admin/classrooms"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <School className="w-4 h-4 text-emerald-600" /> Manage Classrooms
              </Link>
              <Link
                href="/admin/children"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" /> Enroll Child
              </Link>
              <Link
                href="/admin/users"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-4 h-4" /> Add User
              </Link>
            </div>
          </div>

          {/* 4 Stat Cards - Dynamic from PostgreSQL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Children</span>
                <Baby className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {stats.totalChildren || children.length}
              </div>
              <div className="text-[11px] text-blue-600 font-semibold">Enrolled in PostgreSQL</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Staff & Parents</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {stats.totalStaff || users.length}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">Active Registered Accounts</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Center Notices</span>
                <BellRing className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{notices.length}</div>
              <div className="text-[11px] text-amber-600 font-semibold">Live Database Bulletins</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Pending Complaints</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-3xl font-extrabold text-rose-600">
                {pendingComplaintsCount}
              </div>
              <div className="text-[11px] text-rose-600 font-semibold">Requires Admin Resolution</div>
            </div>
          </div>

          {/* Section 1: Classroom Capacity & Live Notice Broadcast */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classroom Enrollment Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  Classroom Enrollment Capacity
                </h2>
                <Link
                  href="/admin/classrooms"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  <span>Manage ({classrooms.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-4 text-xs">
                {classrooms.map((cls) => {
                  const count = children.filter((c) => c.classroomId === cls.id || c.classroomName?.includes("Butterflies")).length;
                  const capacity = 15;
                  const pct = Math.min(Math.round((count / capacity) * 100), 100);
                  return (
                    <div key={cls.id}>
                      <div className="flex justify-between font-semibold text-slate-700 mb-1">
                        <span>{cls.name}</span>
                        <span className="font-bold">{count} / {capacity} Enrolled</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 80 ? "bg-amber-500" : "bg-blue-600"}`}
                          style={{ width: `${Math.max(pct, 15)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center Announcement Publisher (Synced to PostgreSQL notices table) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-500" />
                  Publish Center Notice (Database Broadcast)
                </h2>
                <span className="text-[11px] text-slate-500 font-semibold">PostgreSQL</span>
              </div>

              <form onSubmit={handlePublishNotice} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notice Title *</label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g. Daycare Closure for Public Holiday & Vaccine Drive"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={noticePriority}
                      onChange={(e) => setNoticePriority(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-hidden focus:border-blue-600 cursor-pointer"
                    >
                      <option value="holiday">Holiday Closure</option>
                      <option value="urgent">Urgent Alert</option>
                      <option value="normal">Normal Announcement</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Audience</label>
                    <select
                      value={noticeAudience}
                      onChange={(e) => setNoticeAudience(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-hidden focus:border-blue-600 cursor-pointer"
                    >
                      <option value="all">All (Parents & Staff)</option>
                      <option value="parents">Parents Only</option>
                      <option value="caregivers">Caregivers Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Message Content *</label>
                  <textarea
                    rows={2}
                    required
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    placeholder="Provide details about the announcement..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:border-blue-600 resize-none"
                  />
                </div>

                {noticeSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{noticeSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Broadcast Notice
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section 2: Parent Complaints Investigation & Resolution Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-child text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Parent Complaints Investigation & Resolution (PostgreSQL Synced)
                </h2>
                <p className="text-xs text-slate-500">
                  Review incident reports filed by parents, examine proof images, and submit official resolution notes.
                </p>
              </div>

              {pendingComplaintsCount === 0 ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  All Resolved
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {pendingComplaintsCount} Pending Triage
                </span>
              )}
            </div>

            {/* Complaints Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Case ID</th>
                    <th className="px-4 py-3">Parent</th>
                    <th className="px-4 py-3">Caregiver</th>
                    <th className="px-4 py-3">Incident Summary</th>
                    <th className="px-4 py-3">Proof Attachment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400">
                        No parent complaints on record in database.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((comp) => (
                      <tr
                        key={comp.id}
                        onClick={() => handleSelectComplaint(comp)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          selectedComplaintId === comp.id ? "bg-blue-50/60" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {comp.id.length > 8 ? `${comp.id.substring(0, 8)}...` : comp.id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{comp.parentName}</td>
                        <td className="px-4 py-3 text-slate-600">{comp.caregiverName}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{comp.incidentTitle}</span>
                          <span className="text-slate-500 text-[11px] line-clamp-1">{comp.incidentDescription}</span>
                        </td>
                        <td className="px-4 py-3">
                          {comp.proofAttachmentUrl ? (
                            <a
                              href={comp.proofAttachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono text-[11px] border border-blue-200"
                            >
                              📷 View Proof <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {comp.status === "resolved" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <Check className="w-3 h-3" /> Resolved
                            </span>
                          ) : comp.status === "under_review" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              Under Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSelectComplaint(comp)}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-semibold text-slate-700 cursor-pointer"
                          >
                            Triage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resolution Form Box */}
            <form onSubmit={handleResolveComplaint} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-xs text-slate-900">
                  Administrator Resolution Triage for Case:{" "}
                  <span className="font-mono text-blue-600">
                    {selectedComplaintId ? (selectedComplaintId.length > 12 ? `${selectedComplaintId.substring(0, 12)}...` : selectedComplaintId) : "None"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold">Change Status:</span>
                  <select
                    value={complaintStatus}
                    onChange={(e) => setComplaintStatus(e.target.value as any)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter detailed investigation outcome, caregiver counseling, and parent notification notes..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500">
                  Resolution updates sync live with PostgreSQL database and the Parent Portal.
                </div>
                <button
                  type="submit"
                  disabled={!selectedComplaintId}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save Resolution to Database
                </button>
              </div>

              {isResolvedMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{isResolvedMessage}</span>
                </div>
              )}
            </form>
          </div>
        </main>

        {/* Complaint Resolution Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmingResolve}
          onClose={() => setIsConfirmingResolve(false)}
          onConfirm={executeResolveComplaint}
          title="Confirm Complaint Resolution"
          message={`Are you sure you want to update this complaint status to "${complaintStatus.replace("_", " ").toUpperCase()}" with your resolution notes? This update will immediately sync with the database and Parent Portal.`}
          confirmLabel="Save Resolution"
          variant="success"
          isLoading={isActionLoading}
        />

        {/* Notice Broadcast Confirmation Modal */}
        <ConfirmationModal
          isOpen={isConfirmingNotice}
          onClose={() => setIsConfirmingNotice(false)}
          onConfirm={executePublishNotice}
          title="Publish Center Announcement"
          message={`Are you sure you want to broadcast "${noticeTitle}" to ${noticeAudience === "all" ? "all center portals" : noticeAudience}?`}
          confirmLabel="Publish Notice"
          variant="warning"
          isLoading={isActionLoading}
        />
      </div>
    </AuthGuard>
  );
}
