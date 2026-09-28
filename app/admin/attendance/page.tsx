"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Clock, 
  Calendar, 
  Check, 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Shield,
  X
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ClockTimePicker from "@/components/ui/ClockTimePicker";
import { getStoredUser } from "@/lib/auth-client";
import { 
  getCaregiverDashboardDataAction, 
  saveAttendanceBatchAction, 
  CaregiverDashboardData, 
} from "@/lib/actions/caregiver";
import {
  getLeaveRequestsAction,
  reviewLeaveRequestAction,
  LeaveRequestItem,
} from "@/lib/actions/parent";

export default function AdminAttendancePage() {
  const [data, setData] = useState<CaregiverDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"leaves" | "sheet">("leaves");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState<{ [id: string]: string }>({});
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("all");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Attendance Sheet state: { [childId]: { status, inTime, outTime, notes } }
  const [attendanceDraft, setAttendanceDraft] = useState<{
    [childId: string]: {
      status: "present" | "late" | "absent" | "excused";
      inTime: string;
      outTime: string;
      notes?: string;
    };
  }>({});

  const loadData = useCallback(async (classroomId?: string) => {
    setLoading(true);
    const currentUser = getStoredUser();
    const effectiveRoomId = classroomId !== undefined ? classroomId : (selectedClassroomId || "all");
    const res = await getCaregiverDashboardDataAction(currentUser?.id, effectiveRoomId);

    if (res.success) {
      setData(res);
      if (effectiveRoomId) {
        setSelectedClassroomId(effectiveRoomId);
      }

      // Initialize draft from database records
      const initialDraft: typeof attendanceDraft = {};
      res.children.forEach((c) => {
        initialDraft[c.id] = {
          status: c.attendance?.status || "present",
          inTime: c.attendance?.inTime || "08:30",
          outTime: c.attendance?.outTime || "",
          notes: c.attendance?.notes || "",
        };
      });
      setAttendanceDraft(initialDraft);
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to load classroom roster." });
    }

    // Load leave requests across all classrooms or specific classroom
    try {
      const leavesRes = await getLeaveRequestsAction({ classroomId: effectiveRoomId });
      if (leavesRes.success) {
        setLeaveRequests(leavesRes.requests);
      }
    } catch {}

    setLoading(false);
  }, [selectedClassroomId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClassroomChange = (id: string) => {
    setSelectedClassroomId(id);
    loadData(id);
  };

  const handleReviewLeave = async (attendanceId: string, action: "approve" | "reject") => {
    setReviewingId(attendanceId);
    const currentUser = getStoredUser();
    const notes = reviewNotesInput[attendanceId] || "";

    const res = await reviewLeaveRequestAction({
      attendanceId,
      action,
      reviewerUserId: currentUser?.id || "",
      reviewerRole: "administrator",
      reviewerName: currentUser?.name || "Daycare Administrator",
      reviewNotes: notes,
    });

    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: `Leave request ${action === "approve" ? "approved (marked Excused)" : "rejected"} by Administrator! Live status updated for Parent.`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadData(selectedClassroomId);
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to process leave decision." });
    }
    setReviewingId(null);
  };

  const handleMarkAllPresent = () => {
    if (!data) return;
    const nowTime = new Date().toTimeString().substring(0, 5);
    const updated: typeof attendanceDraft = { ...attendanceDraft };
    data.children.forEach((c) => {
      updated[c.id] = {
        status: "present",
        inTime: updated[c.id]?.inTime || nowTime || "08:30",
        outTime: updated[c.id]?.outTime || "",
        notes: updated[c.id]?.notes || "",
      };
    });
    setAttendanceDraft(updated);
    setFeedbackMessage({
      type: "success",
      text: "All children marked Present. Click 'Save Attendance Sheet' to commit changes.",
    });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleSaveAttendance = async () => {
    if (!data || data.children.length === 0) return;
    setIsSaving(true);

    const currentUser = getStoredUser();
    const batch = Object.keys(attendanceDraft).map((childId) => ({
      childId,
      date: attendanceDate,
      status: attendanceDraft[childId].status,
      inTime: attendanceDraft[childId].inTime,
      outTime: attendanceDraft[childId].outTime,
      notes: attendanceDraft[childId].notes,
    }));

    const res = await saveAttendanceBatchAction(batch, currentUser?.id);
    setIsSaving(false);

    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: `Attendance records for ${res.count} children successfully saved to database!`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadData(selectedClassroomId);
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to save attendance records." });
    }
  };

  const filteredChildren = (data?.children || []).filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.classroomName && c.classroomName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    total: data?.children.length || 0,
    present: Object.values(attendanceDraft).filter((a) => a.status === "present").length,
    late: Object.values(attendanceDraft).filter((a) => a.status === "late").length,
    absent: Object.values(attendanceDraft).filter((a) => a.status === "absent").length,
    excused: Object.values(attendanceDraft).filter((a) => a.status === "excused").length,
  };

  const pendingLeaves = leaveRequests.filter((r) => r.status === "pending");

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Administrator Attendance & Leave Oversight</span>
            </div>
          </div>

          {/* Header Card with Classroom & Date Pickers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-child text-2xl font-extrabold text-slate-900">
                    Attendance & Leave Request Management
                  </h1>
                  <p className="text-xs text-slate-500">
                    Review and approve parent leave requests, inspect daily classroom attendance, and manage excused absences.
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Classroom
                </label>
                <select
                  value={selectedClassroomId || "all"}
                  onChange={(e) => handleClassroomChange(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white shadow-2xs focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Classrooms (Center-Wide)</option>
                  {data?.classrooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.ageRange || "All ages"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white shadow-2xs focus:outline-hidden focus:border-blue-500 cursor-pointer"
                />
              </div>

              <div className="pt-4 sm:pt-4">
                <button
                  onClick={() => loadData(selectedClassroomId)}
                  disabled={loading}
                  title="Refresh Roster & Requests"
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedbackMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs transition-all ${
                feedbackMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedbackMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
              <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveView("leaves")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === "leaves"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Parent Leave Requests & Approvals
              {pendingLeaves.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950">
                  {pendingLeaves.length} Pending
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView("sheet")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === "sheet"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              Classroom Attendance Sheet ({data?.children.length || 0})
            </button>
          </div>

          {activeView === "leaves" ? (
            /* ============================================================ */
            /* Leave Requests Review Queue (Admin Approval) */
            /* ============================================================ */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-child text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Parent Absence & Excused Leave Requests
                  </h2>
                  <p className="text-xs text-slate-500">
                    Administrators have direct authority to approve or reject leave requests. Decisions update child attendance records in real time.
                  </p>
                </div>

                <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Total Requests: {leaveRequests.length}
                </div>
              </div>

              {leaveRequests.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                  <h4 className="font-child text-base font-bold text-slate-700">No Leave Requests Found</h4>
                  <p>When parents submit leave or absence requests, they will appear here for review and approval.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {leaveRequests.map((req) => (
                    <div key={req.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-child text-base font-extrabold text-slate-900">
                            {req.childName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {req.classroomName}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            req.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : req.status === "rejected"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                          }`}>
                            {req.status === "approved" ? "✓ Approved (Excused)" : req.status === "rejected" ? "✕ Rejected" : "⏳ Pending Approval"}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700">
                          <strong className="text-slate-900">Requested Date:</strong> {req.date} &nbsp;•&nbsp;
                          <strong className="text-slate-900">Parent Reason:</strong> &ldquo;{req.reason}&rdquo;
                        </div>

                        {req.reviewedByName && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            Decision by: <strong>{req.reviewedByName}</strong> ({req.reviewedByRole})
                            {req.reviewerNotes ? ` — Notes: ${req.reviewerNotes}` : ""}
                          </div>
                        )}
                      </div>

                      {/* Review Buttons */}
                      {req.status === "pending" ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 md:pt-0">
                          <input
                            type="text"
                            placeholder="Admin decision note..."
                            value={reviewNotesInput[req.id] || ""}
                            onChange={(e) => setReviewNotesInput({ ...reviewNotesInput, [req.id]: e.target.value })}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 min-w-[160px]"
                          />
                          <button
                            type="button"
                            disabled={reviewingId === req.id}
                            onClick={() => handleReviewLeave(req.id, "approve")}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve (Excused)
                          </button>
                          <button
                            type="button"
                            disabled={reviewingId === req.id}
                            onClick={() => handleReviewLeave(req.id, "reject")}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={reviewingId === req.id}
                            onClick={() => handleReviewLeave(req.id, req.status === "approved" ? "reject" : "approve")}
                            className="px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Change to {req.status === "approved" ? "Rejected" : "Approved"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ============================================================ */
            /* Daily Attendance Sheet View */
            /* ============================================================ */
            <>
              {/* Status Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Present</div>
                  <div className="text-2xl font-extrabold text-emerald-800 mt-1">{stats.present}</div>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Late</div>
                  <div className="text-2xl font-extrabold text-amber-800 mt-1">{stats.late}</div>
                </div>

                <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Absent</div>
                  <div className="text-2xl font-extrabold text-rose-800 mt-1">{stats.absent}</div>
                </div>

                <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Excused</div>
                  <div className="text-2xl font-extrabold text-blue-800 mt-1">{stats.excused}</div>
                </div>
              </div>

              {/* Table Container Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative min-w-[260px] max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search child by name or classroom..."
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Mark All Present
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Check className="w-4 h-4" />
                      {isSaving ? "Saving..." : "Save Attendance Sheet"}
                    </button>
                  </div>
                </div>

                {filteredChildren.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                    No children found for the selected classroom.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-y border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Child & Classroom</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Check-In</th>
                          <th className="px-4 py-3">Check-Out</th>
                          <th className="px-4 py-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredChildren.map((child) => {
                          const att = attendanceDraft[child.id] || {
                            status: "present",
                            inTime: "08:30",
                            outTime: "",
                            notes: "",
                          };

                          return (
                            <tr key={child.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-slate-900">
                                <div>{child.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {child.classroomName || "Classroom"}
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                <select
                                  value={att.status}
                                  onChange={(e) =>
                                    setAttendanceDraft({
                                      ...attendanceDraft,
                                      [child.id]: {
                                        ...att,
                                        status: e.target.value as any,
                                      },
                                    })
                                  }
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs focus:outline-hidden cursor-pointer ${
                                    att.status === "present"
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                      : att.status === "late"
                                      ? "bg-amber-50 border-amber-300 text-amber-800"
                                      : att.status === "absent"
                                      ? "bg-rose-50 border-rose-300 text-rose-800"
                                      : "bg-blue-50 border-blue-300 text-blue-800"
                                  }`}
                                >
                                  <option value="present">Present</option>
                                  <option value="late">Late</option>
                                  <option value="absent">Absent</option>
                                  <option value="excused">Excused</option>
                                </select>
                              </td>

                              <td className="px-4 py-3.5">
                                <div className="w-36">
                                  <ClockTimePicker
                                    value={att.inTime}
                                    onChange={(val) =>
                                      setAttendanceDraft({
                                        ...attendanceDraft,
                                        [child.id]: { ...att, inTime: val },
                                      })
                                    }
                                    format="24h"
                                    placeholder="08:30"
                                  />
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                <div className="w-36">
                                  <ClockTimePicker
                                    value={att.outTime}
                                    onChange={(val) =>
                                      setAttendanceDraft({
                                        ...attendanceDraft,
                                        [child.id]: { ...att, outTime: val },
                                      })
                                    }
                                    format="24h"
                                    placeholder="--:--"
                                  />
                                </div>
                              </td>

                              <td className="px-4 py-3.5">
                                <input
                                  type="text"
                                  value={att.notes || ""}
                                  placeholder="e.g. Authorized by admin"
                                  onChange={(e) =>
                                    setAttendanceDraft({
                                      ...attendanceDraft,
                                      [child.id]: { ...att, notes: e.target.value },
                                    })
                                  }
                                  className="w-full min-w-[180px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
