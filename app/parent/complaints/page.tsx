"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  ArrowLeft, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ExternalLink, 
  X, 
  Send,
  AlertCircle,
  Check,
  FileText,
  User,
  Calendar,
  Trash2,
  Edit2,
  RefreshCw,
  ShieldCheck,
  Camera,
  Filter
} from "lucide-react";
import { store, ChildRecord, UserRecord, initialUsers } from "@/lib/mock-data";
import { getStoredUser } from "@/lib/auth-client";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import ClockTimePicker from "@/components/ui/ClockTimePicker";
import {
  getParentComplaintsAction,
  createParentComplaintAction,
  updateParentComplaintAction,
  deleteParentComplaintAction,
  getChildrenForParentAction,
  ParentComplaintItem,
} from "@/lib/actions/parent";

export default function ParentComplaintsPage() {
  const [parentUser, setParentUser] = useState<UserRecord>(initialUsers[2]);
  const [parentChildren, setParentChildren] = useState<ChildRecord[]>([]);
  const [complaints, setComplaints] = useState<ParentComplaintItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caregiverName, setCaregiverName] = useState("Nusrat Jahan");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [proofAttachmentUrl, setProofAttachmentUrl] = useState("");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentTime, setIncidentTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State (CRUD: Update)
  const [editingComplaint, setEditingComplaint] = useState<ParentComplaintItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCaregiverName, setEditCaregiverName] = useState("");
  const [editProofUrl, setEditProofUrl] = useState("");
  const [editIncidentTime, setEditIncidentTime] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Deletion modal state (CRUD: Delete)
  const [deletingComplaint, setDeletingComplaint] = useState<ParentComplaintItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = getStoredUser();
    let current = initialUsers[2];
    if (user && user.role === "parent") {
      current = user as any;
    }
    setParentUser(current);

    // 1. Fetch children
    try {
      const childRes = await getChildrenForParentAction(current.id);
      if (childRes.success && childRes.children.length > 0) {
        setParentChildren(childRes.children);
        setSelectedChildId(childRes.children[0].id);
      } else {
        const localKids = store.getChildrenForGuardian(current.id);
        setParentChildren(localKids);
        if (localKids.length > 0) setSelectedChildId(localKids[0].id);
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch complaints
    try {
      const compRes = await getParentComplaintsAction(current.id);
      if (compRes.success) {
        setComplaints(compRes.complaints);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filing new complaint (CRUD: Create)
  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!incidentTitle.trim() || !incidentDescription.trim()) {
      setFormError("Please fill out both the incident summary and detailed description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createParentComplaintAction({
        parentUserId: parentUser.id,
        caregiverName,
        childId: selectedChildId || undefined,
        title: incidentTitle.trim(),
        description: incidentDescription.trim(),
        proofAttachmentUrl: proofAttachmentUrl || undefined,
      });

      if (res.success) {
        setFormSuccess("Incident report filed successfully! Daycare administration has been alerted.");
        setIncidentTitle("");
        setIncidentDescription("");
        setProofAttachmentUrl("");
        await loadData();
        setTimeout(() => {
          setFormSuccess(null);
          setIsModalOpen(false);
        }, 1200);
      } else {
        setFormError(res.error || "Failed to submit complaint.");
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    }
    setIsSubmitting(false);
  };

  // Open Edit Modal (CRUD: Update)
  const handleOpenEdit = (comp: ParentComplaintItem) => {
    setEditingComplaint(comp);
    setEditTitle(comp.title);
    setEditDescription(comp.description);
    setEditCaregiverName(comp.caregiverName);
    setEditProofUrl(comp.proofAttachmentUrl || "");
    const now = new Date();
    const defaultTime = comp.incidentDate
      ? new Date(comp.incidentDate).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit" })
      : `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setEditIncidentTime(defaultTime);
    setEditError(null);
  };

  // Submit Edit (CRUD: Update)
  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;
    setEditError(null);

    if (!editTitle.trim() || !editDescription.trim()) {
      setEditError("Summary and description cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await updateParentComplaintAction({
        complaintId: editingComplaint.id,
        parentUserId: parentUser.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        caregiverName: editCaregiverName,
        proofAttachmentUrl: editProofUrl || undefined,
      });

      if (res.success) {
        setGlobalBanner("Incident report updated successfully.");
        setEditingComplaint(null);
        await loadData();
        setTimeout(() => setGlobalBanner(null), 4000);
      } else {
        setEditError(res.error || "Failed to update complaint.");
      }
    } catch (err: any) {
      setEditError(err.message || "Could not update complaint.");
    }
    setIsSavingEdit(false);
  };

  // Confirm Delete (CRUD: Delete)
  const handleDeleteComplaintConfirm = async () => {
    if (!deletingComplaint) return;
    setIsDeleting(true);

    try {
      await deleteParentComplaintAction(deletingComplaint.id, parentUser.id);
      setGlobalBanner(`Incident report "${deletingComplaint.title}" has been withdrawn.`);
      setDeletingComplaint(null);
      await loadData();
      setTimeout(() => setGlobalBanner(null), 4000);
    } catch (e) {
      console.error(e);
    }
    setIsDeleting(false);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter === "pending") return c.status === "pending" || c.status === "under_review";
    if (statusFilter === "resolved") return c.status === "resolved" || c.status === "dismissed";
    return true;
  });

  const pendingCount = complaints.filter((c) => c.status === "pending" || c.status === "under_review").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  return (
    <AuthGuard allowedRoles={["parent"]}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Top Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/parent"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Child Dashboard
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                title="Refresh Complaints"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <Link
                href="/parent/notices"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
              >
                View Center Notices →
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

          {/* Header Banner with Confidentiality Guarantee */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h1 className="font-child text-2xl font-bold text-slate-900">
                  Incident Reporting & Safety Concerns
                </h1>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Confidential incident reporting to center administration (REQ38, REQ39). 
                Reports are delivered securely to the principal; staff cannot alter filed evidence.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
              >
                <PlusCircle className="w-4 h-4" /> File Incident Report
              </button>
            </div>
          </div>

          {/* Confidentiality Pill */}
          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              <strong>Confidentiality Guarantee:</strong> Incident reports and proof attachments are routed strictly to center administrators. Caregivers do not have access to private parent complaint notes.
            </span>
          </div>

          {/* Summary KPIs & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setStatusFilter("all")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  statusFilter === "all" ? "bg-white border-blue-600 shadow-xs" : "bg-slate-100/70 border-slate-200 text-slate-600"
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-500">Total Filed</div>
                <div className="text-lg font-extrabold text-slate-900">{complaints.length}</div>
              </button>

              <button
                onClick={() => setStatusFilter("pending")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  statusFilter === "pending" ? "bg-white border-amber-600 shadow-xs" : "bg-slate-100/70 border-slate-200 text-slate-600"
                }`}
              >
                <div className="text-[11px] font-semibold text-amber-700">Under Review</div>
                <div className="text-lg font-extrabold text-amber-800">{pendingCount}</div>
              </button>

              <button
                onClick={() => setStatusFilter("resolved")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  statusFilter === "resolved" ? "bg-white border-emerald-600 shadow-xs" : "bg-slate-100/70 border-slate-200 text-slate-600"
                }`}
              >
                <div className="text-[11px] font-semibold text-emerald-700">Resolved</div>
                <div className="text-lg font-extrabold text-emerald-800">{resolvedCount}</div>
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold text-slate-600">
              <Filter className="w-3.5 h-3.5" />
              <span>Showing: <strong>{statusFilter.toUpperCase()}</strong> ({filteredComplaints.length})</span>
            </div>
          </div>

          {/* Complaints Stream */}
          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="font-child text-lg font-bold text-slate-800">
                  {statusFilter === "all" ? "No Incident Reports on File" : `No ${statusFilter} reports found`}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  If you have concerns regarding hygiene, feeding protocols, supervision, or staff conduct, feel free to file a confidential report anytime.
                </p>
              </div>
            ) : (
              filteredComplaints.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">#{comp.id.substring(0, 8)}</span>
                        <h3 className="font-child text-base font-bold text-slate-900">{comp.title}</h3>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Filed on: {new Date(comp.createdAt).toLocaleDateString()} at{" "}
                        {new Date(comp.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1 ${
                          comp.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : comp.status === "under_review"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : comp.status === "dismissed"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {comp.status === "resolved" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        {comp.status.replace("_", " ")}
                      </span>

                      {/* Edit button (CRUD: Update - enabled for pending) */}
                      {comp.status === "pending" && (
                        <button
                          onClick={() => handleOpenEdit(comp)}
                          title="Edit incident report"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete button (CRUD: Delete - enabled for pending) */}
                      {comp.status === "pending" && (
                        <button
                          onClick={() => setDeletingComplaint(comp)}
                          title="Withdraw incident report"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {comp.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div>Target Caregiver: <strong className="text-slate-800">{comp.caregiverName}</strong></div>
                    {comp.childName && <div>Child: <strong className="text-slate-800">{comp.childName}</strong></div>}
                    {comp.proofAttachmentUrl && (
                      <a
                        href={comp.proofAttachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                      >
                        <Camera className="w-3.5 h-3.5" /> View Proof Evidence <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Official Admin Resolution Notes Banner */}
                  {comp.adminNotes && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5 animate-in fade-in">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Administrator Formal Resolution & Follow-Up Notes:
                      </div>
                      <p className="text-emerald-800 leading-relaxed font-medium">
                        {comp.adminNotes}
                      </p>
                      {comp.resolvedAt && (
                        <div className="text-[10px] text-emerald-600 font-mono pt-1">
                          Resolved on: {new Date(comp.resolvedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ============================================================ */}
          {/* MODAL 1: Create Incident Report (CRUD - Create) */}
          {/* ============================================================ */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in max-h-[90vh] modal-scrollbar">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <h2 className="font-child text-xl font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    File Incident / Concern Report
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your report is delivered directly to the center principal with formal audit logging.
                  </p>
                </div>

                <form onSubmit={handleFileComplaint} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Relevant Caregiver *</label>
                      <select
                        value={caregiverName}
                        onChange={(e) => setCaregiverName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold"
                      >
                        <option value="Nusrat Jahan">Nusrat Jahan (Lead Teacher)</option>
                        <option value="Riya Chowdhury">Riya Chowdhury (Caregiver)</option>
                        <option value="Tanzina Rahman (Principal)">Tanzina Rahman (Principal)</option>
                        <option value="General Administration">General Administration</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Associated Child</label>
                      <select
                        value={selectedChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold"
                      >
                        {parentChildren.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Incident Date & Time with Clock Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Incident Date *</label>
                      <input
                        type="date"
                        required
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Incident Time *</label>
                      <ClockTimePicker
                        value={incidentTime || "12:00"}
                        onChange={(val) => setIncidentTime(val)}
                        format="24h"
                        placeholder="12:00"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Incident Subject / Summary *</label>
                    <input
                      type="text"
                      required
                      value={incidentTitle}
                      onChange={(e) => setIncidentTitle(e.target.value)}
                      placeholder="e.g., Nap supervision delay or allergy cross-contact"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Detailed Description *</label>
                    <textarea
                      rows={3}
                      required
                      value={incidentDescription}
                      onChange={(e) => setIncidentDescription(e.target.value)}
                      placeholder="Provide specific details, time of day, and what you observed..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                    />
                  </div>

                  {/* Cloudinary Proof Uploader */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Proof / Supporting Photo (Optional)</label>
                    <CloudinaryUploader
                      folder="kiddieops/complaints"
                      entityType="complaint_proof"
                      onUploadSuccess={(res) => setProofAttachmentUrl(res.secureUrl)}
                    />
                    {proofAttachmentUrl && (
                      <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Evidence photo attached!
                      </div>
                    )}
                  </div>

                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? "Submitting..." : "Submit Incident Report"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODAL 2: Edit Incident Report (CRUD - Update) */}
          {/* ============================================================ */}
          {editingComplaint && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in max-h-[90vh] modal-scrollbar">
                <button
                  onClick={() => setEditingComplaint(null)}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <h2 className="font-child text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-blue-600" />
                    Edit Incident Report
                  </h2>
                  <p className="text-xs text-slate-500">
                    You can update details while this report is still pending investigation.
                  </p>
                </div>

                <form onSubmit={handleUpdateComplaint} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Incident Subject / Summary *</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Detailed Description *</label>
                    <textarea
                      rows={3}
                      required
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Incident Time</label>
                    <ClockTimePicker
                      value={editIncidentTime || "12:00"}
                      onChange={(val) => setEditIncidentTime(val)}
                      format="24h"
                      placeholder="12:00"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Update Proof Photo (Optional)</label>
                    <CloudinaryUploader
                      folder="kiddieops/complaints"
                      entityType="complaint_proof"
                      onUploadSuccess={(res) => setEditProofUrl(res.secureUrl)}
                    />
                    {editProofUrl && (
                      <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Updated proof photo attached!
                      </div>
                    )}
                  </div>

                  {editError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingComplaint(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isSavingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal (CRUD: Delete) */}
          <ConfirmationModal
            isOpen={!!deletingComplaint}
            onClose={() => setDeletingComplaint(null)}
            onConfirm={handleDeleteComplaintConfirm}
            title="Withdraw Incident Report"
            message={`Are you sure you want to withdraw incident report "${deletingComplaint?.title}"? This cannot be undone.`}
            confirmLabel="Withdraw Report"
            variant="danger"
            isLoading={isDeleting}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
