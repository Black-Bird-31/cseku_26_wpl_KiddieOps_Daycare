"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Sun, 
  Lock, 
  Mail, 
  ShieldCheck, 
  HeartHandshake, 
  Baby, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  KeyRound
} from "lucide-react";
import { authenticateUser } from "@/lib/auth";
import { getStoredUser, setStoredUser } from "@/lib/auth-client";
import { initialUsers } from "@/lib/mock-data";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const [email, setEmail] = useState("admin@kiddieops.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const existing = getStoredUser();
    if (existing && existing.isActive) {
      if (existing.role === "administrator") router.replace("/admin");
      else if (existing.role === "caregiver") router.replace("/caregiver");
      else router.replace("/parent");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const authResult = authenticateUser(email, password);

      if (!authResult.success || !authResult.user) {
        setError(authResult.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      const user = authResult.user;

      // Save user session in localStorage & cookies
      setStoredUser(user);

      // Determine destination: check if requested redirect matches allowed role
      let destination = "";
      if (redirectUrl) {
        const path = redirectUrl.toLowerCase();
        if (path.startsWith("/admin") && user.role === "administrator") {
          destination = redirectUrl;
        } else if (path.startsWith("/caregiver") && (user.role === "caregiver" || user.role === "administrator")) {
          destination = redirectUrl;
        } else if (path.startsWith("/parent") && user.role === "parent") {
          destination = redirectUrl;
        }
      }

      if (!destination) {
        if (user.role === "administrator") destination = "/admin";
        else if (user.role === "caregiver") destination = "/caregiver";
        else destination = "/parent";
      }

      router.push(destination);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Top Brand Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-xs">
              <Sun className="w-7 h-7 text-white" />
            </div>
            <span className="font-child text-2xl font-bold tracking-wide text-slate-900">
              KiddieOps
            </span>
          </Link>
          <h1 className="font-child text-2xl font-bold text-slate-900">Sign in to your account</h1>
          <p className="text-xs text-slate-500">
            Secure role-based portal for Daycare Administrators, Caregivers, and Parents.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kiddieops.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
              Quick Demo Accounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo("admin@kiddieops.com", "admin123")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-center transition-all cursor-pointer group"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-[11px] font-bold text-slate-800">Admin</div>
                <div className="text-[9px] text-slate-400">admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("nusrat@kiddieops.com", "caregiver123")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-center transition-all cursor-pointer group"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-[11px] font-bold text-slate-800">Caregiver</div>
                <div className="text-[9px] text-slate-400">caregiver123</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo("farhana@gmail.com", "parent123")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-center transition-all cursor-pointer group"
              >
                <Baby className="w-4 h-4 text-amber-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-[11px] font-bold text-slate-800">Parent</div>
                <div className="text-[9px] text-slate-400">parent123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← Back to Daycare Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
