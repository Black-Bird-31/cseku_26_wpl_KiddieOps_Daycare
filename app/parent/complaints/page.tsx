"use client";

import React, { useState, useEffect } from "react";
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
  Trash2
} from "lucide-react";
import { store, ComplaintRecord, ChildRecord, UserRecord, initialUsers } from "@/lib/mock-data";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";

export default function ParentComplaintsPage() {
  const [parentUser, setParentUser] = useState<UserRecord>(initialUsers[2]);
  const [parentChildren, setParentChildren] = useState<ChildRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [caregiverName, setCaregiverName] = useState("Nusrat Jahan");
  const [selectedChildId, setSelectedChildId] = useState("");
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [proofAttachmentUrl, setProofAttachmentUrl] = useState("");

  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion modal state
  const [deletingComplaint, setDeletingComplaint] = useState<ComplaintRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadData = () => {
    const saved = localStorage.getItem("kiddieops_active_user");
    let current = initialUsers[2];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === "parent") current = parsed;
      } catch (e) {
        console.error(e);
      }
    }
    setParentUser(current);

    const children = store.getChildrenForGuardian(current.id);
    setParentChildren(children);
    if (children.length > 0) setSelectedChildId(children[0].id);

    setComplaints(store.getComplaintsForParent(current.id));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!incidentTitle.trim() || !incidentDescription.trim()) {
      setFormError("Please fill out both the incident summary and detailed description.");
      return;
    }

    const linkedChild = parentChildren.find((c) => c.id === selectedChildId);

    store.addComplaint({
      parentUserId: parentUser.id,
      parentName: parentUser.name,
      caregiverName,
      childId: linkedChild?.id,
      childName: linkedChild?.name,
      incidentTitle,
      incidentDescription,
      proofAttachmentUrl: proofAttachmentUrl || undefined,
    });

    setComplaints(store.getComplaintsForParent(parentUser.id));
    setFormSuccess("Incident report filed successfully! Daycare administration will review and investigate.");
    setIncidentTitle("");
    setIncidentDescription("");
    setProofAttachmentUrl("");

    setTimeout(() => {
      setFormSuccess(null);
      setIsModalOpen(false);
    }, 1500);
  };

  const handleDeleteComplaintConfirm = () => {
    if (!deletingComplaint) return;
    setIsDeleting(true);

    const deleted = store.deleteComplaint(deletingComplaint.id);
    setIsDeleting(false);

    if (deleted) {
      setGlobalBanner(`Incident report ${deletingComplaint.id} has been withdrawn.`);
      setDeletingComplaint(null);
      loadData();
      setTimeout(() => setGlobalBanner(null), 4000);
    }
  };

  const pendingCount = complaints.filter((c) => c.status !== "resolved").length;
  const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

  return (
    <AuthGuard allowedRoles={["parent"]}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
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

          {/* Header Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <AlertTriangle className="w-7 h-7 text-rose-500" />
                Parent Concerns & Incident Reports
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Report classroom or caregiver concerns directly to the principal with photographic proof attachments.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              + File Incident Report
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500">Total Cases Filed</div>
              <div className="text-2xl font-extrabold text-slate-900">{complaints.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-amber-600">Pending / Under Review</div>
              <div className="text-2xl font-extrabold text-amber-600">{pendingCount}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-emerald-600">Resolved by Admin</div>
              <div className="text-2xl font-extrabold text-emerald-600">{resolvedCount}</div>
            </div>
          </div>

          {/* Complaints List */}
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm space-y-2">
                <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
                <p>You have no active incident reports on file.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Click here to report a concern
                </button>
              </div>
            ) : (
              complaints.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {comp.id}
                      </span>
                      <h2 className="font-child text-lg font-bold text-slate-900">
                        {comp.incidentTitle}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {comp.status === "resolved" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : comp.status === "under_review" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> Under Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5" /> Pending Investigation
                        </span>
                      )}

                      <button
                        onClick={() => setDeletingComplaint(comp)}
                        title="Withdraw / Delete Report"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {comp.incidentDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div>Target Caregiver: <strong className="text-slate-800">{comp.caregiverName}</strong></div>
                    {comp.childName && <div>Child: <strong className="text-slate-800">{comp.childName}</strong></div>}
                    <div>Date Filed: <strong className="text-slate-800">{new Date(comp.createdAt).toLocaleDateString()}</strong></div>
                    {comp.proofAttachmentUrl && (
                      <a
                        href={comp.proofAttachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold"
                      >
                        📷 View Attached Proof Photo <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Official Admin Resolution Notes Banner */}
                  {comp.resolutionNotes && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Administrator Formal Resolution & Follow-Up Notes:
                      </div>
                      <p className="text-emerald-800 leading-relaxed">
                        {comp.resolutionNotes}
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

          {/* Modal to Report Incident (REQ39) */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in max-h-[90vh] overflow-y-auto">
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
                    Your report will be sent directly to the center principal for formal investigation.
                  </p>
                </div>

                <form onSubmit={handleFileComplaint} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Relevant Caregiver *</label>
                      <select
                        value={caregiverName}
                        onChange={(e) => setCaregiverName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none"
                      >
                        <option value="Nusrat Jahan">Nusrat Jahan (Lead Teacher)</option>
                        <option value="General Administration">General Administration</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Associated Child</label>
                      <select
                        value={selectedChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none"
                      >
                        {parentChildren.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Incident Subject / Summary *</label>
                    <input
                      type="text"
                      required
                      value={incidentTitle}
                      onChange={(e) => setIncidentTitle(e.target.value)}
                      placeholder="e.g. Nap supervision delay or playground safety"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none"
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
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Cloudinary Proof Photo Attachment */}
                  <CloudinaryUploader
                    label="Attach Photo / Proof (Cloudinary CDN)"
                    folder="kiddieops/complaints"
                    currentImageUrl={proofAttachmentUrl}
                    onUploadSuccess={(res) => {
                      setProofAttachmentUrl(res.secureUrl);
                    }}
                  />

                  {formError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Incident Report
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Complaint Confirmation Modal */}
          <ConfirmationModal
            isOpen={!!deletingComplaint}
            onClose={() => setDeletingComplaint(null)}
            onConfirm={handleDeleteComplaintConfirm}
            title="Withdraw Incident Report"
            message={`Are you sure you want to withdraw and delete incident report "${deletingComplaint?.id}" (${deletingComplaint?.incidentTitle})?`}
            confirmLabel="Withdraw Report"
            variant="danger"
            isLoading={isDeleting}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
