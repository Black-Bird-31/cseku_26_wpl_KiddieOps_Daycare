"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Baby, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Utensils, 
  Moon, 
  Sparkles, 
  Bot, 
  Calendar, 
  School, 
  Phone, 
  Send,
  MessageSquare,
  Activity,
  AlertTriangle,
  BellRing,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { store, ChildRecord, UserRecord, ComplaintRecord, NoticeRecord, initialUsers } from "@/lib/mock-data";
import AuthGuard from "@/components/auth/AuthGuard";

export default function ParentDashboardPage() {
  const [parentUser, setParentUser] = useState<UserRecord>(initialUsers[2]); // Farhana Ahmed
  const [parentChildren, setParentChildren] = useState<ChildRecord[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildRecord | null>(null);
  const [noticesCount, setNoticesCount] = useState(0);
  const [complaintsCount, setComplaintsCount] = useState(0);

  // AI Guardian Chat state (WF-05)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "parent" | "ai"; text: string; time: string }>>([
    {
      sender: "ai",
      text: "Hello Farhana! I'm your AI Guardian. Ask me anything about Anika's routine, meals, sleep patterns, or developmental milestones today.",
      time: "09:00 AM",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  const loadData = () => {
    const saved = localStorage.getItem("kiddieops_active_user");
    let current = initialUsers[2];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === "parent") {
          current = parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setParentUser(current);

    const children = store.getChildrenForGuardian(current.id);
    setParentChildren(children);
    if (children.length > 0) {
      setSelectedChild(children[0]);
    }

    setNoticesCount(store.getNotices().length);
    setComplaintsCount(store.getComplaintsForParent(current.id).length);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendQuery = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const newMessages = [
      ...chatMessages,
      { sender: "parent" as const, text: query, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];
    setChatMessages(newMessages);
    setInputQuery("");
    setIsAiTyping(true);

    setTimeout(() => {
      let aiResponse = `Based on today's logs for ${selectedChild?.name || "your child"}, she has had a wonderful morning. Morning snack was eaten at 09:30 AM with high energy, and afternoon nap was 1 hour 20 minutes.`;
      
      const lower = query.toLowerCase();
      if (lower.includes("sleep") || lower.includes("nap")) {
        aiResponse = `${selectedChild?.name} napped for 1 hour 20 minutes today, which is about 20 minutes shorter than her weekly average of 1h 45m. She woke up refreshed at 02:20 PM.`;
      } else if (lower.includes("eat") || lower.includes("meal") || lower.includes("food")) {
        aiResponse = `She ate 100% of her morning cut fruits and allergen-safe oatmeal at 09:30 AM. Teacher Nusrat noted she drank 200ml water as well.`;
      } else if (lower.includes("cranky") || lower.includes("mood")) {
        aiResponse = `Her mood was cheerful throughout circle time and block building. Afternoon mood rating is 5/5 stars with active peer participation.`;
      }

      setChatMessages([
        ...newMessages,
        { sender: "ai" as const, text: aiResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setIsAiTyping(false);
    }, 600);
  };

  return (
    <AuthGuard allowedRoles={["parent"]}>
      <div className="min-h-screen bg-slate-50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Header & Navigation Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900">
                Welcome back, {parentUser.name}!
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm">
                Live child routine feeds, developmental milestones, and AI Guardian assistance.
              </p>
            </div>

            {/* Sub-Page Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/parent/notices"
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <BellRing className="w-4 h-4 text-blue-600" />
                Center Notices
                {noticesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {noticesCount}
                  </span>
                )}
              </Link>

              <Link
                href="/parent/complaints"
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Incident Reports
                {complaintsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    {complaintsCount}
                  </span>
                )}
              </Link>

              {/* Child Picker if > 1 child */}
              {parentChildren.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {parentChildren.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedChild?.id === child.id
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedChild && (
            <>
              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Today's Status</span>
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700">Present</div>
                  <div className="text-[11px] text-slate-500 font-medium">Checked in at 08:30 AM</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Morning Snack</span>
                    <Utensils className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">100% Eaten</div>
                  <div className="text-[11px] text-slate-500 font-medium">Oatmeal & Cut Fruit (09:30 AM)</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Nap Duration</span>
                    <Moon className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">1h 20m</div>
                  <div className="text-[11px] text-slate-500 font-medium">Quiet sleep in crib #3</div>
                </div>

                <Link
                  href="/parent/notices"
                  className="bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 transition-all block group"
                >
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Center Notices</span>
                    <BellRing className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">{noticesCount} Notices</div>
                  <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    View announcements <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </div>

              {/* Main Layout: Left Child Profile, Center Activity Stream, Right AI Guardian */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 1 Col: Child Profile Card */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                    <div className="text-center space-y-3">
                      <img
                        src={selectedChild.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80"}
                        alt={selectedChild.name}
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 mx-auto shadow-xs"
                      />
                      <div>
                        <h2 className="font-child text-xl font-bold text-slate-900">{selectedChild.name}</h2>
                        <p className="text-xs text-amber-700 font-semibold">{selectedChild.classroomName}</p>
                      </div>
                    </div>

                    {/* Allergy Alert Banner */}
                    {selectedChild.allergyFlag ? (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>ALLERGY WARNING RECORD</span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          {selectedChild.allergyDetails || "Severe Peanut & Dairy allergy. Epipen in daycare cabinet."}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>No known severe dietary allergies</span>
                      </div>
                    )}

                    {/* Details List */}
                    <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Date of Birth:
                        </span>
                        <span className="font-semibold text-slate-800">{selectedChild.dateOfBirth}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <School className="w-3.5 h-3.5" /> Classroom:
                        </span>
                        <span className="font-semibold text-slate-800">{selectedChild.classroomName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> Emergency:
                        </span>
                        <span className="font-mono font-bold text-slate-900">{selectedChild.emergencyContactPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center & Right 2 Cols: Activity Timeline & AI Guardian Chat */}
                <div className="lg:col-span-2 space-y-6">
                  {/* AI Guardian Interactive Chat Card (Matching Wireframe WF-05) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="font-child text-lg font-bold text-slate-900 flex items-center gap-2">
                            AI Guardian Assistant
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                              EN & বাংলা
                            </span>
                          </h2>
                          <p className="text-xs text-slate-500">Ask natural questions about {selectedChild.name}'s daily routine</p>
                        </div>
                      </div>
                    </div>

                    {/* Suggested Quick Prompt Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        onClick={() => handleSendQuery("How long did she sleep today?")}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        "How long did she sleep today?"
                      </button>
                      <button
                        onClick={() => handleSendQuery("Did she finish her morning snack?")}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        "Did she finish her morning snack?"
                      </button>
                      <button
                        onClick={() => handleSendQuery("What was her mood during playtime?")}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        "What was her mood during playtime?"
                      </button>
                    </div>

                    {/* Chat Box */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 min-h-[220px] max-h-[280px] overflow-y-auto space-y-3">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${
                            msg.sender === "parent" ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === "parent"
                                ? "bg-blue-600 text-white rounded-br-xs"
                                : "bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-xs"
                            }`}
                          >
                            {msg.sender === "ai" && (
                              <span className="block font-bold text-[10px] text-purple-600 mb-0.5">
                                🤖 AI Guardian
                              </span>
                            )}
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
                        </div>
                      ))}

                      {isAiTyping && (
                        <div className="text-xs text-purple-600 flex items-center gap-1.5 font-medium animate-pulse">
                          <Bot className="w-3.5 h-3.5" /> AI Guardian is thinking...
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendQuery();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        placeholder="Ask AI Guardian anything about your child's day..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </form>
                  </div>

                  {/* Today's Live Activity Stream */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Today's Routine Stream
                      </h2>
                      <span className="text-xs text-slate-500">Live from Classroom</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-700">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 text-sm">Morning Snack</span>
                            <span className="text-slate-400 font-mono text-[11px]">09:30 AM</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">Ate 100% portion of fruits and oatmeal. Allergen-free protocol verified.</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold flex-shrink-0">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 text-sm">Afternoon Nap Time</span>
                            <span className="text-slate-400 font-mono text-[11px]">01:00 PM</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">Slept peacefully for 1 hour 20 minutes in cot #3.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
