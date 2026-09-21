"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sun, 
  ShieldCheck, 
  HeartHandshake, 
  Baby, 
  LogOut, 
  LogIn,
  ChevronDown,
  LayoutDashboard,
  Sparkles,
  ShieldAlert,
  School,
  Users,
  Clock
} from "lucide-react";
import { getStoredUser, clearStoredUser } from "@/lib/auth-client";
import { SessionUser } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const checkAuth = () => {
    const user = getStoredUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    checkAuth();

    // Listen for custom auth events from login/logout
    window.addEventListener("kiddieops_auth_changed", checkAuth);
    return () => {
      window.removeEventListener("kiddieops_auth_changed", checkAuth);
    };
  }, [pathname]);

  const handleLogout = () => {
    clearStoredUser();
    setCurrentUser(null);
    setUserDropdownOpen(false);
    router.push("/login");
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrator":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
            Admin
          </span>
        );
      case "caregiver":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            Caregiver
          </span>
        );
      case "parent":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            Parent
          </span>
        );
      default:
        return null;
    }
  };

  const getDashboardHref = (role: string) => {
    if (role === "administrator") return "/admin";
    if (role === "caregiver") return "/caregiver";
    return "/parent";
  };

  const getDashboardLabel = (role: string) => {
    if (role === "administrator") return "Admin Dashboard";
    if (role === "caregiver") return "Classroom Portal";
    return "Parent & AI Portal";
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-xs">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-child text-xl font-bold tracking-wide text-slate-900">
                KiddieOps
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded border border-blue-200">
                Daycare
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-1 font-medium">Childcare & Guardian Platform</p>
          </div>
        </Link>

        {/* Center Navigation Links: Context-Aware based on Authentication & Role */}
        <nav className="hidden md:flex items-center gap-2">
          {currentUser ? (
            currentUser.role === "administrator" ? (
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    pathname === "/admin" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/admin/classrooms"
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    pathname === "/admin/classrooms" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Classrooms
                </Link>
                <Link
                  href="/admin/children"
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    pathname === "/admin/children" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Children
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    pathname === "/admin/users" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/complaints"
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    pathname === "/admin/complaints" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Complaints
                </Link>
              </div>
            ) : currentUser.role === "caregiver" ? (
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Link
                  href="/caregiver"
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    pathname === "/caregiver" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                  Classroom Portal
                </Link>
                <Link
                  href="/caregiver/attendance"
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    pathname === "/caregiver/attendance" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Attendance Sheet
                </Link>
              </div>
            ) : (
              <Link
                href={getDashboardHref(currentUser.role)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-2 transition-all border border-slate-200"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                {getDashboardLabel(currentUser.role)}
              </Link>
            )
          ) : (
            <div className="flex items-center gap-5 text-xs font-semibold text-slate-500">
              <span className="hover:text-slate-800 transition-colors">Daily Routines</span>
              <span className="hover:text-slate-800 transition-colors">Allergen Safety</span>
              <span className="hover:text-slate-800 transition-colors">AI Guardian</span>
            </div>
          )}
        </nav>

        {/* Right Side: User Profile / Login Button */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-300"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">{currentUser.name}</div>
                </div>
                {getRoleBadge(currentUser.role)}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown with Working Logout */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                  </div>

                  <div className="py-1">
                    <Link
                      href={getDashboardHref(currentUser.role)}
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                      My Portal Dashboard
                    </Link>

                    {currentUser.role === "caregiver" && (
                      <Link
                        href="/caregiver/attendance"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Clock className="w-4 h-4 text-emerald-600" />
                        Daily Attendance Sheet
                      </Link>
                    )}

                    {currentUser.role === "administrator" && (
                      <>
                        <Link
                          href="/admin/classrooms"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <School className="w-4 h-4 text-emerald-600" />
                          Classroom Management
                        </Link>
                        <Link
                          href="/admin/children"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Baby className="w-4 h-4 text-amber-600" />
                          Enrolled Children
                        </Link>
                        <Link
                          href="/admin/users"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Users className="w-4 h-4 text-purple-600" />
                          User Accounts
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Log In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
