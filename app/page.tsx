"use client";

import React from "react";
import Link from "next/link";
import { 
  Sun, 
  ShieldCheck, 
  HeartHandshake, 
  Baby, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Bot, 
  Clock, 
  ShieldAlert, 
  Camera,
  Star,
  Users,
  Check
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Smart Daycare Operations & Guardian Platform
          </div>

          <h1 className="font-child text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Nurturing Little Minds with <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
              Care, Safety & AI Guardian
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            A comprehensive, modern daycare platform connecting Administrators, Caregivers, and Parents with real-time daily routine logging, photo sharing, medical alerts, and AI-powered insights.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 kiddie-btn"
            >
              <span>Sign In to Your Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/parent"
              className="px-6 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-sm border border-amber-200 flex items-center gap-2 kiddie-btn"
            >
              <Baby className="w-4 h-4 text-amber-600" />
              <span>Parent Portal Preview</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Role Portals Overview */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-child text-3xl font-extrabold text-slate-900">
              Tailored Portals for Everyone
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Purpose-built experiences for center administrators, teachers, and loving parents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Admin Portal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-child text-xl font-bold text-slate-900">Administrator Portal</h3>
                  <p className="text-xs text-slate-500 mt-1">Full Operations & Governance</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manage enrolled children, staff profiles, classroom assignments, center announcements, and incident resolution from a single dashboard.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" /> User & Role Management
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" /> Child Enrollment & Allergen Records
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" /> Center Notice Publishing
                  </li>
                </ul>
              </div>
              <Link
                href="/admin"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Access Admin Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Caregiver Portal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-child text-xl font-bold text-slate-900">Caregiver Portal</h3>
                  <p className="text-xs text-slate-500 mt-1">Classroom Daily Operations</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Take daily attendance, record meals, nap times, learning milestones, and capture precious moments for parents throughout the day.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Fast Daily Attendance Check-ins
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Real-time Allergen Warning Alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> 1-Tap Meal & Nap Routine Logs
                  </li>
                </ul>
              </div>
              <Link
                href="/caregiver"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Access Caregiver Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Parent Portal Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Baby className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-child text-xl font-bold text-slate-900">Parent & Guardian Portal</h3>
                  <p className="text-xs text-slate-500 mt-1">Child Insights & AI Guardian</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time visibility into your child's daily routine, emergency contacts, medical records, and conversational AI answers to all your questions.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600" /> Live Daily Feed & Meal Summaries
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600" /> AI Guardian Assistant (EN & বাংলা)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600" /> Private Media Moments Gallery
                  </li>
                </ul>
              </div>
              <Link
                href="/parent"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Access Parent Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-child text-3xl font-extrabold text-slate-900">
            Engineered for Modern Childcare
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Safety, simplicity, and transparency at every step.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">AI Guardian Assistant</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Synthesizes daily sleep, meal, and milestone patterns to answer parent questions naturally in English and Bangla.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Allergen Safety Badges</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prominent visual flags for dietary allergies and emergency medical instructions across all classroom rosters.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Cloudinary CDN Media</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fast, high-quality picture and video uploads allowing teachers to share delightful learning moments instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Real-time Check-ins</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Accurate check-in and check-out timestamps giving parents full visibility throughout the daycare day.
            </p>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center text-white">
              <Sun className="w-4 h-4" />
            </div>
            <span className="font-child font-bold text-slate-800 text-sm">KiddieOps</span>
            <span>— Smart Daycare Management</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} KiddieOps. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
