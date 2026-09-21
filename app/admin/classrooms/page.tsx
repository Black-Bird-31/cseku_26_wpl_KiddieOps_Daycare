"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  School, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Baby, 
  Users, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { 
  getClassroomsAction, 
  createClassroomAction, 
  updateClassroomAction, 
  deleteClassroomAction,
  ClassroomItem 
} from "@/lib/actions/classrooms";

export default function AdminClassroomsPage() {
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ClassroomItem | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<ClassroomItem | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    ageRange: "18m – 3y",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadClassrooms = async () => {
    setLoading(true);
    const res = await getClassroomsAction();
    if (res.success && res.classrooms) {
      setClassrooms(res.classrooms);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const filtered = classrooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.ageRange && r.ageRange.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setFormData({ name: "", ageRange: "18m – 3y" });
    setFormError(null);
    setFormSuccess(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (room: ClassroomItem) => {
    setEditingRoom(room);
    setFormData({ name: room.name, ageRange: room.ageRange || "18m – 3y" });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const res = await createClassroomAction("administrator", formData);
    if (!res.success) {
      setFormError(res.error || "Failed to create classroom.");
      return;
    }

    setFormSuccess("Classroom created successfully!");
    await loadClassrooms();
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormSuccess(null);
    }, 1000);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setFormError(null);
    setFormSuccess(null);

    const res = await updateClassroomAction("administrator", editingRoom.id, formData);
    if (!res.success) {
      setFormError(res.error || "Failed to update classroom.");
      return;
    }

    setFormSuccess("Classroom updated successfully!");
    await loadClassrooms();
    setTimeout(() => {
      setEditingRoom(null);
      setFormSuccess(null);
    }, 1000);
  };

  const handleDeleteRoomConfirm = async () => {
    if (!deletingRoom) return;
    const targetRoom = deletingRoom;
    setIsLoadingAction(true);

    // Optimistically remove
    setClassrooms((prev) => prev.filter((r) => r.id !== targetRoom.id));
    setDeletingRoom(null);

    const res = await deleteClassroomAction("administrator", targetRoom.id);
    setIsLoadingAction(false);

    if (res.success) {
      setGlobalBanner(`Classroom "${targetRoom.name}" has been deleted.`);
      await loadClassrooms();
      setTimeout(() => setGlobalBanner(null), 4000);
    } else {
      setGlobalBanner(`Error: ${res.error || "Failed to delete classroom."}`);
      await loadClassrooms();
    }
  };

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="font-child text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-6 h-6 text-blue-600" />
                  Classroom Directory & Management
                </h1>
                <p className="text-xs text-slate-500">
                  Organize rooms, age groups, child assignments, and teacher allocations.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Classroom
            </button>
          </div>

          {/* Global Alert Banner */}
          {globalBanner && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{globalBanner}</span>
            </div>
          )}

          {/* Search & Statistics Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classroom by name or age range..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Total Classrooms: {classrooms.length}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                Enrolled Children: {classrooms.reduce((acc, r) => acc + (r.childrenCount || 0), 0)}
              </span>
            </div>
          </div>

          {/* Classrooms Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading classrooms...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <School className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-700">No classrooms found</h3>
              <p className="text-xs text-slate-400">Create a classroom to begin assigning children and teachers.</p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Classroom
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                        <School className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                        {room.ageRange || "All Ages"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-child text-lg font-bold text-slate-900 leading-snug">
                        {room.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {room.id.length > 12 ? `${room.id.substring(0, 12)}...` : room.id}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Baby className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[10px] font-semibold">Children</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{room.childrenCount ?? 0}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[10px] font-semibold">Caregivers</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{room.caregiversCount ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditModal(room)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingRoom(room)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit Classroom Modal */}
          {(isAddModalOpen || editingRoom) && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl relative animate-in fade-in max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingRoom(null);
                  }}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <h2 className="font-child text-xl font-bold text-slate-900">
                    {editingRoom ? "Edit Classroom" : "Create New Classroom"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Define classroom name, target age group, and developmental focus.
                  </p>
                </div>

                <form onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Classroom Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sunbeam Toddlers (Butterflies)"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Age Range *</label>
                    <input
                      type="text"
                      required
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      placeholder="e.g. 18m – 3y, 3y – 5y, Infants"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
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

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setEditingRoom(null);
                      }}
                      className="px-4 py-2 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {editingRoom ? "Save Changes" : "Create Classroom"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Classroom Confirmation Modal */}
          <ConfirmationModal
            isOpen={!!deletingRoom}
            onClose={() => setDeletingRoom(null)}
            onConfirm={handleDeleteRoomConfirm}
            title="Delete Classroom"
            message={`Are you sure you want to delete "${deletingRoom?.name}"? Any enrolled children will be unassigned from this classroom.`}
            confirmLabel="Delete Classroom"
            variant="danger"
            isLoading={isLoadingAction}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
