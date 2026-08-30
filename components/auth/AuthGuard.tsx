"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getStoredUser } from "@/lib/auth-client";
import { Shield, Lock } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<"administrator" | "caregiver" | "parent">;
}

export default function AuthGuard({
  children,
  allowedRoles = ["administrator", "caregiver", "parent"],
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getStoredUser();

    // 1. If not authenticated at all -> Redirect to login
    if (!user || !user.isActive) {
      setIsAuthorized(false);
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${redirectParam}`);
      return;
    }

    // 2. If authenticated, check if user's role is allowed for this panel
    if (!allowedRoles.includes(user.role)) {
      setIsAuthorized(false);
      // Redirect to their own authorized dashboard
      if (user.role === "administrator") router.replace("/admin");
      else if (user.role === "caregiver") router.replace("/caregiver");
      else if (user.role === "parent") router.replace("/parent");
      return;
    }

    // 3. Authorized
    setIsAuthorized(true);
  }, [pathname, router, allowedRoles]);

  // Loading state while checking authentication
  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-sm w-full space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-child text-lg font-bold text-slate-900">Verifying Access...</h3>
            <p className="text-xs text-slate-500 mt-1">
              Checking authentication and role permissions.
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
