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
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert,
  ChevronDown,
  Sparkles,
  School,
  X
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ClockTimePicker from "@/components/ui/ClockTimePicker";
import { getStoredUser } from "@/lib/auth-client";
import { 
  getCaregiverDashboardDataAction, 
  saveAttendanceBatchAction, 
  CaregiverDashboardData, 
  CaregiverChildItem,
} from "@/lib/actions/caregiver";
import {
  getLeaveRequestsAction,
  reviewLeaveRequestAction,
  LeaveRequestItem,
} from "@/lib/actions/parent";

export default function CaregiverAttendancePage() {
  const [data, setData] = useState<CaregiverDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"sheet" | "leaves">("sheet");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState<{ [id: string]: string }>({});
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
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
      } else if (res.activeClassroom?.id) {
        setSelectedClassroomId(res.activeClassroom.id);
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

    // Load leave requests
    try {
      const leavesRes = await getLeaveRequestsAction({ classroomId: effectiveRoomId });
      if (leavesRes.success) {
        setLeaveRequests(leavesRes.requests);
      }
    } catch {}

    setLoading(false);
  }, [selectedClassroomId]);

  const handleReviewLeave = async (attendanceId: string, action: "approve" | "reject") => {
    setReviewingId(attendanceId);
    const currentUser = getStoredUser();
    const notes = reviewNotesInput[attendanceId] || "";

    const res = await reviewLeaveRequestAction({
      attendanceId,
      action,
      reviewerUserId: currentUser?.id || "",
      reviewerRole: (currentUser?.role as any) || "caregiver",
      reviewerName: currentUser?.name || "Caregiver Staff",
      reviewNotes: notes,
    });

    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: `Leave request ${action === "approve" ? "approved (marked Excused)" : "rejected"} successfully!`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadData(selectedClassroomId);
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to update leave request." });
    }
    setReviewingId(null);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle classroom switch
  const handleClassroomChange = (id: string) => {
    setSelectedClassroomId(id);
    loadData(id);
  };

  // Quick mark all present
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
      text: "All children marked Present. Click 'Save Sheet' to synchronize with database.",
    });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Save batch attendance to PostgreSQL
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
      loadData();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to save attendance records." });
    }
  };

  // Calculate live draft statistics
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

  return (
    <AuthGuard allowedRoles={["caregiver", "administrator"]}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/caregiver"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Caregiver Portal</span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Dedicated Attendance Logging Page</span>
            </div>
          </div>

          {/* Header Card with Classroom & Date Pickers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-child text-xl sm:text-2xl font-extrabold text-slate-900">
                    Daily Classroom Attendance
                  </h1>
                  <p className="text-xs text-slate-500">
                    Log and update check-in, check-out, and presence for every child. Records synchronize directly with parents' portal.
                  </p>
                </div>
              </div>
            </div>

            {/* Controls: Classroom & Date Select */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Classroom
                </label>
                <select
                  value={selectedClassroomId || "all"}
                  onChange={(e) => handleClassroomChange(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white shadow-2xs focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Classrooms (All Ages)</option>
                  {data?.classrooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.ageRange || "All ages"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white shadow-2xs focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                />
              </div>

              <div className="self-end sm:self-auto sm:pt-4">
                <button
                  onClick={() => loadData()}
                  disabled={loading}
                  title="Refresh Roster"
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
              <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Tabs between Attendance Sheet and Leave Requests */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveView("sheet")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeView === "sheet"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              Daily Attendance Sheet ({data?.children.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveView("leaves")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeView === "leaves"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Parent Leave Requests & Approvals
              {leaveRequests.filter((r) => r.status === "pending").length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950">
                  {leaveRequests.filter((r) => r.status === "pending").length} Pending
                </span>
              )}
            </button>
          </div>

          {activeView === "leaves" ? (
            /* ============================================================ */
            /* Leave Requests Review Queue (Caregiver / Admin Approval) */
            /* ============================================================ */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-child text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Parent Leave Requests & Excused Absences
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review and approve absence requests submitted by parents. Decisions update child attendance records in real time.
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
                  <p>When parents submit absence requests from their portal, they will appear here for review.</p>
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
                            {req.status === "approved" ? "✓ Approved (Excused)" : req.status === "rejected" ? "✕ Rejected" : "⏳ Pending Review"}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700">
                          <strong className="text-slate-900">Requested Date:</strong> {req.date} &nbsp;•&nbsp;
                          <strong className="text-slate-900">Reason:</strong> &ldquo;{req.reason}&rdquo;
                        </div>

                        {req.reviewedByName && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            Reviewed by: <strong>{req.reviewedByName}</strong> ({req.reviewedByRole})
                            {req.reviewerNotes ? ` — Notes: ${req.reviewerNotes}` : ""}
                          </div>
                        )}
                      </div>

                      {/* Action buttons if pending */}
                      {req.status === "pending" ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 md:pt-0">
                          <input
                            type="text"
                            placeholder="Optional review note..."
                            value={reviewNotesInput[req.id] || ""}
                            onChange={(e) => setReviewNotesInput({ ...reviewNotesInput, [req.id]: e.target.value })}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 min-w-[160px]"
                          />
                          <button
                            type="button"
                            disabled={reviewingId === req.id}
                            onClick={() => handleReviewLeave(req.id, "approve")}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Leave
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
          /* Attendance Sheet View */
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
                  placeholder="Search child by name..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Saving Sheet..." : "Save Attendance Sheet"}</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                <p>Loading attendance roster from database...</p>
              </div>
            ) : filteredChildren.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No enrolled children found for this classroom.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-y border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Child Details</th>
                      <th className="px-4 py-3.5">Allergy Status</th>
                      <th className="px-4 py-3.5">Attendance Status</th>
                      <th className="px-4 py-3.5">Check-In Time</th>
                      <th className="px-4 py-3.5">Check-Out Time</th>
                      <th className="px-4 py-3.5">Caregiver Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredChildren.map((child) => {
                      const att = attendanceDraft[child.id] || {
                        status: "present",
                        inTime: "08:30",
                        outTime: "",
                        notes: "",
                      };

                      return (
                        <tr key={child.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5 flex items-center gap-3">
                            <img
                              src={child.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80"}
                              alt={child.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
                            />
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">{child.name}</span>
                              <span className="text-[10px] text-slate-400">DOB: {child.dateOfBirth}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            {child.allergyFlag ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <ShieldAlert className="w-3 h-3 text-rose-600" /> Allergy
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Normal</span>
                            )}
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
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
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
                              placeholder="e.g. Arrived happily with mother"
                              onChange={(e) =>
                                setAttendanceDraft({
                                  ...attendanceDraft,
                                  [child.id]: { ...att, notes: e.target.value },
                                })
                              }
                              className="w-full min-w-[180px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
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
