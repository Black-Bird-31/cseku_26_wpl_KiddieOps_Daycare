"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  HeartHandshake, 
  School, 
  Baby, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Utensils, 
  Moon, 
  Camera,
  Check,
  Calendar,
  Phone,
  FileText,
  AlertCircle
} from "lucide-react";
import { store, ChildRecord, ClassroomRecord } from "@/lib/mock-data";
import AuthGuard from "@/components/auth/AuthGuard";

export default function CaregiverDashboardPage() {
  const [classroom, setClassroom] = useState<ClassroomRecord | null>(null);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildRecord | null>(null);
  const [activeActionModal, setActiveActionModal] = useState<"attendance" | "activity" | "photo" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Attendance Sheet state (WF-07)
  const [attendanceSheet, setAttendanceSheet] = useState<{ [childId: string]: { status: "present" | "late" | "absent"; inTime: string; outTime: string } }>({
    "child-01": { status: "present", inTime: "08:30", outTime: "" },
    "child-02": { status: "late", inTime: "09:45", outTime: "" },
    "child-03": { status: "present", inTime: "08:40", outTime: "" },
  });

  useEffect(() => {
    const rooms = store.getClassrooms();
    const primaryRoom = rooms[0];
    setClassroom(primaryRoom);

    const roomChildren = store.getChildren().filter((c) => c.classroomId === primaryRoom?.id || true);
    setChildren(roomChildren);
    if (roomChildren.length > 0) setSelectedChild(roomChildren[0]);
  }, []);

  const handleQuickLog = (activityTitle: string) => {
    if (!selectedChild) return;
    setFeedbackMessage(`Logged ${activityTitle} for ${selectedChild.name}!`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleSaveAttendance = () => {
    setFeedbackMessage("Daily attendance roster saved successfully!");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <AuthGuard allowedRoles={["caregiver", "administrator"]}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Caregiver Header (Matching Wireframe WF-06) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {classroom?.name || "Sunbeam Toddlers (Butterflies)"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {children.length} PRESENT TODAY
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm">
                Lead Teacher: <strong>Nusrat Jahan</strong> · Classroom Active Roster & Daily Health Logs
              </p>
            </div>

            {/* Quick Action Tiles (Matching Wireframe WF-06) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveActionModal("attendance")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>📋 Take Attendance</span>
              </button>
              <button
                onClick={() => setActiveActionModal("activity")}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>📝 Log Routine</span>
              </button>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedbackMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Main Grid: Left Column Roster + Attendance, Right Column Child Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Classroom Attendance Table & Children Roster */}
            <div className="lg:col-span-2 space-y-6">
              {/* Daily Attendance Sheet Table (Matching Wireframe WF-07) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-child text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Daily Attendance Sheet (Today)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Record check-in time, check-out time, and daily attendance status.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveAttendance}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Sheet
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-y border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Child</th>
                        <th className="px-4 py-3">Allergy Status</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Check-In</th>
                        <th className="px-4 py-3">Check-Out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {children.map((child) => {
                        const att = attendanceSheet[child.id] || { status: "present", inTime: "08:30", outTime: "" };
                        return (
                          <tr key={child.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-2.5">
                              <img
                                src={child.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80"}
                                alt={child.name}
                                className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                              />
                              <span className="font-bold text-slate-900">{child.name}</span>
                            </td>
                            <td className="px-4 py-3">
                              {child.allergyFlag ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" /> Allergy
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Normal</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={att.status}
                                onChange={(e) =>
                                  setAttendanceSheet({
                                    ...attendanceSheet,
                                    [child.id]: { ...att, status: e.target.value as any },
                                  })
                                }
                                className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800"
                              >
                                <option value="present">Present</option>
                                <option value="late">Late</option>
                                <option value="absent">Absent</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="time"
                                value={att.inTime}
                                onChange={(e) =>
                                  setAttendanceSheet({
                                    ...attendanceSheet,
                                    [child.id]: { ...att, inTime: e.target.value },
                                  })
                                }
                                className="px-2 py-0.5 rounded border border-slate-300 text-xs text-slate-800 font-mono w-24"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="time"
                                value={att.outTime}
                                placeholder="--:--"
                                onChange={(e) =>
                                  setAttendanceSheet({
                                    ...attendanceSheet,
                                    [child.id]: { ...att, outTime: e.target.value },
                                  })
                                }
                                className="px-2 py-0.5 rounded border border-slate-300 text-xs text-slate-800 font-mono w-24"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Classroom Logs Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Recent Classroom Routine Timeline
                </h2>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Morning Snack (Cut Fruits & Oatmeal)</div>
                        <div className="text-slate-500">All children finished morning snack. Allergen-free served for Anika.</div>
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono">09:30 AM</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Afternoon Nap Time</div>
                        <div className="text-slate-500">Cribs prepared in quiet zone. Peaceful rest recorded.</div>
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono">01:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Selected Child Details & Quick Log Action */}
            <div className="space-y-6">
              {selectedChild && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <div className="text-center space-y-2">
                    <img
                      src={selectedChild.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80"}
                      alt={selectedChild.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 mx-auto shadow-xs"
                    />
                    <div>
                      <h3 className="font-child text-xl font-bold text-slate-900">{selectedChild.name}</h3>
                      <p className="text-xs text-slate-500">{selectedChild.classroomName}</p>
                    </div>
                  </div>

                  {/* Prominent Allergy Alert Banner */}
                  {selectedChild.allergyFlag ? (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>CRITICAL ALLERGY PROTOCOL</span>
                      </div>
                      <p className="text-[11px] text-rose-700">
                        {selectedChild.allergyDetails || "Severe Peanut & Dairy allergy. Epipen in Nurse box."}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>No known dietary allergies</span>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-700 uppercase text-[10px]">Emergency Details</div>
                    <div className="flex justify-between text-slate-800">
                      <span>Contact:</span>
                      <span className="font-semibold">{selectedChild.emergencyContactName}</span>
                    </div>
                    <div className="flex justify-between text-slate-800">
                      <span>Phone:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedChild.emergencyContactPhone}</span>
                    </div>
                  </div>

                  {/* 1-Tap Routine Log Buttons */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Quick Activity Log</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleQuickLog("Lunch (100% portion)")}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-adj-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Utensils className="w-3.5 h-3.5 text-amber-600" /> Log Meal
                      </button>
                      <button
                        onClick={() => handleQuickLog("Nap (1h 30m rest)")}
                        className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Moon className="w-3.5 h-3.5 text-sky-600" /> Log Nap
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
