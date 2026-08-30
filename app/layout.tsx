import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "KiddieOps — Smart Daycare Operations & AI Guardian",
  description:
    "Grounded daycare management platform for Bangladesh childcare centers with Cloudinary photo uploads, user management, child profiles, and role-based access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-amber-400 selection:text-slate-950 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}
