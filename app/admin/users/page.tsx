"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  HeartHandshake, 
  Baby, 
  Edit3, 
  Trash2,
  Power, 
  CheckCircle2, 
  X, 
  ArrowLeft, 
  AlertCircle,
  KeyRound,
  Mail,
  Eye,
  EyeOff
} from "lucide-react";
import { store, UserRecord } from "@/lib/mock-data";
import { getUsersAction, createUserAction, updateUserAction, toggleUserStatusAction, deleteUserAction } from "@/lib/actions/users";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [statusTogglingUser, setStatusTogglingUser] = useState<UserRecord | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "parent" as "administrator" | "caregiver" | "parent",
    isActive: true,
    avatarUrl: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  const loadUsers = async () => {
    const res = await getUsersAction("administrator");
    if (res.success && res.users) {
      setUsers(res.users);
    } else {
      setUsers(store.getUsers());
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenAddModal = () => {
    setShowPassword(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "parent",
      isActive: true,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    });
    setFormError(null);
    setFormSuccess(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: UserRecord) => {
    setShowPassword(false);
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl || "",
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const res = await createUserAction("administrator", formData);
    if (!res.success) {
      setFormError(res.error || "Failed to create user");
      return;
    }

    setFormSuccess("User account created successfully!");
    loadUsers();
    setTimeout(() => {
      setIsAddModalOpen(false);
      setFormSuccess(null);
    }, 1200);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    setFormSuccess(null);

    const updates: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      isActive: formData.isActive,
      avatarUrl: formData.avatarUrl,
    };
    if (formData.password && formData.password.trim().length > 0) {
      updates.password = formData.password.trim();
    }

    const res = await updateUserAction("administrator", editingUser.id, updates);
    if (!res.success) {
      setFormError(res.error || "Failed to update user");
      return;
    }

    setFormSuccess("User profile updated successfully!");
    loadUsers();
    setTimeout(() => {
      setEditingUser(null);
      setFormSuccess(null);
    }, 1200);
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusTogglingUser) return;
    setIsLoadingAction(true);

    const targetStatus = !statusTogglingUser.isActive;
    const res = await toggleUserStatusAction("administrator", statusTogglingUser.id, targetStatus);
    setIsLoadingAction(false);

    if (res.success) {
      setGlobalBanner(`User "${statusTogglingUser.name}" has been ${targetStatus ? "activated" : "deactivated"} successfully.`);
      setStatusTogglingUser(null);
      loadUsers();
      setTimeout(() => setGlobalBanner(null), 4000);
    } else {
      alert(res.error || "Failed to change user status.");
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!deletingUser) return;
    const targetUser = deletingUser;
    setIsLoadingAction(true);

    // Optimistically remove from state immediately
    setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    setDeletingUser(null);

    const res = await deleteUserAction("administrator", targetUser.id);
    setIsLoadingAction(false);

    if (res.success) {
      setGlobalBanner(`User account for "${targetUser.name}" was permanently removed.`);
      await loadUsers();
      setTimeout(() => setGlobalBanner(null), 4000);
    } else {
      setGlobalBanner(`Error: ${res.error || "Failed to delete user account."}`);
      await loadUsers();
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrator":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            Administrator
          </span>
        );
      case "caregiver":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <HeartHandshake className="w-3 h-3 text-emerald-600" />
            Caregiver
          </span>
        );
      case "parent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Baby className="w-3 h-3 text-amber-600" />
            Parent
          </span>
        );
      default:
        return null;
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
              href="/admin/children"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
            >
              Enrolled Children Roster →
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
                <Users className="w-7 h-7 text-blue-600" />
                Staff & Parents Directory
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Manage daycare staff, teachers, and parent guardian user accounts, permissions, and statuses.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add New User
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
                placeholder="Search user by name or email..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-semibold">Filter:</span>
              {["all", "administrator", "caregiver", "parent"].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    roleFilter === role
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">User Name & Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img
                            src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                            alt={user.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                            <div className="text-slate-500 text-xs">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4">
                          {user.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              title="Edit User Profile"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {user.email !== "admin@kiddieops.com" && (
                              <>
                                <button
                                  onClick={() => setStatusTogglingUser(user)}
                                  title={user.isActive ? "Deactivate User Account" : "Activate User Account"}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    user.isActive
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  }`}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingUser(user)}
                                  title="Forcefully Delete User Account"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add / Edit User Modal */}
          {(isAddModalOpen || editingUser) && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <h2 className="font-child text-xl font-bold text-slate-900">
                    {editingUser ? "Edit User Profile" : "Create New User Account"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure role-based access, login credentials, and user details.
                  </p>
                </div>

                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                  <CloudinaryUploader
                    label="Profile Avatar (Cloudinary CDN)"
                    folder="kiddieops/users"
                    currentImageUrl={formData.avatarUrl}
                    onUploadSuccess={(res) => {
                      setFormData({ ...formData, avatarUrl: res.secureUrl });
                    }}
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Tanzina Rahman"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="user@kiddieops.com"
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {editingUser ? "New Password (leave blank to keep current)" : "Password *"}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required={!editingUser}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingUser ? "Leave blank to keep current" : "••••••••"}
                        className="w-full pl-9 pr-10 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Assigned Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="parent">Parent</option>
                      <option value="caregiver">Caregiver</option>
                      <option value="administrator">Administrator</option>
                    </select>
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
                        setEditingUser(null);
                      }}
                      className="px-4 py-2 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {editingUser ? "Save Changes" : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Deactivate / Activate Status Modal */}
          <ConfirmationModal
            isOpen={!!statusTogglingUser}
            onClose={() => setStatusTogglingUser(null)}
            onConfirm={handleToggleStatusConfirm}
            title={statusTogglingUser?.isActive ? "Deactivate User Account" : "Activate User Account"}
            message={
              statusTogglingUser?.isActive
                ? `Are you sure you want to deactivate "${statusTogglingUser?.name}"? Deactivated users will be prevented from logging into the portal.`
                : `Are you sure you want to reactivate "${statusTogglingUser?.name}"? They will regain access to their portal.`
            }
            confirmLabel={statusTogglingUser?.isActive ? "Deactivate Account" : "Activate Account"}
            variant="toggle"
            isLoading={isLoadingAction}
          />

          {/* Delete User Confirmation Modal */}
          <ConfirmationModal
            isOpen={!!deletingUser}
            onClose={() => setDeletingUser(null)}
            onConfirm={handleDeleteUserConfirm}
            title="Forcefully Delete User Account"
            message={`Are you sure you want to forcefully and permanently delete "${deletingUser?.name}" (${deletingUser?.email})? All associated sessions, logs, and relationships will be purged.`}
            confirmLabel="Force Delete User"
            variant="danger"
            isLoading={isLoadingAction}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
