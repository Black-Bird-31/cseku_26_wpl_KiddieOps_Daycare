"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
  RefreshCw,
  Sparkles,
  Smile,
  BookOpen,
  Gamepad2,
  X,
  ChevronDown,
  UserPlus,
  Edit2,
  Trash2,
  PlusCircle,
  Search,
  Users,
  Video,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import ClockTimePicker from "@/components/ui/ClockTimePicker";
import { getStoredUser } from "@/lib/auth-client";
import { 
  getCaregiverDashboardDataAction, 
  logActivityAction,
  logStudentRoutineAction,
  sendStudentEmergencyAlertAction,
  createChildMediaPostAction,
  caregiverCreateChildAction,
  caregiverUpdateChildAction,
  caregiverDeleteChildAction,
  CaregiverChildItem,
  ActivityLogItem,
  CaregiverDashboardData
} from "@/lib/actions/caregiver";
import CloudinaryUploader from "@/components/ui/CloudinaryUploader";

// Predefined checkbox options for routine forms
const MEAL_ITEMS_OPTIONS = [
  "Khichuri / Rice",
  "Fresh Fruit Slices (Banana/Apple)",
  "Warm Milk / Formula",
  "Steamed Vegetables",
  "Oatmeal / Porridge",
  "Healthy Finger Biscuit",
];

const MEAL_OBSERVATION_OPTIONS = [
  "Ate cheerfully & finished all",
  "Allergen-free protocol verified",
  "Drank water independently",
  "Needed caregiver assistance",
  "Healthy appetite, asked for more",
  "Slow eater / gentle encouragement needed",
];

const NAP_OBSERVATION_OPTIONS = [
  "Restful & deep sleep",
  "Fell asleep quickly with soft lullaby",
  "Woke up cheerful and refreshed",
  "Crib / cot safety checked",
  "Needed extra rocking / soothing",
  "Restless sleep / woke up once",
];

const DIAPER_OBSERVATION_OPTIONS = [
  "Skin clean, healthy & dry",
  "Barrier cream / rash balm applied",
  "Fresh diaper & clothes changed",
  "Routine hygiene check completed",
  "Hands washed & sanitized",
  "Mild redness observed (monitoring)",
];

const WORD_CONTEXT_OPTIONS = [
  "Story time / Picture book reading",
  "Circle time & singing songs",
  "Free play with classmates",
  "Snack / Lunch time conversation",
  "Outdoor play & garden discovery",
  "Pointing at flashcards / toys",
];

const WORD_OBSERVATION_OPTIONS = [
  "Pronounced clearly with distinct syllables",
  "Repeated enthusiastically after caregiver",
  "Smiled and clapped hands with joy",
  "Spoke spontaneously without prompting",
  "Combined word with gestures / pointing",
];

const MOOD_OBSERVATION_OPTIONS = [
  "Cheerful, smiling & highly engaged",
  "Shared toys kindly with peers",
  "Attentive during sensory activities",
  "Calm, content & cooperative",
  "Needed extra comforting & hugs",
  "Sleepy / low energy today",
];

const MOMENT_CAPTION_OPTIONS = [
  "Happy smiles during creative play! 🎨",
  "Outdoor playground adventures & sunshine! ☀️",
  "Circle time magic with stories and songs! 🎶",
  "Delicious & healthy snack time together! 🍎",
  "Proud milestone achievement today! ⭐",
  "Creative building and sensory exploration! 🧩",
];

