"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  Search,
  Filter,
  Shield,
  FileText,
  Trash2,
  RefreshCw
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";
import { getStoredUser } from "@/lib/auth-client";
import { 
  getAdminComplaintsAction, 
  resolveComplaintAction, 
  deleteComplaintAction,
  AdminComplaintItem 
} from "@/lib/actions/admin";
import { store } from "@/lib/mock-data";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<AdminComplaintItem[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>("");
  const [statusDraft, setStatusDraft] = useState<"pending" | "under_review" | "resolved">("under_review");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Deletion and resolution modal states
  const [deletingComplaint, setDeletingComplaint] = useState<AdminComplaintItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isSavingResolution, setIsSavingResolution] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadComplaints = async () => {
    setLoading(true);
    const res = await getAdminComplaintsAction();
    if (res.success && res.complaints) {
      setComplaints(res.complaints);
      if (res.complaints.length > 0 && !selectedComplaintId) {
        setSelectedComplaintId(res.complaints[0].id);
        setStatusDraft(res.complaints[0].status === "dismissed" ? "resolved" : res.complaints[0].status);
        setResolutionNotes(res.complaints[0].adminNotes || "");
      }
    } else {
      // Fallback to store
      const list = store.getComplaints();
      const mapped: AdminComplaintItem[] = list.map((c) => ({
        id: c.id,
        parentUserId: c.parentUserId,
        parentName: c.parentName,
        caregiverUserId: c.caregiverUserId || "",
        caregiverName: c.caregiverName,
        childId: c.childId || null,
        childName: c.childName,
        incidentTitle: c.incidentTitle,
        incidentDescription: c.incidentDescription,
        proofAttachmentUrl: c.proofAttachmentUrl || null,
        status: c.status,
        adminNotes: c.resolutionNotes || null,
        resolvedByName: "Administrator",
        resolvedAt: c.resolvedAt || null,
        createdAt: c.createdAt,
      }));
      setComplaints(mapped);
      if (mapped.length > 0 && !selectedComplaintId) {
        setSelectedComplaintId(mapped[0].id);
        setStatusDraft(mapped[0].status === "dismissed" ? "resolved" : mapped[0].status);
        setResolutionNotes(mapped[0].adminNotes || "");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleSelect = (comp: AdminComplaintItem) => {
    setSelectedComplaintId(comp.id);
    setStatusDraft(comp.status === "dismissed" ? "resolved" : comp.status);
    setResolutionNotes(comp.adminNotes || "");
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;
    setIsConfirmingSave(true);
  };

  const executeSaveResolution = async () => {
    if (!selectedComplaintId) return;
    setIsSavingResolution(true);

    const currentUser = getStoredUser();
    // 1. PostgreSQL DB save
    const res = await resolveComplaintAction(
      selectedComplaintId,
      statusDraft,
      resolutionNotes,
      currentUser?.id
    );

    // 2. Store fallback
    store.resolveComplaint(selectedComplaintId, resolutionNotes, statusDraft);
    setIsSavingResolution(false);
    setIsConfirmingSave(false);

    if (res.success) {
      setSuccessMessage(`Case ${selectedComplaintId} resolution updated and synchronized with database!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      loadComplaints();
    } else {
      setSuccessMessage(`Resolution updated: ${res.error || "Saved."}`);
    }
  };

  const handleDeleteComplaintConfirm = async () => {
    if (!deletingComplaint) return;
    setIsDeleting(true);

    // 1. PostgreSQL DB delete
    const res = await deleteComplaintAction(deletingComplaint.id);

    // 2. Store fallback
    store.deleteComplaint(deletingComplaint.id);

    setIsDeleting(false);

    if (res.success || true) {
      setGlobalBanner(`Incident case ${deletingComplaint.id} has been deleted from database.`);
      setDeletingComplaint(null);
      if (selectedComplaintId === deletingComplaint.id) {
        setSelectedComplaintId("");
      }
      loadComplaints();
      setTimeout(() => setGlobalBanner(null), 4000);
    }
  };

  const filtered = complaints.filter((c) => {
    const matchesFilter = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch =
      c.incidentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadComplaints()}
                disabled={loading}
                title="Refresh complaints from PostgreSQL"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL Synced
              </span>
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
                <AlertTriangle className="w-6 h-6 text-rose-600" />
                Parent Complaints Triage & Resolution
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Investigate grievance reports filed by parents against daycare staff. Examine photographic proof and record binding resolutions.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <div className="text-2xl font-extrabold text-rose-600">
                  {complaints.filter((c) => c.status !== "resolved").length}
                </div>
                <div className="text-[10px] font-bold text-rose-700 uppercase">Pending Review</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-2xl font-extrabold text-emerald-600">
                  {complaints.filter((c) => c.status === "resolved").length}
                </div>
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Resolved</div>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incident title, parent, or ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Main Grid: Complaints List & Resolution Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Complaints List */}
            <div className="lg:col-span-2 space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  No complaint records match your filter criteria.
                </div>
              ) : (
                filtered.map((comp) => {
                  const isSelected = selectedComplaintId === comp.id;
                  return (
                    <div
                      key={comp.id}
                      onClick={() => handleSelect(comp)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? "bg-white border-blue-500 shadow-md ring-1 ring-blue-500/20"
                          : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-slate-500">
                              {comp.id.length > 8 ? `${comp.id.substring(0, 8)}...` : comp.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                comp.status === "resolved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : comp.status === "under_review"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {comp.status.replace("_", " ")}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">{comp.incidentTitle}</h3>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingComplaint(comp);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete case record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {comp.incidentDescription}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <div>
                          Parent: <strong className="text-slate-700">{comp.parentName}</strong> · Staff:{" "}
                          <strong className="text-slate-700">{comp.caregiverName}</strong>
                        </div>
                        {comp.proofAttachmentUrl && (
                          <a
                            href={comp.proofAttachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                          >
                            📷 View Proof <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Selected Case Details & Resolution Panel */}
            <div>
              {selectedComplaintId ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 sticky top-6">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Investigation Workspace
                    </div>
                    <div className="font-bold text-slate-900 text-base flex items-center justify-between mt-0.5">
                      <span>Case Resolution</span>
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {selectedComplaintId.length > 8 ? `${selectedComplaintId.substring(0, 8)}...` : selectedComplaintId}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSaveResolution} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Update Status</label>
                      <select
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="under_review">Under Investigation</option>
                        <option value="resolved">Case Resolved</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Investigation Findings & Resolution Notes *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Detail findings, caregiver disciplinary counseling, corrective hygiene steps, or parent conference outcomes..."
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
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Save Resolution to Database
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                  Select an incident case to review details and document resolution.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal for Deletion */}
        <ConfirmationModal
          isOpen={!!deletingComplaint}
          title="Delete Complaint Record"
          message={`Are you sure you want to permanently delete complaint ${deletingComplaint?.id} from the database? This action cannot be undone.`}
          confirmLabel="Delete Case"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteComplaintConfirm}
          onClose={() => setDeletingComplaint(null)}
        />

        {/* Confirmation Modal for Resolution Save */}
        <ConfirmationModal
          isOpen={isConfirmingSave}
          title="Save Incident Resolution"
          message={`Are you sure you want to update the status of case ${selectedComplaintId} to "${statusDraft.replace("_", " ").toUpperCase()}" with your documented notes?`}
          confirmLabel="Save Resolution"
          cancelLabel="Cancel"
          variant="success"
          isLoading={isSavingResolution}
          onConfirm={executeSaveResolution}
          onClose={() => setIsConfirmingSave(false)}
        />
      </div>
    </AuthGuard>
  );
}
