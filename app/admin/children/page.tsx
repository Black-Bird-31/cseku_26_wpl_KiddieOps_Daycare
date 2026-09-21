"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Baby,
  PlusCircle,
  Search,
  ShieldAlert,
  Phone,
  Edit3,
  Trash2,
  Users,
  School,
  Calendar,
  CheckCircle2,
  X,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { store, ChildRecord, ClassroomRecord, UserRecord } from "@/lib/mock-data";
import { getAllChildrenAction, createChildAction, updateChildAction, deleteChildAction } from "@/lib/actions/children";
import { getUsersAction } from "@/lib/actions/users";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminChildrenPage() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [parents, setParents] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [classroomFilter, setClassroomFilter] = useState<string>("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [deletingChild, setDeletingChild] = useState<ChildRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "2023-05-10",
    classroomId: "room-butterflies",
    allergyFlag: false,
    allergyDetails: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    guardianIds: ["user-parent-01"],
    guardianRelationship: "Mother",
    avatarUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
    avatarAssetId: "media-c1",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadData = async () => {
    // 1. Fetch children from PostgreSQL
    const childRes = await getAllChildrenAction("administrator");
    if (childRes.success && childRes.children) {
      setChildren(childRes.children);
    } else {
      setChildren(store.getChildren());
    }

    setClassrooms(store.getClassrooms());

    // 2. Fetch parents from PostgreSQL
    const userRes = await getUsersAction("administrator");
    if (userRes.success && userRes.users) {
      setParents(userRes.users.filter((u) => u.role === "parent"));
    } else {
      setParents(store.getUsers().filter((u) => u.role === "parent"));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredChildren = children.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.emergencyContactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classroomFilter === "all" || c.classroomId === classroomFilter;
    return matchesSearch && matchesClass;
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      dateOfBirth: "2023-06-15",
      classroomId: classrooms[0]?.id || "room-butterflies",
      allergyFlag: false,
      allergyDetails: "",
      emergencyContactName: "Farhana Ahmed",
      emergencyContactPhone: "+880 1819-001122",
      guardianIds: [parents[0]?.id || "user-parent-01"],
      guardianRelationship: "Mother",
      avatarUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
      avatarAssetId: "media-c1",
    });
    setFormError(null);
    setFormSuccess(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (child: ChildRecord) => {
    setEditingChild(child);
    setFormData({
      name: child.name,
      dateOfBirth: child.dateOfBirth,
      classroomId: child.classroomId,
      allergyFlag: child.allergyFlag,
      allergyDetails: child.allergyDetails || "",
      emergencyContactName: child.emergencyContactName,
      emergencyContactPhone: child.emergencyContactPhone,
      guardianIds: child.guardianIds,
      guardianRelationship: child.guardianRelationship || "Guardian",
      avatarUrl: child.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
      avatarAssetId: child.avatarAssetId || "media-c1",
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = await createChildAction("administrator", formData);
    if (!result.success) {
      setFormError(result.error || "Failed to create child profile.");
      return;
    }

    setFormSuccess("Child profile registered successfully!");
    loadData();
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormSuccess(null);
    }, 1200);
  };

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    setFormError(null);

    const result = await updateChildAction("administrator", editingChild.id, formData);
    if (!result.success) {
      setFormError(result.error || "Failed to update child profile.");
      return;
    }

    setFormSuccess("Child profile updated successfully!");
    loadData();
    setTimeout(() => {
      setEditingChild(null);
      setFormSuccess(null);
    }, 1200);
  };

  const handleDeleteChildConfirm = async () => {
    if (!deletingChild) return;
    setIsDeleting(true);

    const targetId = deletingChild.id;
    const targetName = deletingChild.name;
    const result = await deleteChildAction("administrator", targetId);
    setIsDeleting(false);

    if (result.success) {
      setChildren((prev) => prev.filter((c) => c.id !== targetId));
      setGlobalBanner(`Child profile for "${targetName}" has been permanently removed.`);
      setDeletingChild(null);
      await loadData();
      setTimeout(() => setGlobalBanner(null), 4000);
    } else {
      alert(result.error || "Failed to delete child profile.");
    }
  };

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <Link
              href="/admin/users"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
            >
              Staff & Parents Directory →
            </Link>
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
                <Baby className="w-7 h-7 text-amber-500" />
                Enrolled Children Roster
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Manage student registrations, classroom room groupings, allergy alerts, and Cloudinary photos.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Register New Child
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by child or contact..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-semibold">Classroom:</span>
              <button
                onClick={() => setClassroomFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  classroomFilter === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                All Classrooms
              </button>
              {classrooms.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setClassroomFilter(cls.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    classroomFilter === cls.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>

          {/* Children Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChildren.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Baby className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No children profiles found matching filters.</p>
              </div>
            ) : (
              filteredChildren.map((child) => (
                <div
                  key={child.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3.5">
                      <img
                        src={child.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80"}
                        alt={child.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h2 className="font-child text-lg font-bold text-slate-900 truncate">{child.name}</h2>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(child)}
                              title="Edit Child Profile"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingChild(child)}
                              title="Delete Child Profile"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>DOB: {child.dateOfBirth}</span>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <School className="w-3 h-3" />
                          <span className="truncate">{child.classroomName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Allergy Alert Badge */}
                    {child.allergyFlag ? (
                      <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>ALLERGY ALERT</span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          {child.allergyDetails || "Severe allergies recorded. Follow classroom protocol."}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>No known dietary allergies</span>
                      </div>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> Guardian:
                      </span>
                      <span className="font-semibold text-slate-800">{child.guardianRelationship}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Emergency:
                      </span>
                      <span className="font-mono text-slate-900 font-bold">{child.emergencyContactPhone}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit / Register Modal */}
          {(isAddModalOpen || editingChild) && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingChild(null);
                  }}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <h2 className="font-child text-xl font-bold text-slate-900">
                    {editingChild ? "Edit Child Profile" : "Register New Child"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fill in child details, emergency contact, allergy flag, and photo.
                  </p>
                </div>

                <form onSubmit={editingChild ? handleUpdateChild : handleCreateChild} className="space-y-4">
                  <CloudinaryUploader
                    label="Child Photo (Cloudinary CDN)"
                    folder="kiddieops/children"
                    currentImageUrl={formData.avatarUrl}
                    onUploadSuccess={(res) => {
                      setFormData({
                        ...formData,
                        avatarUrl: res.secureUrl,
                        avatarAssetId: res.assetId,
                      });
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Child Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Liam Johnson"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Assign Classroom</label>
                    <select
                      value={formData.classroomId}
                      onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      {classrooms.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.ageRange})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Emergency Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        placeholder="e.g. Farhana Ahmed (Mother)"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Emergency Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={formData.emergencyContactPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        placeholder="+880 1711-223344"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Allergy Flag */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allergyFlag"
                        checked={formData.allergyFlag}
                        onChange={(e) => setFormData({ ...formData, allergyFlag: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-600 border-slate-300"
                      />
                      <label htmlFor="allergyFlag" className="text-xs font-bold text-rose-700 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Flag Allergy Alert on Child Profile
                      </label>
                    </div>

                    {formData.allergyFlag && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] font-semibold text-slate-700">Allergy Protocol Details</label>
                        <textarea
                          rows={2}
                          value={formData.allergyDetails}
                          onChange={(e) => setFormData({ ...formData, allergyDetails: e.target.value })}
                          placeholder="e.g. Peanut allergy. Epipen in Nurse box."
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-900 text-xs focus:border-rose-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

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
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setEditingChild(null);
                      }}
                      className="px-4 py-2 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {editingChild ? "Save Profile" : "Register Child"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Child Confirmation Modal */}
          <ConfirmationModal
            isOpen={!!deletingChild}
            onClose={() => setDeletingChild(null)}
            onConfirm={handleDeleteChildConfirm}
            title="Delete Child Profile"
            message={`Are you sure you want to permanently remove "${deletingChild?.name}" from the daycare enrollment roster? This action cannot be undone.`}
            confirmLabel="Delete Child"
            variant="danger"
            isLoading={isDeleting}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
