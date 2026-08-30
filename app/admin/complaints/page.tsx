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
  Trash2
} from "lucide-react";
import { store, ComplaintRecord } from "@/lib/mock-data";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>("");
  const [statusDraft, setStatusDraft] = useState<"pending" | "under_review" | "resolved">("under_review");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Deletion modal state
  const [deletingComplaint, setDeletingComplaint] = useState<ComplaintRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadComplaints = () => {
    const list = store.getComplaints();
    setComplaints(list);
    if (list.length > 0 && !selectedComplaintId) {
      setSelectedComplaintId(list[0].id);
      setStatusDraft(list[0].status);
      setResolutionNotes(list[0].resolutionNotes || "");
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleSelect = (comp: ComplaintRecord) => {
    setSelectedComplaintId(comp.id);
    setStatusDraft(comp.status);
    setResolutionNotes(comp.resolutionNotes || "");
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;

    const updated = store.resolveComplaint(selectedComplaintId, resolutionNotes, statusDraft);
    if (updated) {
      setComplaints(store.getComplaints());
      setSuccessMessage(`Case ${updated.id} resolution updated and synced to Parent Portal!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDeleteComplaintConfirm = () => {
    if (!deletingComplaint) return;
    setIsDeleting(true);

    const deleted = store.deleteComplaint(deletingComplaint.id);
    setIsDeleting(false);

    if (deleted) {
      setGlobalBanner(`Incident case ${deletingComplaint.id} has been deleted.`);
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

            <Link
              href="/admin/notices"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
            >
              Manage Center Notices →
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
                <AlertTriangle className="w-7 h-7 text-rose-500" />
                Parent Complaints Investigation & Resolution
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Formal incident reports submitted by parents with photographic proof attachments and resolution triage.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 self-start sm:self-auto">
              {complaints.filter((c) => c.status !== "resolved").length} Pending Triage
            </span>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by case ID, parent, or keyword..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {["all", "pending", "under_review", "resolved"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Complaints Table & Resolution Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Case ID</th>
                      <th className="px-4 py-3.5">Parent</th>
                      <th className="px-4 py-3.5">Caregiver</th>
                      <th className="px-4 py-3.5">Incident Title</th>
                      <th className="px-4 py-3.5">Proof</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400">
                          No complaints match the filter.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((comp) => (
                        <tr
                          key={comp.id}
                          onClick={() => handleSelect(comp)}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                            selectedComplaintId === comp.id ? "bg-blue-50/70" : ""
                          }`}
                        >
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{comp.id}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">{comp.parentName}</td>
                          <td className="px-4 py-3.5 text-slate-600">{comp.caregiverName}</td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">{comp.incidentTitle}</td>
                          <td className="px-4 py-3.5">
                            {comp.proofAttachmentUrl ? (
                              <a
                                href={comp.proofAttachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                              >
                                📷 Photo <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {comp.status === "resolved" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Resolved
                              </span>
                            ) : comp.status === "under_review" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Under Review
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingComplaint(comp);
                              }}
                              title="Delete Incident Record"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Triage Action Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Case Investigation Triage
              </h2>

              <form onSubmit={handleSaveResolution} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Selected Case ID</label>
                  <input
                    type="text"
                    disabled
                    value={selectedComplaintId || "None Selected"}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Investigation Status</label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-blue-600 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Formal Resolution Notes for Parent *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter formal findings, corrective actions, caregiver counseling outcome..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:outline-none resize-none"
                  />
                </div>

                {successMessage && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedComplaintId}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Save Resolution & Notify Parent
                </button>
              </form>
            </div>
          </div>

          {/* Delete Complaint Confirmation Modal */}
          <ConfirmationModal
            isOpen={!!deletingComplaint}
            onClose={() => setDeletingComplaint(null)}
            onConfirm={handleDeleteComplaintConfirm}
            title="Delete Incident Case"
            message={`Are you sure you want to permanently remove incident case "${deletingComplaint?.id}" (${deletingComplaint?.incidentTitle})?`}
            confirmLabel="Delete Case"
            variant="danger"
            isLoading={isDeleting}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
