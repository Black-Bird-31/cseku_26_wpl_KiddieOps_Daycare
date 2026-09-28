"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ShieldCheck,
  Camera,
  Video,
  Smile,
  RefreshCw,
  Play,
  HeartPulse,
  UserCheck,
  X,
  Check,
  Edit2,
  PlusCircle,
  FileText,
  AlertCircle,
  Filter,
  Search,
  ExternalLink
} from "lucide-react";
import { store, ChildRecord, UserRecord, initialUsers } from "@/lib/mock-data";
import { getStoredUser } from "@/lib/auth-client";
import AuthGuard from "@/components/auth/AuthGuard";
import { 
  getChildLiveFeedAction, 
  ActivityLogItem, 
  ChildMediaPostItem 
} from "@/lib/actions/caregiver";
import {
  getChildrenForParentAction,
  getChildMedicalRecordAction,
  updateParentChildContactAction,
  getChildAttendanceHistoryAction,
  requestChildLeaveAction,
  ParentMedicalRecordItem,
  AttendanceHistorySummary,
} from "@/lib/actions/parent";
import { getCenterNoticesAction, AdminNoticeItem } from "@/lib/actions/admin";

type ActiveTab = "overview" | "notices" | "gallery" | "medical" | "attendance";

export default function ParentDashboardPage() {
  const [parentUser, setParentUser] = useState<UserRecord>(initialUsers[2]); // Farhana Ahmed
  const [parentChildren, setParentChildren] = useState<ChildRecord[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildRecord | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [noticesCount, setNoticesCount] = useState(0);
  const [centerNotices, setCenterNotices] = useState<AdminNoticeItem[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticePriorityFilter, setNoticePriorityFilter] = useState<string>("all");
  const [noticeSearchQuery, setNoticeSearchQuery] = useState("");
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [globalBanner, setGlobalBanner] = useState<string | null>(null);

  // Live Child Feed from PostgreSQL database
  const [liveFeedLoading, setLiveFeedLoading] = useState(false);
  const [liveFeed, setLiveFeed] = useState<{
    todayAttendance?: any;
    todayDiaperCount: number;
    activities: ActivityLogItem[];
    mediaPosts: ChildMediaPostItem[];
    emergencyAlerts: Array<{ id: string; title: string; description: string; time: string }>;
  }>({
    todayDiaperCount: 0,
    activities: [],
    mediaPosts: [],
    emergencyAlerts: [],
  });

  // Medical Record State (WF-13)
  const [medicalRecord, setMedicalRecord] = useState<ParentMedicalRecordItem | null>(null);
  const [medicalLoading, setMedicalLoading] = useState(false);
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [editEmergencyName, setEditEmergencyName] = useState("");
  const [editEmergencyPhone, setEditEmergencyPhone] = useState("");
  const [editSpecialCare, setEditSpecialCare] = useState("");
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  // Attendance History State (WF-14)
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceHistorySummary | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("Doctor checkup & immunization");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Gallery Filter State (WF-10)
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "photo" | "video">("all");
  const [activeLightboxMedia, setActiveLightboxMedia] = useState<ChildMediaPostItem | null>(null);

  // AI Guardian Chat state (WF-12)
  const [aiLanguageMode, setAiLanguageMode] = useState<"en" | "bn">("en");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "parent" | "ai"; text: string; time: string }>>([
    {
      sender: "ai",
      text: "Hello! I'm your AI Guardian. Ask me anything about your child's routine, meals, sleep patterns, or developmental milestones today.",
      time: "09:00 AM",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Fetch PostgreSQL Live Data for the selected child
  const fetchLiveChildFeed = useCallback(async (childId: string) => {
    setLiveFeedLoading(true);
    try {
      const res = await getChildLiveFeedAction(childId);
      if (res.success) {
        setLiveFeed({
          todayAttendance: res.todayAttendance,
          todayDiaperCount: res.todayDiaperCount,
          activities: res.activities,
          mediaPosts: res.mediaPosts,
          emergencyAlerts: res.emergencyAlerts,
        });
      }
    } catch (e) {
      console.error("Error loading live child feed:", e);
    }
    setLiveFeedLoading(false);
  }, []);

  // Fetch Medical Record for selected child (WF-13)
  const fetchMedicalRecord = useCallback(async (childId: string) => {
    setMedicalLoading(true);
    try {
      const res = await getChildMedicalRecordAction(childId);
      if (res.success && res.medicalRecord) {
        setMedicalRecord(res.medicalRecord);
        setEditSpecialCare(res.medicalRecord.specialCareInstructions || "");
      }
    } catch (e) {
      console.error("Error loading medical record:", e);
    }
    setMedicalLoading(false);
  }, []);

  // Fetch Attendance History for selected child (WF-14)
  const fetchAttendanceHistory = useCallback(async (childId: string) => {
    setAttendanceLoading(true);
    try {
      const res = await getChildAttendanceHistoryAction(childId);
      if (res.success && res.summary) {
        setAttendanceSummary(res.summary);
      }
    } catch (e) {
      console.error("Error loading attendance history:", e);
    }
    setAttendanceLoading(false);
  }, []);

  const loadAllChildData = useCallback((child: ChildRecord) => {
    fetchLiveChildFeed(child.id);
    fetchMedicalRecord(child.id);
    fetchAttendanceHistory(child.id);
    setEditEmergencyName(child.emergencyContactName || "");
    setEditEmergencyPhone(child.emergencyContactPhone || "");
  }, [fetchLiveChildFeed, fetchMedicalRecord, fetchAttendanceHistory]);

  const loadData = useCallback(async () => {
    const user = getStoredUser();
    let current = initialUsers[2];
    if (user && user.role === "parent") {
      current = user as any;
    }
    setParentUser(current);

    try {
      const childRes = await getChildrenForParentAction(current.id);
      let kids: ChildRecord[] = [];
      if (childRes.success && childRes.children.length > 0) {
        kids = childRes.children;
      } else {
        kids = store.getChildrenForGuardian(current.id);
        if (kids.length === 0) kids = store.getChildren().slice(0, 2);
      }

      setParentChildren(kids);
      if (kids.length > 0) {
        const active = kids[0];
        setSelectedChild(active);
        loadAllChildData(active);
      }
    } catch (e) {
      console.error("Error initializing parent data:", e);
    }

    // Load Center Notices from PostgreSQL database (live sync)
    try {
      setNoticesLoading(true);
      const ntcRes = await getCenterNoticesAction();
      if (ntcRes.success && ntcRes.notices) {
        const forParents = ntcRes.notices.filter((n) => n.targetAudience !== "caregivers");
        setCenterNotices(forParents);
        setNoticesCount(forParents.length);
      } else {
        const fallback = store.getNotices().filter((n) => n.targetAudience !== "caregivers").map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          priority: n.priority,
          targetAudience: n.targetAudience,
          authorName: n.authorName,
          classroomId: null,
          publishedAt: n.publishedAt,
        }));
        setCenterNotices(fallback);
        setNoticesCount(fallback.length);
      }
    } catch {
      const fallback = store.getNotices().filter((n) => n.targetAudience !== "caregivers").map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        targetAudience: n.targetAudience,
        authorName: n.authorName,
        classroomId: null,
        publishedAt: n.publishedAt,
      }));
      setCenterNotices(fallback);
      setNoticesCount(fallback.length);
    } finally {
      setNoticesLoading(false);
    }

    setComplaintsCount(store.getComplaintsForParent(current.id).length);
  }, [loadAllChildData]);

  useEffect(() => {
    loadData();
    // Default leave date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setLeaveDate(tomorrow.toISOString().split("T")[0]);
  }, [loadData]);

  // Handle switching child (Multi-child support)
  const handleSelectChild = (child: ChildRecord) => {
    setSelectedChild(child);
    loadAllChildData(child);
  };

  // CRUD: Update Child Emergency Contacts & Special Instructions (WF-13)
  const handleSaveContactUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    setIsUpdatingContact(true);

    try {
      const res = await updateParentChildContactAction({
        childId: selectedChild.id,
        parentUserId: parentUser.id,
        emergencyContactName: editEmergencyName.trim(),
        emergencyContactPhone: editEmergencyPhone.trim(),
        specialCareInstructions: editSpecialCare.trim(),
      });

      if (res.success) {
        // Update local child state
        setSelectedChild({
          ...selectedChild,
          emergencyContactName: editEmergencyName.trim(),
          emergencyContactPhone: editEmergencyPhone.trim(),
        });
        if (medicalRecord) {
          setMedicalRecord({
            ...medicalRecord,
            specialCareInstructions: editSpecialCare.trim(),
          });
        }
        setGlobalBanner("Emergency contact and care instructions updated successfully.");
        setIsEditContactModalOpen(false);
        setTimeout(() => setGlobalBanner(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
    setIsUpdatingContact(false);
  };

  // CRUD: Request Child Leave / Excused Absence (WF-14)
  const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !leaveDate) return;
    setIsSubmittingLeave(true);

    try {
      const res = await requestChildLeaveAction({
        childId: selectedChild.id,
        parentUserId: parentUser.id,
        date: leaveDate,
        reason: leaveReason.trim(),
      });

      if (res.success) {
        setGlobalBanner(`Leave request submitted for ${selectedChild.name} on ${leaveDate}! Awaiting Caregiver or Administrator review.`);
        setIsLeaveModalOpen(false);
        fetchAttendanceHistory(selectedChild.id);
        setTimeout(() => setGlobalBanner(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmittingLeave(false);
  };

  // AI Guardian response simulation with live context and bilingual support (WF-12)
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
      let aiResponse = "";
      const lower = query.toLowerCase();

      if (aiLanguageMode === "bn") {
        if (lower.includes("খাবার") || lower.includes("খেয়েছে") || lower.includes("meal") || lower.includes("eat")) {
          aiResponse = `${selectedChild?.name || "আপনার সন্তান"} আজকের সকালের খাবার ও ফল আনন্দের সাথে সম্পূর্ণ খেয়েছে। পর্যাপ্ত পানি পান করেছে।`;
        } else if (lower.includes("ঘুম") || lower.includes("nap") || lower.includes("sleep")) {
          aiResponse = `দুপুরের ঘুমের তথ্য: প্রায় ১ ঘণ্টা ১৫ মিনিট শান্তভাবে ক্লাসরুমে ঘুমিয়েছে। ঘুম থেকে ওঠার পর মন ভালো ছিল।`;
        } else if (lower.includes("ডায়াপার") || lower.includes("diaper")) {
          aiResponse = `আজকে মোট ${liveFeed.todayDiaperCount} বার ডায়াপার পরিবর্তন করা হয়েছে এবং স্বাস্থ্যবিধি পর্যবেক্ষণ করা হয়েছে।`;
        } else {
          aiResponse = `${selectedChild?.name || "আপনার সন্তান"} আজকের দিনে ডে-কেয়ারে চমৎকার সময় কাটাচ্ছে। বন্ধুদের সাথে খেলাধুলায় অংশ নিয়েছে এবং মেজাজ ফুরফুরে রয়েছে।`;
        }
      } else {
        if (lower.includes("sleep") || lower.includes("nap")) {
          const napAct = liveFeed.activities.find((a) => a.activityType === "nap");
          aiResponse = napAct
            ? `Today's nap update: ${napAct.details}`
            : `${selectedChild?.name} had an afternoon rest time of about 1 hour 15 minutes. She woke up refreshed and joined circle play.`;
        } else if (lower.includes("eat") || lower.includes("meal") || lower.includes("food") || lower.includes("snack")) {
          const mealAct = liveFeed.activities.find((a) => a.activityType === "meal");
          aiResponse = mealAct
            ? `Today's meal record: ${mealAct.details}`
            : `She ate 100% of her morning fruits and allergen-safe oatmeal. Teacher noted she drank water and enjoyed the snack.`;
        } else if (lower.includes("diaper")) {
          aiResponse = `Diaper hygiene update: ${selectedChild?.name} has had ${liveFeed.todayDiaperCount} diaper changes recorded today by the caregiver.`;
        } else if (lower.includes("word") || lower.includes("speech") || lower.includes("said")) {
          const wordAct = liveFeed.activities.find((a) => a.details?.includes("New Word Spoken"));
          aiResponse = wordAct
            ? `Milestone alert! ${wordAct.details}`
            : `During morning storytime, ${selectedChild?.name} practiced multiple new vocabulary words with teacher guidance.`;
        } else if (lower.includes("mood") || lower.includes("feeling")) {
          const moodAct = liveFeed.activities.find((a) => a.activityType === "mood_note");
          aiResponse = moodAct
            ? `Mood observation: ${moodAct.details}`
            : `Her mood was rated 5/5 stars today. Cheerful, engaged, and cooperative during sensory play.`;
        } else {
          aiResponse = `Based on today's live classroom records for ${selectedChild?.name || "your child"}, she is having a wonderful day! ${
            liveFeed.todayDiaperCount > 0 ? `Her diaper has been changed ${liveFeed.todayDiaperCount} times today. ` : ""
          }Her mood has been cheerful and active throughout playtime.`;
        }
      }

      setChatMessages([
        ...newMessages,
        { sender: "ai" as const, text: aiResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setIsAiTyping(false);
    }, 600);
  };

  // Filtered media posts for gallery
  const filteredMedia = liveFeed.mediaPosts.filter((post) => {
    if (mediaTypeFilter === "photo") return post.mediaType === "photo";
    if (mediaTypeFilter === "video") return post.mediaType === "video";
    return true;
  });

  // Latest routines for quick overview
  const latestMeal = liveFeed.activities.find((a) => a.activityType === "meal");
  const latestNap = liveFeed.activities.find((a) => a.activityType === "nap");
  const latestNewWord = liveFeed.activities.find((a) => a.details?.includes("New Word Spoken"));
  const latestMood = liveFeed.activities.find((a) => a.activityType === "mood_note");

  // Caregiver authored notices & announcements
  const caregiverNotices = centerNotices.filter((n) =>
    n.authorRole === "caregiver" ||
    n.authorName?.toLowerCase().includes("caregiver") ||
    n.authorName?.toLowerCase().includes("teacher") ||
    n.authorName?.toLowerCase().includes("nusrat")
  );

  return (
    <AuthGuard allowedRoles={["parent"]}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Top Header & Navigation Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Welcome back, {parentUser.name}!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  Guardian
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm">
                Real-time routine feed, developmental milestones, media moments, and AI Guardian assistance.
              </p>
            </div>

            {/* Sub-Page Action Buttons & Child Picker */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => selectedChild && loadAllChildData(selectedChild)}
                disabled={liveFeedLoading}
                title="Refresh Live Data"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${liveFeedLoading ? "animate-spin" : ""}`} />
              </button>

              <Link
                href="/parent/notices"
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <BellRing className="w-4 h-4 text-blue-600" />
                Notices
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

              {/* Child Switcher (Multi-child support — WF-09) */}
              {parentChildren.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 px-1.5">Child:</span>
                  {parentChildren.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleSelectChild(child)}
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

          {/* Global Flash Banner */}
          {globalBanner && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{globalBanner}</span>
            </div>
          )}

          {selectedChild && (
            <>
              {/* ============================================================ */}
              {/* 🚨 HIGH-PRIORITY EMERGENCY ALERT BANNER */}
              {/* ============================================================ */}
              {liveFeed.emergencyAlerts.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-600 text-white shadow-lg space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-child text-base sm:text-lg font-extrabold tracking-wide">
                      <AlertTriangle className="w-6 h-6 text-amber-300 animate-bounce" />
                      <span>URGENT EMERGENCY ALERT FOR {selectedChild.name.toUpperCase()}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-rose-800 uppercase tracking-wider">
                      Immediate Action Required
                    </span>
                  </div>

                  {liveFeed.emergencyAlerts.map((alert) => (
                    <div key={alert.id} className="p-3.5 bg-rose-700/80 rounded-xl border border-rose-500 text-xs space-y-1">
                      <div className="font-extrabold text-white text-sm flex items-center gap-2">
                        <span>{alert.title}</span>
                        <span className="text-rose-200 text-[11px] font-mono font-normal">({alert.time})</span>
                      </div>
                      <p className="text-rose-100 leading-relaxed">{alert.description}</p>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-rose-200">
                      Caregivers are actively attending to your child. Daycare hotline:
                    </span>
                    <a
                      href="tel:+8801711223344"
                      className="px-3.5 py-1.5 rounded-lg bg-white text-rose-800 font-bold flex items-center gap-1.5 hover:bg-rose-50 transition-colors shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-rose-600" />
                      Call Center (+880 1711-223344)
                    </a>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* Prominent Allergy Safety Warning (REQ24, WF-09) */}
              {/* ============================================================ */}
              {selectedChild.allergyFlag && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-child text-sm font-extrabold text-rose-900 flex items-center gap-2">
                        <span>⚠️ Medical Alert: Severe Dietary Allergy Protocol on File</span>
                      </div>
                      <p className="text-xs text-rose-800 mt-0.5">
                        {medicalRecord?.allergies || "Severe Peanut & Dairy allergy registered. Epipen in nurse box."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("medical")}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex-shrink-0 cursor-pointer transition-colors"
                  >
                    View Medical File →
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* 4 Summary Stat Cards (Live Data Synced — WF-09) */}
              {/* ============================================================ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Attendance Status */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Attendance Status</span>
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700 capitalize">
                    {liveFeed.todayAttendance?.status || "Present"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {liveFeed.todayAttendance?.checkInTime
                      ? `Checked in at ${liveFeed.todayAttendance.checkInTime.substring(0, 5)}`
                      : "Checked in on schedule (08:30 AM)"}
                  </div>
                </div>

                {/* 2. Diaper Changes Counter */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Diaper Changes Today</span>
                    <Baby className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-extrabold text-purple-800">
                    {liveFeed.todayDiaperCount} {liveFeed.todayDiaperCount === 1 ? "Change" : "Changes"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {liveFeed.todayDiaperCount > 0 ? "Logged by caregiver today" : "Routine hygiene monitored"}
                  </div>
                </div>

                {/* 3. Daily Meal */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Today's Meal & Feeding</span>
                    <Utensils className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 truncate">
                    {latestMeal ? "Meal Logged" : "100% Eaten"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {latestMeal ? latestMeal.details : "Morning fruit & oatmeal finished"}
                  </div>
                </div>

                {/* 4. Nap Time */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Nap & Rest Time</span>
                    <Moon className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 truncate">
                    {latestNap ? `${latestNap.durationMinutes || 75} mins` : "1h 15m Rest"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {latestNap ? latestNap.details : "Quiet sleep in classroom crib"}
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* 📢 OFFICIAL DAYCARE NOTICES & ANNOUNCEMENTS SECTION */}
              {/* ============================================================ */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center">
                      <BellRing className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="font-child text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Center Notices & Announcements</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {centerNotices.length} Active
                        </span>
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-500">
                        Official updates, holiday schedules, and health advisories published by Daycare Administration.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("notices")}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 transition-colors border border-amber-200 cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5 text-amber-600" />
                      <span>View All Board Notices →</span>
                    </button>
                  </div>
                </div>

                {/* Latest Notices Grid */}
                {noticesLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Loading latest notices from center...</span>
                  </div>
                ) : centerNotices.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                    No active center notices currently published. All operations running on standard schedule.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {centerNotices.slice(0, 4).map((notice) => {
                      const isCaregiver =
                        notice.authorRole === "caregiver" ||
                        notice.authorName?.toLowerCase().includes("caregiver") ||
                        notice.authorName?.toLowerCase().includes("teacher") ||
                        notice.authorName?.toLowerCase().includes("nusrat");
                      return (
                        <div
                          key={notice.id}
                          className={`p-4 rounded-xl border transition-all space-y-2 ${
                            isCaregiver
                              ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/30"
                              : notice.priority === "urgent"
                              ? "bg-rose-50/50 border-rose-200"
                              : notice.priority === "holiday"
                              ? "bg-amber-50/50 border-amber-200"
                              : "bg-slate-50/70 border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <h3 className="font-child text-sm font-bold text-slate-900 leading-snug">
                                {notice.title}
                              </h3>
                              {isCaregiver && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Sparkles className="w-3 h-3 text-emerald-600" /> Caregiver Update
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                                notice.priority === "urgent"
                                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                                  : notice.priority === "holiday"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-blue-100 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {notice.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {notice.content}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                            <span>
                              {isCaregiver ? "Teacher: " : "By "}
                              <strong>{notice.authorName}</strong>
                            </span>
                            <span>{new Date(notice.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* Parent Navigation Tabs (Aligning with WF-09, WF-10, WF-13, WF-14) */}
              {/* ============================================================ */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Activity className="w-4 h-4" /> Daily Routine & AI Guardian
                </button>

                <button
                  onClick={() => setActiveTab("notices")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "notices"
                      ? "bg-amber-500 text-slate-950 shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <BellRing className="w-4 h-4 text-amber-600" /> Center Notices ({centerNotices.length})
                </button>

                <button
                  onClick={() => setActiveTab("gallery")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "gallery"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Camera className="w-4 h-4" /> Media Moments Gallery ({liveFeed.mediaPosts.length})
                </button>

                <button
                  onClick={() => setActiveTab("medical")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "medical"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <HeartPulse className="w-4 h-4" /> Medical Records & Health
                </button>

                <button
                  onClick={() => setActiveTab("attendance")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "attendance"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Calendar className="w-4 h-4" /> Attendance & Leave Request
                </button>
              </div>

              {/* ============================================================ */}
              {/* TAB 1: Overview & Routine Stream (WF-09, WF-12) */}
              {/* ============================================================ */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
                  {/* Left Col: Child Profile Card */}
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

                      {/* Quick Contact Info */}
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
                            <Baby className="w-3.5 h-3.5" /> Diaper Count:
                          </span>
                          <span className="font-bold text-purple-700">{liveFeed.todayDiaperCount} changes today</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> Emergency Phone:
                          </span>
                          <span className="font-mono font-bold text-slate-900">{selectedChild.emergencyContactPhone}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsEditContactModalOpen(true)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Update Emergency Contact
                      </button>
                    </div>

                    {/* Developmental Highlights */}
                    {(latestNewWord || latestMood) && (
                      <div className="space-y-3">
                        {latestNewWord && (
                          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">
                                🎉 Spoken Milestone
                              </div>
                              <div className="text-xs font-bold text-indigo-950 mt-0.5">
                                {latestNewWord.details}
                              </div>
                            </div>
                          </div>
                        )}

                        {latestMood && (
                          <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center flex-shrink-0">
                              <Smile className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold uppercase text-pink-700 tracking-wider">
                                😊 Caregiver Mood Note
                              </div>
                              <div className="text-xs font-bold text-pink-950 mt-0.5">
                                {latestMood.details}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Center & Right 2 Cols: AI Guardian Assistant + Routine Timeline */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* AI Guardian Interactive Chat Card (WF-12) */}
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
                                {aiLanguageMode === "en" ? "English Mode" : "বাংলা মোড"}
                              </span>
                            </h2>
                            <p className="text-xs text-slate-500">Ask natural questions about {selectedChild.name}'s daily routine</p>
                          </div>
                        </div>

                        {/* Bilingual Switcher (EI02, REQ35) */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => setAiLanguageMode("en")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              aiLanguageMode === "en" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500"
                            }`}
                          >
                            EN
                          </button>
                          <button
                            onClick={() => setAiLanguageMode("bn")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              aiLanguageMode === "bn" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500"
                            }`}
                          >
                            বাংলা
                          </button>
                        </div>
                      </div>

                      {/* Suggested Quick Prompt Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {aiLanguageMode === "en" ? (
                          <>
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
                              onClick={() => handleSendQuery("How many diaper changes were logged?")}
                              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              "How many diaper changes were logged?"
                            </button>
                            <button
                              onClick={() => handleSendQuery("What was her mood during playtime?")}
                              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              "What was her mood during playtime?"
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSendQuery("আজকে দুপুরে কেমন ঘুমিয়েছে?")}
                              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              "আজকে দুপুরে কেমন ঘুমিয়েছে?"
                            </button>
                            <button
                              onClick={() => handleSendQuery("সকালের খাবার কি সম্পূর্ণ খেয়েছে?")}
                              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              "সকালের খাবার কি সম্পূর্ণ খেয়েছে?"
                            </button>
                            <button
                              onClick={() => handleSendQuery("আজকে কতবার ডায়াপার পরিবর্তন হয়েছে?")}
                              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              "আজকে কতবার ডায়াপার পরিবর্তন হয়েছে?"
                            </button>
                          </>
                        )}
                      </div>

                      {/* Chat Box with Slider Bar */}
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 min-h-[200px] max-h-[260px] modal-scrollbar space-y-3">
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
                          placeholder={
                            aiLanguageMode === "en"
                              ? "Ask AI Guardian anything about your child's day..."
                              : "সন্তানের দিনের রুটিন সম্পর্কে যে কোনো প্রশ্ন লিখুন..."
                          }
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

                    {/* Caregiver Classroom Notices for this child */}
                    {caregiverNotices.length > 0 && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300/80 text-emerald-950 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-child text-sm font-extrabold text-emerald-900">
                            <BellRing className="w-4 h-4 text-emerald-600" />
                            <span>Caregiver Direct Notes & Classroom Bulletins</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 uppercase tracking-wider">
                            Live from Caregiver
                          </span>
                        </div>
                        <div className="space-y-2">
                          {caregiverNotices.slice(0, 3).map((cn) => (
                            <div key={cn.id} className="p-3.5 bg-white rounded-xl border border-emerald-200 text-xs space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">{cn.title}</span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {new Date(cn.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              </div>
                              <p className="text-slate-600 leading-relaxed text-xs">{cn.content}</p>
                              <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>Classroom Teacher: <strong>{cn.authorName}</strong></span>
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                  {cn.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Today's Classroom Routine Stream */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          Today's Classroom Routine Stream (Live from Teacher)
                        </h2>
                        <span className="text-xs text-slate-500">Live Database Sync</span>
                      </div>

                      {liveFeed.activities.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                          Routine activities for {selectedChild.name} will appear here as they are logged today.
                        </div>
                      ) : (
                        <div className="space-y-2.5 text-xs text-slate-700">
                          {liveFeed.activities.map((act) => {
                            const isEmergency = act.details?.includes("EMERGENCY ALERT");
                            return (
                              <div
                                key={act.id}
                                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                                  isEmergency
                                    ? "bg-rose-50 border-rose-300 text-rose-900"
                                    : "bg-slate-50 border-slate-100 text-slate-700"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                                    isEmergency
                                      ? "bg-rose-600 text-white"
                                      : act.activityType === "meal"
                                      ? "bg-amber-100 text-amber-700"
                                      : act.activityType === "nap"
                                      ? "bg-sky-100 text-sky-700"
                                      : act.activityType === "diaper_change"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {isEmergency ? (
                                    <ShieldAlert className="w-4 h-4" />
                                  ) : act.activityType === "meal" ? (
                                    <Utensils className="w-4 h-4" />
                                  ) : act.activityType === "nap" ? (
                                    <Moon className="w-4 h-4" />
                                  ) : act.activityType === "diaper_change" ? (
                                    <Baby className="w-4 h-4" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-900 text-xs capitalize">
                                      {isEmergency ? "🚨 Emergency Incident" : act.activityType.replace("_", " ")}
                                    </span>
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      {new Date(act.loggedAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <p className={`mt-0.5 ${isEmergency ? "text-rose-900 font-semibold" : "text-slate-600"}`}>
                                    {act.details}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: Media Moments Gallery (WF-10, REQ41) */}
              {/* ============================================================ */}
              {activeTab === "gallery" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-child text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-purple-600" />
                        Child Media Moments & Video Gallery
                      </h2>
                      <p className="text-xs text-slate-500">
                        Privacy-isolated visual timeline shared directly by teachers for {selectedChild.name} (REQ41).
                      </p>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setMediaTypeFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          mediaTypeFilter === "all" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        All ({liveFeed.mediaPosts.length})
                      </button>
                      <button
                        onClick={() => setMediaTypeFilter("photo")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          mediaTypeFilter === "photo" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" /> Photos
                      </button>
                      <button
                        onClick={() => setMediaTypeFilter("video")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                          mediaTypeFilter === "video" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600"
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" /> Videos
                      </button>
                    </div>
                  </div>

                  {filteredMedia.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                      <Camera className="w-8 h-8 mx-auto text-slate-300" />
                      <h4 className="font-child text-base font-bold text-slate-700">No media moments in this category</h4>
                      <p>Caregivers will capture and upload moments during classroom activities and playtime.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {filteredMedia.map((post) => (
                        <div
                          key={post.id}
                          className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
                        >
                          {post.mediaType === "video" ? (
                            <div className="relative aspect-video bg-black flex items-center justify-center">
                              <video
                                src={post.mediaUrl}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-contain"
                              />
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white flex items-center gap-1">
                                <Video className="w-3 h-3 text-purple-400" /> Video
                              </span>
                            </div>
                          ) : (
                            <div
                              onClick={() => setActiveLightboxMedia(post)}
                              className="relative aspect-video bg-slate-200 overflow-hidden cursor-pointer"
                            >
                              <img
                                src={post.mediaUrl}
                                alt={post.caption || "Child moment"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white flex items-center gap-1">
                                <Camera className="w-3 h-3 text-emerald-400" /> Photo
                              </span>
                            </div>
                          )}

                          <div className="p-3.5 space-y-1.5 bg-white border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                              {post.caption || "Classroom moment with friends"}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-50">
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {post.authorRole === "administrator" ? "Admin" : "Caregiver"}: {post.authorName || "Teacher"}
                              </span>
                              <span className="font-mono text-slate-400">
                                {new Date(post.capturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 3: Medical Records & Health Profile (WF-13, REQ21, REQ24) */}
              {/* ============================================================ */}
              {activeTab === "medical" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <HeartPulse className="w-5 h-5 text-rose-600" />
                        <h2 className="font-child text-xl font-bold text-slate-900">
                          Child Health Profile & Medical Records
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500">
                        Official health records for {selectedChild.name}. Medical instructions are synchronized with classroom caregivers and administrators.
                      </p>
                      {medicalRecord?.lastUpdatedByName && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Last updated by: <strong>{medicalRecord.lastUpdatedByName}</strong> ({medicalRecord.lastUpdatedByRole === "administrator" ? "Administrator" : "Caregiver"}) {medicalRecord.updatedAt ? `on ${new Date(medicalRecord.updatedAt).toLocaleDateString()}` : ""}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setIsEditContactModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" /> Update Emergency Contact & Care Notes
                    </button>
                  </div>

                  {/* Medical Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Allergy Details */}
                    <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-child text-sm font-bold text-rose-900 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          Dietary & Environmental Allergies
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          medicalRecord?.hasSevereAllergy ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {medicalRecord?.hasSevereAllergy ? "Severe Protocol" : "Mild / None"}
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed font-medium">
                        {medicalRecord?.allergies || (selectedChild.allergyFlag ? "Severe Peanut & Dairy allergy" : "No known severe allergies.")}
                      </p>
                    </div>

                    {/* 2. Special Care Instructions */}
                    <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-child text-sm font-bold text-amber-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          Caregiver Handling Instructions
                        </span>
                        <span className="text-[10px] font-bold text-amber-700">Staff Protocol</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        {medicalRecord?.specialCareInstructions || "Standard care guidelines. Ensure water bottle refilled."}
                      </p>
                    </div>

                    {/* 3. Chronic Conditions & Medications */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <span className="font-child text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Chronic Conditions & Prescribed Medication
                      </span>
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div>Conditions: <strong>{medicalRecord?.chronicConditions || "None recorded"}</strong></div>
                        <div>Medications: <strong>{medicalRecord?.medications || "None recorded"}</strong></div>
                      </div>
                    </div>

                    {/* 4. Pediatrician & Primary Care */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <span className="font-child text-sm font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        Primary Pediatrician Contact
                      </span>
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div>Doctor: <strong>{medicalRecord?.physicianName || "Dr. Anisur Rahman, MD"}</strong></div>
                        <div>Phone: <strong>{medicalRecord?.physicianContact || "+880 1712-998877"}</strong></div>
                        <div>Daycare Nurse Box: <strong>Cabinet A-102</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: Attendance History & Leave Request (WF-14, REQ16) */}
              {/* ============================================================ */}
              {activeTab === "attendance" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-child text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        Attendance History & Monthly Summary (WF-14)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Monthly presence percentage, daily logs, and excused absence requests for {selectedChild.name}.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsLeaveModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" /> Request Excused Leave / Absence
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  {attendanceSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <div className="text-[11px] font-bold text-blue-700 uppercase">Monthly Rate</div>
                        <div className="text-2xl font-extrabold text-blue-900 mt-1">
                          {attendanceSummary.attendanceRate}%
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="text-[11px] font-bold text-emerald-700 uppercase">Present Days</div>
                        <div className="text-2xl font-extrabold text-emerald-900 mt-1">
                          {attendanceSummary.presentCount}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <div className="text-[11px] font-bold text-amber-700 uppercase">Late Arrivals</div>
                        <div className="text-2xl font-extrabold text-amber-900 mt-1">
                          {attendanceSummary.lateCount}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                        <div className="text-[11px] font-bold text-purple-700 uppercase">Excused / Leave</div>
                        <div className="text-2xl font-extrabold text-purple-900 mt-1">
                          {attendanceSummary.excusedCount}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submitted Leave Requests Review Status (WF-14, REQ16) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    <div className="p-3.5 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        Submitted Leave Requests (Caregiver / Admin Approval Queue)
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Total Requests: {attendanceSummary?.leaveRequests?.length || 0}
                      </span>
                    </div>

                    {!attendanceSummary?.leaveRequests || attendanceSummary.leaveRequests.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No pending or reviewed leave requests for {selectedChild.name}. Use the button above to request an excused absence.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 bg-white">
                        {attendanceSummary.leaveRequests.map((req) => (
                          <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900">{req.date}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                                  req.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : req.status === "rejected"
                                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                                    : "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                                }`}>
                                  {req.status === "approved"
                                    ? "✓ Approved by Staff (Excused)"
                                    : req.status === "rejected"
                                    ? "✕ Rejected by Staff"
                                    : "⏳ Pending Caregiver/Admin Approval"}
                                </span>
                              </div>
                              <div className="text-slate-600">
                                <strong>Reason:</strong> {req.reason}
                              </div>
                              {req.reviewedByName && (
                                <div className="text-[11px] text-slate-500">
                                  Reviewed by: <strong>{req.reviewedByName}</strong> ({req.reviewedByRole})
                                  {req.reviewerNotes ? ` • Notes: ${req.reviewerNotes}` : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historical Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
                      <span>Daily Classroom Attendance Log (Last 30 Days)</span>
                      <span>Total: {attendanceSummary?.records.length || 0} Records</span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[350px] modal-scrollbar">
                      {attendanceSummary?.records.map((rec) => (
                        <div key={rec.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{rec.date}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  rec.status === "present"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : rec.status === "late"
                                    ? "bg-amber-100 text-amber-800"
                                    : rec.status === "excused"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {rec.status}
                              </span>
                              {rec.recordedByName && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  • Logged by {rec.recordedByName} ({rec.recordedByRole === "administrator" ? "Admin" : "Caregiver"})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {rec.notes || "Standard attendance record"}
                            </div>
                          </div>

                          <div className="text-right text-[11px] font-mono text-slate-600">
                            {rec.checkInTime ? `In: ${rec.checkInTime.substring(0, 5)}` : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 5: Full Center Notices Board View */}
              {/* ============================================================ */}
              {activeTab === "notices" && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Header & Filter Controls */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="font-child text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                          <BellRing className="w-6 h-6 text-amber-500" />
                          <span>Center Notices & Administrative Bulletins</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Official notifications directly broadcasted by Daycare Principal & Administration.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={loadData}
                          disabled={noticesLoading}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${noticesLoading ? "animate-spin" : ""}`} />
                          <span>Refresh Board</span>
                        </button>
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          {centerNotices.length} Total Notices
                        </span>
                      </div>
                    </div>

                    {/* Search and Priority Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={noticeSearchQuery}
                          onChange={(e) => setNoticeSearchQuery(e.target.value)}
                          placeholder="Search notice titles or keywords..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                        <span className="text-xs text-slate-500 font-semibold mr-1">Filter:</span>
                        {["all", "urgent", "holiday", "normal"].map((p) => (
                          <button
                            key={p}
                            onClick={() => setNoticePriorityFilter(p)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                              noticePriorityFilter === p
                                ? "bg-slate-900 text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notices List */}
                  <div className="space-y-4">
                    {centerNotices
                      .filter((n) => {
                        const matchesP = noticePriorityFilter === "all" || n.priority === noticePriorityFilter;
                        const matchesQ =
                          n.title.toLowerCase().includes(noticeSearchQuery.toLowerCase()) ||
                          n.content.toLowerCase().includes(noticeSearchQuery.toLowerCase());
                        return matchesP && matchesQ;
                      })
                      .map((notice) => {
                        const isCaregiverNotice =
                          notice.authorRole === "caregiver" ||
                          notice.authorName?.toLowerCase().includes("caregiver") ||
                          notice.authorName?.toLowerCase().includes("teacher") ||
                          notice.authorName?.toLowerCase().includes("nusrat");
                        return (
                          <div
                            key={notice.id}
                            className={`p-6 rounded-2xl border shadow-xs space-y-3 bg-white transition-all ${
                              isCaregiverNotice
                                ? "border-emerald-300 ring-1 ring-emerald-300/40 bg-emerald-50/10"
                                : notice.priority === "urgent"
                                ? "border-rose-300 ring-1 ring-rose-300/40"
                                : notice.priority === "holiday"
                                ? "border-amber-300 ring-1 ring-amber-300/40"
                                : "border-slate-200"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                    isCaregiverNotice
                                      ? "bg-emerald-500"
                                      : notice.priority === "urgent"
                                      ? "bg-rose-500 animate-ping"
                                      : notice.priority === "holiday"
                                      ? "bg-amber-500"
                                      : "bg-blue-500"
                                  }`}
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-child text-lg font-bold text-slate-900">
                                    {notice.title}
                                  </h3>
                                  {isCaregiverNotice && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Caregiver Bulletin
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold capitalize self-start sm:self-auto ${
                                  notice.priority === "urgent"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : notice.priority === "holiday"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-blue-100 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {notice.priority} Alert
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {notice.content}
                            </p>

                            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 gap-2">
                              <div className="flex items-center gap-2">
                                <span>
                                  {isCaregiverNotice ? "Classroom Teacher: " : "Published by "}
                                  <strong>{notice.authorName}</strong>
                                </span>
                                {notice.classroomName && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                                    {notice.classroomName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(notice.publishedAt).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {centerNotices.length === 0 && (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                        No center notices found.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* MODAL 1: Update Emergency Contact (CRUD: Update) */}
              {/* ============================================================ */}
              {isEditContactModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl relative animate-in fade-in max-h-[90vh] modal-scrollbar">
                    <button
                      onClick={() => setIsEditContactModalOpen(false)}
                      className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="mb-4">
                      <h3 className="font-child text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                        Update Emergency Contact & Care
                      </h3>
                      <p className="text-xs text-slate-500">
                        Modify emergency telephone numbers and care notes for {selectedChild.name}.
                      </p>
                    </div>

                    <form onSubmit={handleSaveContactUpdates} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={editEmergencyName}
                          onChange={(e) => setEditEmergencyName(e.target.value)}
                          placeholder="e.g. Farhana Ahmed (Mother)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Emergency Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={editEmergencyPhone}
                          onChange={(e) => setEditEmergencyPhone(e.target.value)}
                          placeholder="+880 1711-000000"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Special Caregiver Notes / Instructions</label>
                        <textarea
                          rows={3}
                          value={editSpecialCare}
                          onChange={(e) => setEditSpecialCare(e.target.value)}
                          placeholder="Special feeding, sleep preferences, or handling instructions..."
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsEditContactModalOpen(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingContact}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isUpdatingContact ? "Saving..." : "Save Updates"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* MODAL 2: Request Excused Leave / Absence (CRUD: Create) */}
              {/* ============================================================ */}
              {isLeaveModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl relative animate-in fade-in max-h-[90vh] modal-scrollbar">
                    <button
                      onClick={() => setIsLeaveModalOpen(false)}
                      className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="mb-4">
                      <h3 className="font-child text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        Request Excused Absence / Leave
                      </h3>
                      <p className="text-xs text-slate-500">
                        Notify daycare staff of upcoming sick leave, medical appointments, or family vacation. Caregivers and Administrators will review and approve your request.
                      </p>
                    </div>

                    <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Absence Date *</label>
                        <input
                          type="date"
                          required
                          value={leaveDate}
                          onChange={(e) => setLeaveDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Reason for Leave *</label>
                        <select
                          value={leaveReason}
                          onChange={(e) => setLeaveReason(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                        >
                          <option value="Doctor checkup & immunization">Doctor checkup & immunization</option>
                          <option value="Mild fever / recovering at home">Mild fever / recovering at home</option>
                          <option value="Family travel / vacation">Family travel / vacation</option>
                          <option value="Parent personal day off">Parent personal day off</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsLeaveModalOpen(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingLeave}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isSubmittingLeave ? "Submitting..." : "Submit Leave Request"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* MODAL 3: Lightbox Photo Viewer (WF-10) */}
              {/* ============================================================ */}
              {activeLightboxMedia && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="max-w-3xl w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] modal-scrollbar flex flex-col">
                    <button
                      onClick={() => setActiveLightboxMedia(null)}
                      className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="relative aspect-video bg-black flex items-center justify-center">
                      <img
                        src={activeLightboxMedia.mediaUrl}
                        alt="Classroom moment"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="p-4 space-y-2 bg-slate-950">
                      <p className="text-sm font-semibold text-slate-100">
                        {activeLightboxMedia.caption || "Classroom moment captured by caregiver"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>Captured for {selectedChild.name}</span>
                        <span>{new Date(activeLightboxMedia.capturedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