export default function CaregiverDashboardPage() {
  const [data, setData] = useState<CaregiverDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Tab switcher: routines vs children CRUD
  const [activeTab, setActiveTab] = useState<"routines" | "children">("routines");
  const [childSearchQuery, setChildSearchQuery] = useState("");

  // Modals: meal, nap, diaper, word, mood, emergency, photo/video, activity
  const [activeModal, setActiveModal] = useState<
    "meal" | "nap" | "diaper" | "word" | "mood" | "emergency" | "photo" | "activity" | null
  >(null);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Child CRUD states
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<CaregiverChildItem | null>(null);
  const [deletingChild, setDeletingChild] = useState<CaregiverChildItem | null>(null);
  const [isSubmittingChild, setIsSubmittingChild] = useState(false);

  // Child Form Data State
  const [childFormData, setChildFormData] = useState<{
    name: string;
    dateOfBirth: string;
    classroomId: string;
    allergyFlag: boolean;
    allergyDetails: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    avatarUrl: string;
  }>({
    name: "",
    dateOfBirth: "2023-06-15",
    classroomId: "",
    allergyFlag: false,
    allergyDetails: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    avatarUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
  });

  // Routine Form States for each specific routine type
  const [targetChildId, setTargetChildId] = useState<string>("");

  // Meal Form Checkboxes & States
  const [mealForm, setMealForm] = useState({
    mealTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    portionEaten: "100% (Finished all)",
  });
  const [mealSelectedItems, setMealSelectedItems] = useState<string[]>([
    "Oatmeal / Porridge",
    "Fresh Fruit Slices (Banana/Apple)",
  ]);
  const [mealCustomItem, setMealCustomItem] = useState("");
  const [mealShowCustomItem, setMealShowCustomItem] = useState(false);
  const [mealSelectedObservations, setMealSelectedObservations] = useState<string[]>([
    "Ate cheerfully & finished all",
    "Allergen-free protocol verified",
  ]);
  const [mealCustomObservation, setMealCustomObservation] = useState("");
  const [mealShowCustomObservation, setMealShowCustomObservation] = useState(false);

  // Nap Form Checkboxes & States
  const [napForm, setNapForm] = useState({
    napStartTime: "01:00 PM",
    napEndTime: "02:15 PM",
    napDurationMinutes: 75,
    napQuality: "Restful & deep sleep",
  });
  const [napSelectedObservations, setNapSelectedObservations] = useState<string[]>([
    "Restful & deep sleep",
    "Fell asleep quickly with soft lullaby",
  ]);
  const [napCustomObservation, setNapCustomObservation] = useState("");
  const [napShowCustomObservation, setNapShowCustomObservation] = useState(false);

  // Diaper Form Checkboxes & States
  const [diaperForm, setDiaperForm] = useState({
    diaperTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    diaperType: "wet" as "wet" | "soiled" | "both" | "dry",
  });
  const [diaperSelectedObservations, setDiaperSelectedObservations] = useState<string[]>([
    "Skin clean, healthy & dry",
    "Barrier cream / rash balm applied",
  ]);
  const [diaperCustomObservation, setDiaperCustomObservation] = useState("");
  const [diaperShowCustomObservation, setDiaperShowCustomObservation] = useState(false);

  // New Word Form Checkboxes & States
  const [wordForm, setWordForm] = useState({
    wordSpoken: "",
    wordTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
  const [wordSelectedContexts, setWordSelectedContexts] = useState<string[]>([
    "Story time / Picture book reading",
  ]);
  const [wordCustomContext, setWordCustomContext] = useState("");
  const [wordShowCustomContext, setWordShowCustomContext] = useState(false);
  const [wordSelectedObservations, setWordSelectedObservations] = useState<string[]>([
    "Pronounced clearly with distinct syllables",
    "Smiled and clapped hands with joy",
  ]);
  const [wordCustomObservation, setWordCustomObservation] = useState("");
  const [wordShowCustomObservation, setWordShowCustomObservation] = useState(false);

  // Mood Form Checkboxes & States
  const [moodForm, setMoodForm] = useState({
    moodState: "Cheerful & Engaged",
    moodRating: 5,
  });
  const [moodSelectedObservations, setMoodSelectedObservations] = useState<string[]>([
    "Cheerful, smiling & highly engaged",
    "Shared toys kindly with peers",
  ]);
  const [moodCustomObservation, setMoodCustomObservation] = useState("");
  const [moodShowCustomObservation, setMoodShowCustomObservation] = useState(false);

  // Emergency Alert Form
  const [emergencyForm, setEmergencyForm] = useState({
    alertType: "medical" as "medical" | "allergy" | "injury" | "fever" | "urgent_pickup" | "other",
    title: "",
    description: "",
    actionTaken: "Isolated child to quiet care room, provided comforting hydration, and called parent.",
  });

  // Moments (Photo/Video) Form Checkboxes & States
  const [momentType, setMomentType] = useState<"photo" | "video">("photo");
  const [momentSelectedCaptions, setMomentSelectedCaptions] = useState<string[]>([
    "Happy smiles during creative play! 🎨",
  ]);
  const [momentCustomCaption, setMomentCustomCaption] = useState("");
  const [momentShowCustomCaption, setMomentShowCustomCaption] = useState(false);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);

  // General Activity Log Form
  const [routineForm, setRoutineForm] = useState<{
    activityType: "meal" | "nap" | "diaper_change" | "learning_activity" | "play_activity" | "mood_note" | "other";
    details: string;
    moodRating: number;
    durationMinutes: number;
  }>({
    activityType: "meal",
    details: "",
    moodRating: 5,
    durationMinutes: 20,
  });

  // Checkbox toggle utility
  const toggleCheckbox = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  // Load Dashboard Data from PostgreSQL
  const loadDashboard = useCallback(async (classroomId?: string) => {
    setLoading(true);
    const currentUser = getStoredUser();
    const effectiveRoomId = classroomId !== undefined ? classroomId : (selectedClassroomId || "all");
    const res = await getCaregiverDashboardDataAction(currentUser?.id, effectiveRoomId);

    if (res.success) {
      setData(res);
      if (effectiveRoomId) {
        setSelectedClassroomId(effectiveRoomId);
      } else if (res.activeClassroom?.id) {
        setSelectedClassroomId(res.activeClassroom.id);
      }

      // Select first child by default or keep current if still in room
      setSelectedChildId((prev) => {
        const stillInRoom = res.children.some((c) => c.id === prev);
        const nextId = stillInRoom ? prev : (res.children[0]?.id || null);
        setTargetChildId(nextId || "");
        return nextId;
      });
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to load database records." });
    }
    setLoading(false);
  }, [selectedClassroomId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const selectedChild = data?.children.find((c) => c.id === selectedChildId) || data?.children[0] || null;

  // Sync targetChildId when selectedChild changes
  useEffect(() => {
    if (selectedChild) {
      setTargetChildId(selectedChild.id);
    }
  }, [selectedChild]);

  // Handle Quick 1-Tap Log
  const handleQuickLog = async (
    activityType: "meal" | "nap" | "play_activity" | "learning_activity",
    details: string
  ) => {
    if (!selectedChild) return;
    const currentUser = getStoredUser();

    const res = await logActivityAction({
      childId: selectedChild.id,
      activityType,
      details,
      moodRating: 5,
      durationMinutes: activityType === "nap" ? 90 : 25,
      loggedByUserId: currentUser?.id,
    });

    if (res.success) {
      setFeedbackMessage({
        type: "success",
        text: `Successfully logged ${activityType.replace("_", " ")} for ${selectedChild.name}!`,
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to record activity." });
    }
  };

  // 1. Submit Meal Routine Log
  const handleSubmitMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const childId = targetChildId || selectedChild?.id;
    if (!childId) return;

    setIsSaving(true);
    const currentUser = getStoredUser();

    const finalMealItems = [
      ...mealSelectedItems,
      ...(mealShowCustomItem && mealCustomItem.trim() ? [mealCustomItem.trim()] : []),
    ].join(", ") || "Nutritious balanced meal";

    const finalMealObservations = [
      ...mealSelectedObservations,
      ...(mealShowCustomObservation && mealCustomObservation.trim() ? [mealCustomObservation.trim()] : []),
    ].join(". ");

    const res = await logStudentRoutineAction({
      childId,
      caregiverUserId: currentUser?.id,
      routineType: "meal",
      mealTime: mealForm.mealTime,
      mealItems: finalMealItems,
      portionEaten: mealForm.portionEaten,
      observations: finalMealObservations,
    });
    setIsSaving(false);

    if (res.success) {
      setActiveModal(null);
      setFeedbackMessage({
        type: "success",
        text: `Meal log saved for student! Synced with parent portal.`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to save meal routine." });
    }
  };

  // 2. Submit Nap Routine Log
  const handleSubmitNap = async (e: React.FormEvent) => {
    e.preventDefault();
    const childId = targetChildId || selectedChild?.id;
    if (!childId) return;

    setIsSaving(true);
    const currentUser = getStoredUser();

    const finalNapObservations = [
      ...napSelectedObservations,
      ...(napShowCustomObservation && napCustomObservation.trim() ? [napCustomObservation.trim()] : []),
    ].join(". ");

    const res = await logStudentRoutineAction({
      childId,
      caregiverUserId: currentUser?.id,
      routineType: "nap",
      napStartTime: napForm.napStartTime,
      napEndTime: napForm.napEndTime,
      napDurationMinutes: napForm.napDurationMinutes,
      napQuality: napForm.napQuality,
      observations: finalNapObservations,
    });
    setIsSaving(false);

    if (res.success) {
      setActiveModal(null);
      setFeedbackMessage({
        type: "success",
        text: `Nap time logged (${napForm.napDurationMinutes} mins). Synced with database!`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to save nap routine." });
    }
  };

  // 3. Submit Diaper Change Log
  const handleSubmitDiaper = async (e: React.FormEvent) => {
    e.preventDefault();
    const childId = targetChildId || selectedChild?.id;
    if (!childId) return;

    setIsSaving(true);
    const currentUser = getStoredUser();

    const finalDiaperObservations = [
      ...diaperSelectedObservations,
      ...(diaperShowCustomObservation && diaperCustomObservation.trim() ? [diaperCustomObservation.trim()] : []),
    ].join(". ");

    const res = await logStudentRoutineAction({
      childId,
      caregiverUserId: currentUser?.id,
      routineType: "diaper_change",
      diaperTime: diaperForm.diaperTime,
      diaperType: diaperForm.diaperType,
      observations: finalDiaperObservations,
    });
    setIsSaving(false);

    if (res.success) {
      setActiveModal(null);
      setFeedbackMessage({
        type: "success",
        text: `Diaper change logged! Total changes today: ${res.todayDiaperCount ?? "Updated"}.`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to log diaper change." });
    }
  };

  // 4. Submit New Word Milestone
  const handleSubmitWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const childId = targetChildId || selectedChild?.id;
    if (!childId) return;
    if (!wordForm.wordSpoken.trim()) {
      setFeedbackMessage({ type: "error", text: "Please enter the word spoken by the child." });
      return;
    }

    setIsSaving(true);
    const currentUser = getStoredUser();

    const finalWordContext = [
      ...wordSelectedContexts,
      ...(wordShowCustomContext && wordCustomContext.trim() ? [wordCustomContext.trim()] : []),
    ].join(", ") || "Classroom interaction";

    const finalWordObservations = [
      ...wordSelectedObservations,
      ...(wordShowCustomObservation && wordCustomObservation.trim() ? [wordCustomObservation.trim()] : []),
    ].join(". ");

    const res = await logStudentRoutineAction({
      childId,
      caregiverUserId: currentUser?.id,
      routineType: "new_word",
      wordSpoken: wordForm.wordSpoken.trim(),
      wordContext: finalWordContext,
      wordTime: wordForm.wordTime,
      observations: finalWordObservations,
    });
    setIsSaving(false);

    if (res.success) {
      setActiveModal(null);
      setWordForm((prev) => ({ ...prev, wordSpoken: "" }));
      setFeedbackMessage({
        type: "success",
        text: `New word milestone recorded for parents to celebrate! 🎉`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to log new word." });
    }
  };

  // 5. Submit Child Mood Observation
  const handleSubmitMood = async (e: React.FormEvent) => {
    e.preventDefault();
    const childId = targetChildId || selectedChild?.id;
    if (!childId) return;

    setIsSaving(true);
    const currentUser = getStoredUser();

    const finalMoodObservations = [
      ...moodSelectedObservations,
      ...(moodShowCustomObservation && moodCustomObservation.trim() ? [moodCustomObservation.trim()] : []),
    ].join(". ");

    const res = await logStudentRoutineAction({
      childId,
      caregiverUserId: currentUser?.id,
      routineType: "mood",
      moodState: moodForm.moodState,
      moodRating: moodForm.moodRating,
      observations: finalMoodObservations,
    });
    setIsSaving(false);

    if (res.success) {
      setActiveModal(null);
      setFeedbackMessage({
        type: "success",
        text: `Mood observation recorded successfully!`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to record mood observation." });
    }
  };

  // 6. Submit Urgent Emergency Alert
  const handleSubmitEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    const child = data?.children.find((c) => c.id === (targetChildId || selectedChild?.id));
    if (!child) return;
    if (!emergencyForm.title.trim() || !emergencyForm.description.trim()) {
      setFeedbackMessage({ type: "error", text: "Alert title and description are required." });
      return;
    }

    setIsSaving(true);
    const currentUser = getStoredUser();
    const res = await sendStudentEmergencyAlertAction({
      childId: child.id,
      childName: child.name,
      caregiverUserId: currentUser?.id,
      classroomId: selectedClassroomId === "all" ? undefined : selectedClassroomId,
      alertType: emergencyForm.alertType,
      title: emergencyForm.title.trim(),
      description: emergencyForm.description.trim(),
      actionTaken: emergencyForm.actionTaken.trim(),
    });
    setIsSaving(false);

    if (res.success) {
      setActiveModal(null);
      setEmergencyForm({
        alertType: "medical",
        title: "",
        description: "",
        actionTaken: "Isolated child to quiet care room, provided comforting hydration, and called parent.",
      });
      setFeedbackMessage({
        type: "success",
        text: `🚨 Urgent Emergency Alert dispatched to parents and logged in medical records!`,
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to dispatch emergency alert." });
    }
  };

  // 7. Submit Photo / Video Classroom Moment
  const handleSubmitMediaMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedMediaUrl) {
      setFeedbackMessage({ type: "error", text: "Please upload a photo or video first." });
      return;
    }

    const childId = targetChildId || selectedChild?.id;
    if (!childId) return;

    setIsSaving(true);
    const currentUser = getStoredUser();

    const finalCaption = [
      ...momentSelectedCaptions,
      ...(momentShowCustomCaption && momentCustomCaption.trim() ? [momentCustomCaption.trim()] : []),
    ].join(". ") || `Classroom ${momentType} moment`;

    const res = await createChildMediaPostAction({
      childId,
      classroomId: selectedClassroomId === "all" ? undefined : selectedClassroomId,
      caregiverUserId: currentUser?.id,
      mediaUrl: uploadedMediaUrl,
      mediaAssetId: uploadedAssetId || undefined,
      mediaType: momentType,
      caption: finalCaption,
    });

    setIsSaving(false);

    if (res.success) {
      setActiveModal(null);
      setUploadedMediaUrl(null);
      setMomentCustomCaption("");
      setFeedbackMessage({
        type: "success",
        text: `Classroom ${momentType} moment shared with parents!`,
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to publish moment." });
    }
  };

  // 8. Submit Generic Activity
  const handleSubmitGenericActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const childId = targetChildId || selectedChild?.id;
    if (!childId || !routineForm.details.trim()) {
      setFeedbackMessage({ type: "error", text: "Please enter activity details." });
      return;
    }

    setIsSaving(true);
    const currentUser = getStoredUser();
    const res = await logActivityAction({
      childId,
      activityType: routineForm.activityType,
      details: routineForm.details.trim(),
      moodRating: routineForm.moodRating,
      durationMinutes: routineForm.durationMinutes,
      loggedByUserId: currentUser?.id,
    });
    setIsSaving(false);

    if (res.success) {
      setActiveModal(null);
      setRoutineForm({
        activityType: "meal",
        details: "",
        moodRating: 5,
        durationMinutes: 20,
      });
      setFeedbackMessage({ type: "success", text: "Routine activity saved to database!" });
      setTimeout(() => setFeedbackMessage(null), 4000);
      loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to save activity log." });
    }
  };

  // Helper icons
  const getActivityIcon = (type: string, details?: string | null) => {
    if (details?.includes("EMERGENCY ALERT")) {
      return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    }
    switch (type) {
      case "meal":
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case "nap":
        return <Moon className="w-4 h-4 text-sky-600" />;
      case "diaper_change":
        return <Baby className="w-4 h-4 text-purple-600" />;
      case "learning_activity":
        return details?.includes("New Word Spoken") ? (
          <MessageSquare className="w-4 h-4 text-indigo-600" />
        ) : (
          <BookOpen className="w-4 h-4 text-indigo-600" />
        );
      case "play_activity":
        return <Gamepad2 className="w-4 h-4 text-emerald-600" />;
      case "mood_note":
        return <Smile className="w-4 h-4 text-pink-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActivityBg = (type: string, details?: string | null) => {
    if (details?.includes("EMERGENCY ALERT")) {
      return "bg-rose-100 text-rose-800 border border-rose-300";
    }
    switch (type) {
      case "meal": return "bg-amber-100 text-amber-800";
      case "nap": return "bg-sky-100 text-sky-800";
      case "diaper_change": return "bg-purple-100 text-purple-800";
      case "learning_activity": return "bg-indigo-100 text-indigo-800";
      case "play_activity": return "bg-emerald-100 text-emerald-800";
      case "mood_note": return "bg-pink-100 text-pink-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const calculateAge = (dob: string) => {
    try {
      const birth = new Date(dob);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      if (months < 0) {
        years--;
        months += 12;
      }
      if (years > 0) return `${years}y ${months}m`;
      return `${months}m`;
    } catch {
      return "Toddler";
    }
  };

  const handleOpenAddChild = () => {
    setChildFormData({
      name: "",
      dateOfBirth: "2023-06-15",
      classroomId: selectedClassroomId || data?.classrooms[0]?.id || "",
      allergyFlag: false,
      allergyDetails: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      avatarUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
    });
    setIsAddChildModalOpen(true);
  };

  const handleOpenEditChild = (child: CaregiverChildItem) => {
    setEditingChild(child);
    setChildFormData({
      name: child.name,
      dateOfBirth: child.dateOfBirth,
      classroomId: child.classroomId || selectedClassroomId || "",
      allergyFlag: child.allergyFlag,
      allergyDetails: child.allergyFlag ? "Known food or environmental allergy (care protocol active)" : "",
      emergencyContactName: child.emergencyContactName || "",
      emergencyContactPhone: child.emergencyContactPhone || "",
      avatarUrl: child.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
    });
  };

  const handleCreateChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childFormData.name.trim() || !childFormData.emergencyContactName.trim() || !childFormData.emergencyContactPhone.trim()) {
      setFeedbackMessage({ type: "error", text: "Child name and emergency contact details are mandatory." });
      return;
    }

    setIsSubmittingChild(true);
    const currentUser = getStoredUser();
    const res = await caregiverCreateChildAction(currentUser?.id, childFormData);
    setIsSubmittingChild(false);

    if (res.success) {
      setIsAddChildModalOpen(false);
      setFeedbackMessage({ type: "success", text: `Child "${childFormData.name}" enrolled successfully into classroom!` });
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to enroll child." });
    }
  };

  const handleEditChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    if (!childFormData.name.trim() || !childFormData.emergencyContactName.trim() || !childFormData.emergencyContactPhone.trim()) {
      setFeedbackMessage({ type: "error", text: "Child name and emergency contact details are mandatory." });
      return;
    }

    setIsSubmittingChild(true);
    const currentUser = getStoredUser();
    const res = await caregiverUpdateChildAction(currentUser?.id, editingChild.id, childFormData);
    setIsSubmittingChild(false);

    if (res.success) {
      setEditingChild(null);
      setFeedbackMessage({ type: "success", text: `Child profile for "${childFormData.name}" updated successfully!` });
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadDashboard();
    } else {
      setFeedbackMessage({ type: "error", text: res.error || "Failed to update child profile." });
    }
  };

  const handleDeleteChildConfirm = async () => {
    if (!deletingChild) return;
    setIsSubmittingChild(true);

    const targetId = deletingChild.id;
    const targetName = deletingChild.name;
    const currentUser = getStoredUser();
    const res = await caregiverDeleteChildAction(currentUser?.id, targetId);
    setIsSubmittingChild(false);

    if (res.success) {
      setData((prev) => {
        if (!prev) return null;
        const updated = prev.children.filter((c) => c.id !== targetId);
        return {
          ...prev,
          children: updated,
          stats: {
            ...prev.stats,
            totalChildren: updated.length,
          },
        };
      });
      setDeletingChild(null);
      setFeedbackMessage({ type: "success", text: `Child record for "${targetName}" has been permanently removed.` });
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadDashboard();
    } else {
      alert(res.error || "Failed to remove child.");
    }
  };

  return (
    <AuthGuard allowedRoles={["caregiver", "administrator"]}>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Top Caregiver Header with Dynamic DB Classroom Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                {/* Classroom Selector */}
                <div className="relative inline-block">
                  <select
                    value={selectedClassroomId || "all"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedClassroomId(val);
                      loadDashboard(val);
                    }}
                    className="font-child text-2xl sm:text-3xl font-extrabold text-slate-900 bg-transparent pr-8 cursor-pointer border-b-2 border-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">All Classrooms (All Ages)</option>
                    {data?.classrooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.ageRange || "All ages"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Count Badge */}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {data?.stats.presentCount ?? 0} / {data?.children.length ?? 0} PRESENT TODAY
                </span>

                {data?.stats.lateCount ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {data.stats.lateCount} LATE
                  </span>
                ) : null}

                {data?.stats.absentCount ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {data.stats.absentCount} ABSENT
                  </span>
                ) : null}
              </div>

              <p className="text-slate-500 text-xs sm:text-sm">
                Caregiver: <strong>{data?.caregiver?.name || "Nusrat Jahan"}</strong> · Contact:{" "}
                <span className="font-mono">{data?.caregiver?.contactPhone || "+880 1711-223344"}</span> · Age:{" "}
                {selectedClassroomId === "all" ? "All Age Groups" : (data?.activeClassroom?.ageRange || "18m – 3y")}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => loadDashboard()}
                disabled={loading}
                title="Refresh database records"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <Link
                href="/caregiver/attendance"
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Attendance Sheet</span>
              </Link>

              <button
                onClick={() => {
                  setTargetChildId(selectedChild?.id || data?.children[0]?.id || "");
                  setActiveModal("photo");
                }}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Share Moment</span>
              </button>

              <button
                onClick={() => {
                  setTargetChildId(selectedChild?.id || data?.children[0]?.id || "");
                  setActiveModal("emergency");
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>🚨 Emergency Alert</span>
              </button>

              <button
                onClick={handleOpenAddChild}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Enroll Child</span>
              </button>
            </div>
          </div>

          {/* Feedback Alert Banner */}
          {feedbackMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs transition-all ${
                feedbackMessage.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedbackMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
              <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Tabs between Daily Routines & Children Management */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("routines")}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "routines"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Student Daily Routines & Observations</span>
              </button>
              <button
                onClick={() => setActiveTab("children")}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "children"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Baby className="w-4 h-4" />
                <span>Children Roster & Management ({data?.children.length || 0})</span>
              </button>
            </div>

            {activeTab === "children" && (
              <button
                onClick={handleOpenAddChild}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add / Enroll New Child</span>
              </button>
            )}
          </div>

          {/* Main Content Area */}
          {activeTab === "routines" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left 2 Columns: Attendance Overview Widget & Dynamic Activity Timeline */}
              <div className="lg:col-span-2 space-y-6">

                {/* 1. Daily Attendance Overview Widget (Linked to dedicated Attendance Page) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="font-child text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        Daily Attendance Status Overview
                      </h2>
                      <p className="text-xs text-slate-500">
                        Attendance management is located on the dedicated page to keep routines focused.
                      </p>
                    </div>

                    <Link
                      href="/caregiver/attendance"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <span>Manage Daily Attendance Sheet</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Attendance Snapshot Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] font-bold uppercase text-emerald-700">Present Today</div>
                      <div className="text-xl font-extrabold text-emerald-900 mt-0.5">
                        {data?.stats.presentCount || 0} Children
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="text-[10px] font-bold uppercase text-amber-700">Late Arrival</div>
                      <div className="text-xl font-extrabold text-amber-900 mt-0.5">
                        {data?.stats.lateCount || 0} Children
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                      <div className="text-[10px] font-bold uppercase text-rose-700">Absent</div>
                      <div className="text-xl font-extrabold text-rose-900 mt-0.5">
                        {data?.stats.absentCount || 0} Children
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Total Enrolled</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                        {data?.children.length || 0} Children
                      </div>
                    </div>
                  </div>

                  {/* Quick Student Attendance Strip */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
                      Classroom Students:
                    </span>
                    {!data?.children || data.children.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No students enrolled in this classroom view</span>
                    ) : (
                      data.children.map((child) => {
                        const isSelected = selectedChild?.id === child.id;
                        const status = child.attendance?.status || "present";
                        return (
                          <button
                            key={child.id}
                            onClick={() => setSelectedChildId(child.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                status === "present"
                                  ? "bg-emerald-500"
                                  : status === "late"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            <span>{child.name.split(" ")[0]}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. Dynamic Routine Activity Timeline (Live PostgreSQL activity_logs) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-child text-base font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Classroom Routine Timeline & Live Activity Feed
                      </h2>
                      <p className="text-xs text-slate-500">
                        All logged meals, naps, diaper changes, new words, and mood updates appear here in real-time.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setTargetChildId(selectedChild?.id || data?.children[0]?.id || "");
                        setActiveModal("activity");
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Custom Log</span>
                    </button>
                  </div>

                  {data?.recentActivities.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No routine activities recorded yet today. Use the logging buttons on the right to log meals, naps, diapers, or new words!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data?.recentActivities.map((act) => {
                        const isEmergency = act.details?.includes("EMERGENCY ALERT");
                        return (
                          <div
                            key={act.id}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                              isEmergency
                                ? "bg-rose-50/90 border-rose-300 ring-1 ring-rose-400"
                                : "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${getActivityBg(
                                  act.activityType,
                                  act.details
                                )}`}
                              >
                                {getActivityIcon(act.activityType, act.details)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {act.childName}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      isEmergency
                                        ? "bg-rose-600 text-white"
                                        : "bg-white border border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {isEmergency ? "URGENT ALERT" : act.activityType.replace("_", " ")}
                                  </span>
                                  {act.moodRating && !isEmergency ? (
                                    <span className="text-[10px] text-amber-600 font-bold">
                                      {"★".repeat(act.moodRating)}
                                    </span>
                                  ) : null}
                                </div>
                                <div className={`text-xs mt-0.5 ${isEmergency ? "text-rose-900 font-semibold" : "text-slate-600"}`}>
                                  {act.details}
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 text-[11px] text-slate-400 font-mono">
                              {new Date(act.loggedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Selected Child Details & Dedicated Routine Logging Actions */}
              <div className="space-y-6">
                {selectedChild ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                    <div className="text-center space-y-2">
                      <div className="relative inline-block">
                        <img
                          src={selectedChild.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80"}
                          alt={selectedChild.name}
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 mx-auto shadow-xs"
                        />
                        {selectedChild.allergyFlag && (
                          <span
                            title="Allergy Protocol Active"
                            className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-xs"
                          >
                            ⚠️
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-child text-xl font-bold text-slate-900">{selectedChild.name}</h3>
                        <p className="text-xs text-slate-500">{selectedChild.classroomName}</p>
                      </div>

                      {/* Real-time Diaper Counter & Attendance Status Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                          🧷 {selectedChild.todayDiaperCount ?? 0} Diaper Changes Today
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ {selectedChild.attendance?.status || "Present"}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Allergy Alert Banner */}
                    {selectedChild.allergyFlag ? (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>CRITICAL ALLERGY PROTOCOL ACTIVE</span>
                        </div>
                        <p className="text-[11px] text-rose-700 leading-relaxed">
                          Emergency medication protocol verified. Follow strict allergen isolation.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>No known dietary allergies</span>
                      </div>
                    )}

                    {/* Emergency Contact Info */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                        Guardian Emergency Contact
                      </div>
                      <div className="flex justify-between text-slate-800">
                        <span>Contact:</span>
                        <span className="font-semibold">{selectedChild.emergencyContactName || "Guardian"}</span>
                      </div>
                      <div className="flex justify-between text-slate-800">
                        <span>Phone:</span>
                        <a
                          href={`tel:${selectedChild.emergencyContactPhone}`}
                          className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{selectedChild.emergencyContactPhone || "+880 1819-001122"}</span>
                        </a>
                      </div>
                    </div>

                    {/* Dedicated Student Routine Action Buttons Grid */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Log Specific Student Routine
                        </div>
                        <span className="text-[10px] text-slate-400">For {selectedChild.name.split(" ")[0]}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. Meal */}
                        <button
                          onClick={() => {
                            setTargetChildId(selectedChild.id);
                            setActiveModal("meal");
                          }}
                          className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Utensils className="w-4 h-4 text-amber-600" />
                          <span>Log Meal</span>
                        </button>

                        {/* 2. Nap */}
                        <button
                          onClick={() => {
                            setTargetChildId(selectedChild.id);
                            setActiveModal("nap");
                          }}
                          className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Moon className="w-4 h-4 text-sky-600" />
                          <span>Log Nap</span>
                        </button>

                        {/* 3. Diaper Change */}
                        <button
                          onClick={() => {
                            setTargetChildId(selectedChild.id);
                            setActiveModal("diaper");
                          }}
                          className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Baby className="w-4 h-4 text-purple-600" />
                          <span>Diaper Change</span>
                        </button>

                        {/* 4. New Word */}
                        <button
                          onClick={() => {
                            setTargetChildId(selectedChild.id);
                            setActiveModal("word");
                          }}
                          className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                          <span>New Word</span>
                        </button>

                        {/* 5. Mood */}
                        <button
                          onClick={() => {
                            setTargetChildId(selectedChild.id);
                            setActiveModal("mood");
                          }}
                          className="p-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Smile className="w-4 h-4 text-pink-600" />
                          <span>Child Mood</span>
                        </button>

                        {/* 6. Photo/Video Moment */}
                        <button
                          onClick={() => {
                            setTargetChildId(selectedChild.id);
                            setActiveModal("photo");
                          }}
                          className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>Photo / Video</span>
                        </button>
                      </div>

                      {/* 7. Urgent Emergency Alert Button */}
                      <button
                        onClick={() => {
                          setTargetChildId(selectedChild.id);
                          setActiveModal("emergency");
                        }}
                        className="w-full mt-2 p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Send Emergency Alert to Parents</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs space-y-3 shadow-xs">
                    <Baby className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No students enrolled in this classroom view.</p>
                    <p className="text-slate-400 text-[11px]">Enroll a child or select another classroom to log daily routines.</p>
                    <button
                      onClick={handleOpenAddChild}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-white" />
                      <span>+ Enroll Child</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Tab 2: Children Roster CRUD */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-child text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Baby className="w-5 h-5 text-blue-600" />
                    Classroom Children Roster & CRUD Operations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Caregiver CRUD Portal: Add, view details, update profiles, or permanently remove children from PostgreSQL database.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={childSearchQuery}
                      onChange={(e) => setChildSearchQuery(e.target.value)}
                      placeholder="Search children or contacts..."
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <button
                    onClick={handleOpenAddChild}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Enroll Child</span>
                  </button>
                </div>
              </div>

              {/* Children Cards Grid */}
              {data?.children.filter((c) => 
                c.name.toLowerCase().includes(childSearchQuery.toLowerCase()) || 
                (c.emergencyContactName && c.emergencyContactName.toLowerCase().includes(childSearchQuery.toLowerCase()))
              ).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Baby className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold">No children found matching your search.</p>
                  <button
                    onClick={handleOpenAddChild}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Enroll a Child
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data?.children
                    .filter((c) => 
                      c.name.toLowerCase().includes(childSearchQuery.toLowerCase()) || 
                      (c.emergencyContactName && c.emergencyContactName.toLowerCase().includes(childSearchQuery.toLowerCase()))
                    )
                    .map((child) => (
                      <div
                        key={child.id}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="relative flex-shrink-0">
                            <img
                              src={child.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80"}
                              alt={child.name}
                              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                            />
                            {child.allergyFlag && (
                              <span
                                title="Allergy Protocol Active"
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs border-2 border-white"
                              >
                                ⚠️
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-child text-base font-bold text-slate-900 truncate">
                                {child.name}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {calculateAge(child.dateOfBirth)}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              DOB: <span className="font-mono">{child.dateOfBirth}</span>
                            </div>

                            <div className="mt-1.5 flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                🧷 {child.todayDiaperCount ?? 0} Diapers
                              </span>
                              {child.allergyFlag ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" /> Allergy Protocol
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> No Allergies
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Emergency Contact Box */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            Emergency Contact
                          </div>
                          <div className="flex items-center justify-between text-slate-800">
                            <span className="font-semibold truncate">{child.emergencyContactName || "Guardian"}</span>
                            <a
                              href={`tel:${child.emergencyContactPhone}`}
                              className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-bold"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{child.emergencyContactPhone || "+880 1819-001122"}</span>
                            </a>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleOpenEditChild(child)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => setDeletingChild(child)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MODAL 1: Log Student Meal Routine */}
        {/* ============================================================ */}
        {activeModal === "meal" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <Utensils className="w-5 h-5 text-amber-600" />
                  <span>Log Student Meal & Feeding</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMeal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                  <select
                    value={targetChildId}
                    onChange={(e) => setTargetChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {data?.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.allergyFlag ? "⚠️ (Allergy Protocol)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <ClockTimePicker
                      label="Meal Time"
                      value={mealForm.mealTime}
                      onChange={(val) => setMealForm({ ...mealForm, mealTime: val })}
                      format="12h"
                      placeholder="e.g. 09:30 AM"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Portion Eaten</label>
                    <select
                      value={mealForm.portionEaten}
                      onChange={(e) => setMealForm({ ...mealForm, portionEaten: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="100% (Finished all)">100% (Finished all)</option>
                      <option value="75% (Ate most)">75% (Ate most)</option>
                      <option value="50% (Ate half)">50% (Ate half)</option>
                      <option value="25% (A few bites)">25% (A few bites)</option>
                      <option value="Refused / None">Refused / None</option>
                    </select>
                  </div>
                </div>

                {/* Meal Items Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    What Meals / Foods Child Had (Select Checkboxes)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MEAL_ITEMS_OPTIONS.map((item) => {
                      const checked = mealSelectedItems.includes(item);
                      return (
                        <label
                          key={item}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-amber-50 border-amber-300 text-amber-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(mealSelectedItems, setMealSelectedItems, item)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mealShowCustomItem}
                      onChange={(e) => setMealShowCustomItem(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>+ Other / Custom food item</span>
                  </label>
                  {mealShowCustomItem && (
                    <input
                      type="text"
                      value={mealCustomItem}
                      onChange={(e) => setMealCustomItem(e.target.value)}
                      placeholder="e.g. Sliced papaya, bread roll, warm soup..."
                      className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                {/* Feeding Observations Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Feeding Notes & Observations (Select Checkboxes)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MEAL_OBSERVATION_OPTIONS.map((obs) => {
                      const checked = mealSelectedObservations.includes(obs);
                      return (
                        <label
                          key={obs}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-amber-50 border-amber-300 text-amber-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(mealSelectedObservations, setMealSelectedObservations, obs)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span>{obs}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mealShowCustomObservation}
                      onChange={(e) => setMealShowCustomObservation(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>+ Add optional custom observation</span>
                  </label>
                  {mealShowCustomObservation && (
                    <textarea
                      rows={2}
                      value={mealCustomObservation}
                      onChange={(e) => setMealCustomObservation(e.target.value)}
                      placeholder="e.g., Ate cheerfully without hesitation, allergen verification checked."
                      className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Meal Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 2: Log Student Nap Time */}
        {/* ============================================================ */}
        {activeModal === "nap" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <Moon className="w-5 h-5 text-sky-600" />
                  <span>Log Student Nap Time</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitNap} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                  <select
                    value={targetChildId}
                    onChange={(e) => setTargetChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {data?.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <ClockTimePicker
                      label="Start Time"
                      value={napForm.napStartTime}
                      onChange={(val) => setNapForm({ ...napForm, napStartTime: val })}
                      format="12h"
                      placeholder="e.g. 01:00 PM"
                    />
                  </div>

                  <div>
                    <ClockTimePicker
                      label="End Time"
                      value={napForm.napEndTime}
                      onChange={(val) => setNapForm({ ...napForm, napEndTime: val })}
                      format="12h"
                      placeholder="e.g. 02:15 PM"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={napForm.napDurationMinutes}
                      onChange={(e) =>
                        setNapForm({ ...napForm, napDurationMinutes: parseInt(e.target.value) || 60 })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nap Quality</label>
                  <select
                    value={napForm.napQuality}
                    onChange={(e) => setNapForm({ ...napForm, napQuality: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="Restful & deep sleep">Restful & deep sleep</option>
                    <option value="Light sleep / woke up once">Light sleep / woke up once</option>
                    <option value="Restless / short rest">Restless / short rest</option>
                  </select>
                </div>

                {/* Nap Sleep Notes Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Sleep Notes & Observations (Select Checkboxes)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {NAP_OBSERVATION_OPTIONS.map((obs) => {
                      const checked = napSelectedObservations.includes(obs);
                      return (
                        <label
                          key={obs}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-sky-50 border-sky-300 text-sky-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(napSelectedObservations, setNapSelectedObservations, obs)}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>{obs}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={napShowCustomObservation}
                      onChange={(e) => setNapShowCustomObservation(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>+ Add optional custom sleep note</span>
                  </label>
                  {napShowCustomObservation && (
                    <textarea
                      rows={2}
                      value={napCustomObservation}
                      onChange={(e) => setNapCustomObservation(e.target.value)}
                      placeholder="e.g., Slept peacefully on cot #2, woke up cheerful."
                      className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Nap Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 3: Log Diaper Change & Real-Time Counter */}
        {/* ============================================================ */}
        {activeModal === "diaper" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <Baby className="w-5 h-5 text-purple-600" />
                  <span>Log Diaper Change & Counter</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Counter status badge */}
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                    Today's Diaper Change Status
                  </span>
                  <span className="text-xs text-purple-700">
                    Currently recorded: <strong>{selectedChild?.todayDiaperCount ?? 0} changes today</strong>
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-purple-800">
                  #{(selectedChild?.todayDiaperCount ?? 0) + 1}
                </div>
              </div>

              <form onSubmit={handleSubmitDiaper} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                  <select
                    value={targetChildId}
                    onChange={(e) => setTargetChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {data?.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Changes today: {c.todayDiaperCount ?? 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Change Time</label>
                    <input
                      type="text"
                      value={diaperForm.diaperTime}
                      onChange={(e) => setDiaperForm({ ...diaperForm, diaperTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Diaper Condition</label>
                    <select
                      value={diaperForm.diaperType}
                      onChange={(e) => setDiaperForm({ ...diaperForm, diaperType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="wet">💧 Wet Diaper</option>
                      <option value="soiled">💩 Soiled Diaper</option>
                      <option value="both">💧💩 Both (Wet & Soiled)</option>
                      <option value="dry">✨ Dry (Routine hygiene check)</option>
                    </select>
                  </div>
                </div>

                {/* Diaper Hygiene Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hygiene Notes & Observations (Select Checkboxes)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DIAPER_OBSERVATION_OPTIONS.map((obs) => {
                      const checked = diaperSelectedObservations.includes(obs);
                      return (
                        <label
                          key={obs}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-purple-50 border-purple-300 text-purple-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(diaperSelectedObservations, setDiaperSelectedObservations, obs)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>{obs}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={diaperShowCustomObservation}
                      onChange={(e) => setDiaperShowCustomObservation(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>+ Add optional custom hygiene note</span>
                  </label>
                  {diaperShowCustomObservation && (
                    <input
                      type="text"
                      value={diaperCustomObservation}
                      onChange={(e) => setDiaperCustomObservation(e.target.value)}
                      placeholder="e.g. Skin healthy, fresh diaper and rash cream applied."
                      className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Diaper Change"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 4: Log Child's New Word Spoken Milestone */}
        {/* ============================================================ */}
        {activeModal === "word" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <span>Log Child New Word Milestone</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitWord} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                  <select
                    value={targetChildId}
                    onChange={(e) => setTargetChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {data?.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Word Spoken *</label>
                    <input
                      type="text"
                      required
                      value={wordForm.wordSpoken}
                      onChange={(e) => setWordForm({ ...wordForm, wordSpoken: e.target.value })}
                      placeholder='e.g., "Butterfly", "More water"'
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time Spoken</label>
                    <input
                      type="text"
                      value={wordForm.wordTime}
                      onChange={(e) => setWordForm({ ...wordForm, wordTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                {/* Context Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Context & Milestone Situation (Select Checkboxes)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {WORD_CONTEXT_OPTIONS.map((ctx) => {
                      const checked = wordSelectedContexts.includes(ctx);
                      return (
                        <label
                          key={ctx}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(wordSelectedContexts, setWordSelectedContexts, ctx)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{ctx}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wordShowCustomContext}
                      onChange={(e) => setWordShowCustomContext(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>+ Add optional custom situation</span>
                  </label>
                  {wordShowCustomContext && (
                    <input
                      type="text"
                      value={wordCustomContext}
                      onChange={(e) => setWordCustomContext(e.target.value)}
                      placeholder="e.g. Spoke during picture book reading pointing at animals"
                      className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                {/* Observations Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Caregiver Observations (Select Checkboxes)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {WORD_OBSERVATION_OPTIONS.map((obs) => {
                      const checked = wordSelectedObservations.includes(obs);
                      return (
                        <label
                          key={obs}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(wordSelectedObservations, setWordSelectedObservations, obs)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{obs}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wordShowCustomObservation}
                      onChange={(e) => setWordShowCustomObservation(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>+ Add optional custom observation</span>
                  </label>
                  {wordShowCustomObservation && (
                    <textarea
                      rows={2}
                      value={wordCustomObservation}
                      onChange={(e) => setWordCustomObservation(e.target.value)}
                      placeholder="e.g. Pronounced clearly and clapped hands with joy!"
                      className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Word Milestone"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 5: Describe Child's Mood */}
        {/* ============================================================ */}
        {activeModal === "mood" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <Smile className="w-5 h-5 text-pink-600" />
                  <span>Describe Child's Mood & Engagement</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMood} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                  <select
                    value={targetChildId}
                    onChange={(e) => setTargetChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {data?.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Mood State</label>
                  <select
                    value={moodForm.moodState}
                    onChange={(e) => setMoodForm({ ...moodForm, moodState: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="Cheerful & Energetic">😊 Cheerful & Energetic</option>
                    <option value="Calm & Engaged">😌 Calm & Content</option>
                    <option value="Playful & Curious">🎨 Playful & Curious</option>
                    <option value="Quiet / Observant">👀 Quiet / Observant</option>
                    <option value="Fussy / Sleepy">🥱 Fussy / Sleepy</option>
                    <option value="Frustrated / Needing Comfort">🥺 Frustrated / Needing Comfort</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMoodForm({ ...moodForm, moodRating: star })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          moodForm.moodRating >= star
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood Observations Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Observations & Emotional Details (Select Checkboxes)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MOOD_OBSERVATION_OPTIONS.map((obs) => {
                      const checked = moodSelectedObservations.includes(obs);
                      return (
                        <label
                          key={obs}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-pink-50 border-pink-300 text-pink-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(moodSelectedObservations, setMoodSelectedObservations, obs)}
                            className="rounded text-pink-600 focus:ring-pink-500"
                          />
                          <span>{obs}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={moodShowCustomObservation}
                      onChange={(e) => setMoodShowCustomObservation(e.target.checked)}
                      className="rounded text-pink-600 focus:ring-pink-500"
                    />
                    <span>+ Add optional custom mood observation</span>
                  </label>
                  {moodShowCustomObservation && (
                    <textarea
                      rows={2}
                      value={moodCustomObservation}
                      onChange={(e) => setMoodCustomObservation(e.target.value)}
                      placeholder="e.g., Highly engaged during motor skill blocks, smiled and shared toys."
                      className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Mood Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 6: Urgent Emergency Alert to Parents */}
        {/* ============================================================ */}
        {activeModal === "emergency" && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border-2 border-rose-500 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-extrabold text-rose-700">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                  <span>Send Immediate Emergency Alert to Parents</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                ⚠️ <strong>Urgent Priority Notice:</strong> This action dispatches an immediate high-priority alert to the guardian portal, records an incident report, and logs an urgent notification.
              </div>

              <form onSubmit={handleSubmitEmergency} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Affected Student *</label>
                  <select
                    value={targetChildId}
                    onChange={(e) => setTargetChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    {data?.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.allergyFlag ? "⚠️ (Allergy Registered)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Type</label>
                    <select
                      value={emergencyForm.alertType}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, alertType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs font-bold text-rose-800 bg-white"
                    >
                      <option value="medical">Medical Illness / Sickness</option>
                      <option value="allergy">Allergic Reaction Alert</option>
                      <option value="injury">Accidental Fall / Injury</option>
                      <option value="fever">High Fever Spike (&gt;101°F)</option>
                      <option value="urgent_pickup">Urgent Pickup Required</option>
                      <option value="other">Other Classroom Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alert Headline *</label>
                    <input
                      type="text"
                      required
                      value={emergencyForm.title}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, title: e.target.value })}
                      placeholder="e.g., Sudden Fever 101.5°F"
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Incident Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={emergencyForm.description}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, description: e.target.value })}
                    placeholder="Describe what happened, symptoms, or why parent notification is needed..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Immediate Caregiver Action Taken</label>
                  <input
                    type="text"
                    value={emergencyForm.actionTaken}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, actionTaken: e.target.value })}
                    placeholder="e.g., Child moved to nurse room, cold compress applied, vitals checked."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    {isSaving ? "Dispatching..." : "Dispatch Emergency Alert"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 7: Share Moment (Photos & Videos) */}
        {/* ============================================================ */}
        {activeModal === "photo" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <Camera className="w-5 h-5 text-purple-600" />
                  <span>Share Daily Classroom Moment (Photo & Video)</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle Photo vs Video */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMomentType("photo")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    momentType === "photo" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> Photo Moment
                </button>
                <button
                  type="button"
                  onClick={() => setMomentType("video")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    momentType === "video" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-purple-600" /> Video Moment
                </button>
              </div>

              <form onSubmit={handleSubmitMediaMoment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                  <select
                    value={targetChildId}
                    onChange={(e) => setTargetChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {data?.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Upload {momentType === "video" ? "Video File (MP4, WebM, MOV - Max 50MB)" : "Photo File (JPEG, PNG, WebP)"}
                  </label>
                  <CloudinaryUploader
                    folder="kiddieops/moments"
                    entityType="child_media"
                    allowVideo={true}
                    onUploadSuccess={(res) => {
                      setUploadedMediaUrl(res.secureUrl);
                      setUploadedAssetId(res.assetId);
                    }}
                  />
                  {uploadedMediaUrl && (
                    <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Media uploaded and ready to share!
                    </div>
                  )}
                </div>

                {/* Moment Caption Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Caption / Note for Parents (Select Checkboxes)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MOMENT_CAPTION_OPTIONS.map((cap) => {
                      const checked = momentSelectedCaptions.includes(cap);
                      return (
                        <label
                          key={cap}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            checked
                              ? "bg-purple-50 border-purple-300 text-purple-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(momentSelectedCaptions, setMomentSelectedCaptions, cap)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>{cap}</span>
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={momentShowCustomCaption}
                      onChange={(e) => setMomentShowCustomCaption(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>+ Add optional custom caption / note</span>
                  </label>
                  {momentShowCustomCaption && (
                    <input
                      type="text"
                      value={momentCustomCaption}
                      onChange={(e) => setMomentCustomCaption(e.target.value)}
                      placeholder={
                        momentType === "video"
                          ? "e.g., Practicing first dance steps during music circle!"
                          : "e.g., Happy smiles during morning sensory exploration!"
                      }
                      className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !uploadedMediaUrl}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "Publishing..." : `Publish ${momentType === "video" ? "Video" : "Photo"}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 8: Generic Activity Modal */}
        {/* ============================================================ */}
        {activeModal === "activity" && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Log Classroom Routine Activity</span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitGenericActivity} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Student</label>
                  <select
                    value={targetChildId}
                    onChange={(e) => setTargetChildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {data?.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Activity Type</label>
                    <select
                      value={routineForm.activityType}
                      onChange={(e) =>
                        setRoutineForm({
                          ...routineForm,
                          activityType: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="meal">🍎 Meal / Snack</option>
                      <option value="nap">💤 Nap Time</option>
                      <option value="play_activity">🎨 Play & Motor Skills</option>
                      <option value="learning_activity">📚 Learning / Stories</option>
                      <option value="diaper_change">🧷 Diaper / Hygiene</option>
                      <option value="mood_note">😊 Mood Observation</option>
                      <option value="other">📝 Other Notes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={routineForm.durationMinutes}
                      onChange={(e) =>
                        setRoutineForm({
                          ...routineForm,
                          durationMinutes: parseInt(e.target.value) || 15,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Child Mood Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRoutineForm({ ...routineForm, moodRating: star })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          routineForm.moodRating >= star
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Activity Details & Observations
                  </label>
                  <textarea
                    rows={3}
                    value={routineForm.details}
                    onChange={(e) => setRoutineForm({ ...routineForm, details: e.target.value })}
                    placeholder="e.g., Ate 100% fruit portion without difficulty. Cheerful during story circle."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save to Database"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 9: Caregiver Add / Enroll Child */}
        {/* ============================================================ */}
        {isAddChildModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <span>Enroll New Child into Classroom</span>
                </div>
                <button
                  onClick={() => setIsAddChildModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateChildSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={childFormData.name}
                    onChange={(e) => setChildFormData({ ...childFormData, name: e.target.value })}
                    placeholder="e.g. Zayan Ahmed"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={childFormData.dateOfBirth}
                      onChange={(e) => setChildFormData({ ...childFormData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Classroom</label>
                    <select
                      value={childFormData.classroomId}
                      onChange={(e) => setChildFormData({ ...childFormData, classroomId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                    >
                      {data?.classrooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    Emergency Contact Details *
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        required
                        value={childFormData.emergencyContactName}
                        onChange={(e) => setChildFormData({ ...childFormData, emergencyContactName: e.target.value })}
                        placeholder="e.g. Tahmina Begum"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={childFormData.emergencyContactPhone}
                        onChange={(e) => setChildFormData({ ...childFormData, emergencyContactPhone: e.target.value })}
                        placeholder="+880 1711-000000"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Allergy Protocol */}
                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={childFormData.allergyFlag}
                      onChange={(e) => setChildFormData({ ...childFormData, allergyFlag: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600"
                    />
                    <span className="text-xs font-bold text-rose-900">
                      Child has known dietary or environmental allergies
                    </span>
                  </label>

                  {childFormData.allergyFlag && (
                    <div>
                      <label className="block text-[11px] font-semibold text-rose-800 mb-1">
                        Allergy Details & Medical Instructions
                      </label>
                      <input
                        type="text"
                        value={childFormData.allergyDetails}
                        onChange={(e) => setChildFormData({ ...childFormData, allergyDetails: e.target.value })}
                        placeholder="e.g., Peanuts, dairy, asthma inhaler protocol"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs text-slate-800 bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Child Profile Photo (Cloudinary CDN)</label>
                  <CloudinaryUploader
                    folder="kiddieops/children"
                    entityType="child_avatar"
                    onUploadSuccess={(res) => {
                      setChildFormData({ ...childFormData, avatarUrl: res.secureUrl });
                    }}
                  />
                  {childFormData.avatarUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={childFormData.avatarUrl}
                        alt="Avatar Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <span className="text-[11px] text-slate-500">Avatar ready for enrollment</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddChildModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingChild}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSubmittingChild ? "Enrolling..." : "Enroll Child"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 10: Caregiver Edit Child Profile */}
        {/* ============================================================ */}
        {editingChild && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in max-h-[90vh] modal-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-child text-lg font-bold text-slate-900">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  <span>Edit Child Profile: {editingChild.name}</span>
                </div>
                <button
                  onClick={() => setEditingChild(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditChildSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={childFormData.name}
                    onChange={(e) => setChildFormData({ ...childFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={childFormData.dateOfBirth}
                      onChange={(e) => setChildFormData({ ...childFormData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Classroom</label>
                    <select
                      value={childFormData.classroomId}
                      onChange={(e) => setChildFormData({ ...childFormData, classroomId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                    >
                      {data?.classrooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    Emergency Contact Details *
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        required
                        value={childFormData.emergencyContactName}
                        onChange={(e) => setChildFormData({ ...childFormData, emergencyContactName: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={childFormData.emergencyContactPhone}
                        onChange={(e) => setChildFormData({ ...childFormData, emergencyContactPhone: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Allergy Protocol */}
                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={childFormData.allergyFlag}
                      onChange={(e) => setChildFormData({ ...childFormData, allergyFlag: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600"
                    />
                    <span className="text-xs font-bold text-rose-900">
                      Child has known dietary or environmental allergies
                    </span>
                  </label>

                  {childFormData.allergyFlag && (
                    <div>
                      <label className="block text-[11px] font-semibold text-rose-800 mb-1">
                        Allergy Details & Medical Instructions
                      </label>
                      <input
                        type="text"
                        value={childFormData.allergyDetails}
                        onChange={(e) => setChildFormData({ ...childFormData, allergyDetails: e.target.value })}
                        placeholder="e.g., Peanuts, dairy, asthma inhaler protocol"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 text-xs text-slate-800 bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Update Child Photo (Cloudinary CDN)</label>
                  <CloudinaryUploader
                    folder="kiddieops/children"
                    entityType="child_avatar"
                    onUploadSuccess={(res) => {
                      setChildFormData({ ...childFormData, avatarUrl: res.secureUrl });
                    }}
                  />
                  {childFormData.avatarUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={childFormData.avatarUrl}
                        alt="Avatar Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <span className="text-[11px] text-slate-500">Current active photo</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingChild(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingChild}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSubmittingChild ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL 11: Delete Confirmation Modal */}
        {/* ============================================================ */}
        <ConfirmationModal
          isOpen={deletingChild !== null}
          onClose={() => setDeletingChild(null)}
          onConfirm={handleDeleteChildConfirm}
          title="Delete Child Profile"
          message={`Are you sure you want to permanently remove "${deletingChild?.name}" from the classroom and database? This action cannot be undone.`}
          confirmLabel="Permanently Delete"
          cancelLabel="Keep Child"
          variant="danger"
          isLoading={isSubmittingChild}
        />

      </div>
    </AuthGuard>
  );
}
