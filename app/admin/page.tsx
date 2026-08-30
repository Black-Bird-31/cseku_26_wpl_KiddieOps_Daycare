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
  Send
} from "lucide-react";
import { store, ChildRecord, UserRecord, ClassroomRecord, ComplaintRecord, NoticeRecord } from "@/lib/mock-data";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "complaints" | "notices">("overview");

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

  const loadData = () => {
    setUsers(store.getUsers());
    setChildren(store.getChildren());
    setClassrooms(store.getClassrooms());

    const loadedComplaints = store.getComplaints();
    setComplaints(loadedComplaints);
    if (loadedComplaints.length > 0) {
      const active = loadedComplaints[0];
      setSelectedComplaintId(active.id);
      setComplaintStatus(active.status);
      setResolutionNotes(active.resolutionNotes || "");
    }

    setNotices(store.getNotices());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectComplaint = (comp: ComplaintRecord) => {
    setSelectedComplaintId(comp.id);
    setComplaintStatus(comp.status);
    setResolutionNotes(comp.resolutionNotes || "");
  };

  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;

    const updated = store.resolveComplaint(selectedComplaintId, resolutionNotes, complaintStatus);
    if (updated) {
      setComplaints(store.getComplaints());
      setIsResolvedMessage(`Complaint ${updated.id} successfully updated and resolution logged.`);
      setTimeout(() => setIsResolvedMessage(null), 4000);
    }
  };

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    store.addNotice({
      title: noticeTitle,
      content: noticeContent,
      priority: noticePriority,
      targetAudience: noticeAudience,
      authorName: "Tanzina Rahman (Principal)",
    });

    setNotices(store.getNotices());
    setNoticeTitle("");
    setNoticeContent("");
    setNoticeSuccess("Center Notice published and broadcasted to all active portals!");
    setTimeout(() => setNoticeSuccess(null), 4000);
  };

  const pendingComplaintsCount = complaints.filter((c) => c.status !== "resolved").length;

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Persistent Left Sidebar Navigation (Desktop - Matching Wireframe WF-04) */}
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "overview"
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
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
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
                <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
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
              <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900">
                Administrator Dashboard
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Overview of enrollment capacity, staff assignments, parent incident triage, and broadcast announcements.
              </p>
            </div>

            <div className="flex items-center gap-2">
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

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Children</span>
                <Baby className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{children.length}</div>
              <div className="text-[11px] text-blue-600 font-semibold">Active Enrollment</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Staff & Caregivers</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {users.filter((u) => u.role === "caregiver").length || 1}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">Lead Teachers On Duty</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Center Notices</span>
                <BellRing className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{notices.length}</div>
              <div className="text-[11px] text-amber-600 font-semibold">Broadcasted to Portals</div>
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

          {/* Section 1: Classroom Enrollment Capacity & Live Center Notices Publisher */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classroom Enrollment Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  Classroom Enrollment Capacity
                </h2>
                <span className="text-xs text-slate-500">{classrooms.length} Groups</span>
              </div>

              <div className="space-y-4 text-xs">
                {classrooms.map((cls) => {
                  const count = children.filter((c) => c.classroomId === cls.id).length;
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
                          className={`h-full rounded-full ${pct > 80 ? "bg-amber-500" : "bg-blue-600"
                            }`}
                          style={{ width: `${Math.max(pct, 15)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center Announcement Publisher (WF-05 / REQ39) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-500" />
                  Publish Center Notice
                </h2>
                <span className="text-[11px] text-slate-500 font-semibold">Broadcast</span>
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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                    <select
                      value={noticePriority}
                      onChange={(e) => setNoticePriority(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-600"
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
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-600"
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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-600 resize-none"
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

          {/* Section 2: Parent Complaints Investigation & Resolution Panel (REQ39 / WF-04) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-child text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Parent Complaints Investigation & Resolution
                </h2>
                <p className="text-xs text-slate-500">
                  Review incident reports filed by parents, examine attached proof images, and submit official resolution notes.
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
                        No parent complaints on record.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((comp) => (
                      <tr
                        key={comp.id}
                        onClick={() => handleSelectComplaint(comp)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedComplaintId === comp.id ? "bg-blue-50/60" : ""
                          }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{comp.id}</td>
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
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[11px] font-semibold text-slate-700"
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
                  Administrator Resolution Triage for Case: <span className="font-mono text-blue-600">{selectedComplaintId || "None"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-semibold">Change Status:</span>
                  <select
                    value={complaintStatus}
                    onChange={(e) => setComplaintStatus(e.target.value as any)}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500">
                  Resolution updates sync live with the Parent Portal and center audit logs.
                </div>
                <button
                  type="submit"
                  disabled={!selectedComplaintId}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save Resolution & Notify Parent
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
      </div>
    </AuthGuard>
  );
}
