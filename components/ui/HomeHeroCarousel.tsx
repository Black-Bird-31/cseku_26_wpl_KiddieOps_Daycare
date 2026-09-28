"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Play, 
  Pause,
  ArrowRight,
  Sun,
  Baby,
  Home,
  Palette,
  Moon,
  Clock,
  Heart
} from "lucide-react";

export interface CarouselSlide {
  id: string;
  category: string;
  categoryIcon: React.ReactNode;
  imageUrl: string;
  tag: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  description: string;
  highlightStat: {
    value: string;
    label: string;
  };
  ctaText: string;
  ctaHref: string;
}

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: "slide-toddler-blocks",
    category: "Toddler Learning & Blocks",
    categoryIcon: <Sparkles className="w-3.5 h-3.5" />,
    imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1920&q=85",
    tag: "Cognitive Play & Discovery",
    badgeBg: "bg-amber-500 text-white",
    title: "Inspiring Toddler Discovery & Hands-on Exploration",
    subtitle: "Joyful Early Education",
    description: "Interactive shape sorting, fine motor skill challenges, and caring attention that fosters curious, confident little learners.",
    highlightStat: {
      value: "Montessori",
      label: "Guided Activities",
    },
    ctaText: "Explore Early Learning",
    ctaHref: "/login",
  },
  {
    id: "slide-childhome-nursery",
    category: "Childhome Haven",
    categoryIcon: <Home className="w-3.5 h-3.5" />,
    imageUrl: "https://images.unsplash.com/photo-1567057419565-4349c49d8a04?auto=format&fit=crop&w=1920&q=85",
    tag: "Sunlit Childhome Oasis",
    badgeBg: "bg-teal-600 text-white",
    title: "Comfortable, Sunlit Childhome Nurseries",
    subtitle: "Warm Home Away From Home",
    description: "Spacious, warm, and thoughtfully arranged nursery rooms bathed in morning natural light with soft play rugs and child-friendly nooks.",
    highlightStat: {
      value: "Eco-Safe",
      label: "Natural Light & Play Spaces",
    },
    ctaText: "Tour Childhome Rooms",
    ctaHref: "/parent",
  },
  {
    id: "slide-2",
    category: "Childhome Spaces",
    categoryIcon: <Home className="w-3.5 h-3.5" />,
    imageUrl: "https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=1920&q=85",
    tag: "Childhome Classrooms",
    badgeBg: "bg-blue-600 text-white",
    title: "Safe, Vibrant & Cozy Childhome Classrooms",
    subtitle: "Modern Learning Haven",
    description: "Naturally lit, childproofed rooms equipped with medical-grade air filtration, gentle rounded furnishings, and engaging reading libraries.",
    highlightStat: {
      value: "100%",
      label: "Childproofed & Sanitized Daily",
    },
    ctaText: "Tour Childhome Rooms",
    ctaHref: "/parent",
  },
  {
    id: "slide-3",
    category: "Outdoor Recess",
    categoryIcon: <Sun className="w-3.5 h-3.5" />,
    imageUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1920&q=85",
    tag: "Outdoor Play & Sunshine",
    badgeBg: "bg-emerald-600 text-white",
    title: "Sunshine, Fresh Air & Gross Motor Adventures",
    subtitle: "Active Healthy Childhood",
    description: "Safe rubberized soft-turf playgrounds with gentle swings, sensory sand tables, and joyful social interaction under vigilant caregiver supervision.",
    highlightStat: {
      value: "60+ min",
      label: "Supervised Fresh Air Daily",
    },
    ctaText: "View Daily Schedule",
    ctaHref: "/parent",
  },
  {
    id: "slide-4",
    category: "Creative Arts",
    categoryIcon: <Palette className="w-3.5 h-3.5" />,
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1920&q=85",
    tag: "Creative Arts & Storytelling",
    badgeBg: "bg-purple-600 text-white",
    title: "Expressive Storytelling & Creative Crafts",
    subtitle: "Social & Emotional Growth",
    description: "Hands-on non-toxic finger painting, circle-time rhymes, and language building milestones shared directly with parents in real time.",
    highlightStat: {
      value: "Daily",
      label: "Photo & Video Updates",
    },
    ctaText: "Parent Media Gallery",
    ctaHref: "/parent",
  },
  {
    id: "slide-5",
    category: "Rest & Wellness",
    categoryIcon: <Moon className="w-3.5 h-3.5" />,
    imageUrl: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1920&q=85",
    tag: "Rest & Sleep Rhythms",
    badgeBg: "bg-indigo-600 text-white",
    title: "Peaceful Naps & Ambient Comfort Rooms",
    subtitle: "Healthy Growth Rhythms",
    description: "Individual temperature-controlled cribs, soothing ambient white noise, and continuous breathing and sleeping monitoring intervals.",
    highlightStat: {
      value: "Real-Time",
      label: "Nap & Routine Logging",
    },
    ctaText: "Learn About Safety",
    ctaHref: "/login",
  },
];

const SLIDE_DURATION_MS = 5500;

export default function HomeHeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  const totalSlides = CAROUSEL_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // Dynamic progress bar and slide timer
  useEffect(() => {
    if (!isPlaying || isHovered) return;

    const intervalStep = 50; // update every 50ms for buttery-smooth progress
    const increment = (intervalStep / SLIDE_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          nextSlide();
          return 0;
        }
        return old + increment;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const activeSlide = CAROUSEL_SLIDES[currentIndex];

  return (
    <section className="relative w-full overflow-hidden bg-slate-50 pt-4 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Dynamic Category Switcher Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {CAROUSEL_SLIDES.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(idx)}
                  className={`px-3 sm:px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md scale-102"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span className={isActive ? "text-amber-400" : "text-slate-400"}>
                    {slide.categoryIcon}
                  </span>
                  <span>{slide.category}</span>
                </button>
              );
            })}
          </div>

          {/* Autoplay & Count Controls */}
          <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs text-xs font-mono text-slate-600">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? "Pause auto-slide" : "Resume auto-slide"}
              className="p-1 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-slate-800">
              {String(currentIndex + 1).padStart(2, "0")}
            </span>
            <span className="text-slate-400">/</span>
            <span>{String(totalSlides).padStart(2, "0")}</span>
          </div>
        </div>

        {/* High-Opacity Hero Carousel Frame */}
        <div
          className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 bg-white group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Visual Viewport with HIGH OPACITY photography */}
          <div className="relative h-[440px] sm:h-[500px] md:h-[560px] lg:h-[620px] w-full overflow-hidden">
            {CAROUSEL_SLIDES.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive
                      ? "opacity-100 z-10 scale-100"
                      : "opacity-0 z-0 pointer-events-none scale-102"
                  } transition-transform duration-700`}
                >
                  {/* High Opacity Clear Image (No heavy dark overlays) */}
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center select-none"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />

                  {/* Soft bottom vignette for clear text separation without darkening the main photo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/10" />
                </div>
              );
            })}

            {/* Top Badge: Unsplash & Category */}
            <div className="absolute top-5 left-5 sm:top-7 sm:left-7 z-20 flex items-center gap-2 pointer-events-none">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-xs ${activeSlide.badgeBg}`}
              >
                {activeSlide.tag}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 text-slate-800 backdrop-blur-md border border-white/60 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> High-Resolution Unsplash
              </span>
            </div>

            {/* Floating Glassmorphism Hero Story Card (Allows 100% photo opacity while ensuring high-contrast readability) */}
            <div className="absolute bottom-5 sm:bottom-7 left-5 right-5 sm:left-7 sm:right-auto sm:max-w-xl lg:max-w-2xl z-20 pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/80 shadow-2xl space-y-3.5 transition-all">
                <div className="space-y-1.5">
                  <div className="text-amber-600 text-xs sm:text-sm font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{activeSlide.subtitle}</span>
                  </div>
                  <h1 className="font-child text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {activeSlide.title}
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {activeSlide.description}
                  </p>
                </div>

                {/* Highlight Metric and Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-child text-lg sm:text-xl font-black text-slate-900 leading-none">
                        {activeSlide.highlightStat.value}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {activeSlide.highlightStat.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={activeSlide.ctaHref}
                      className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-102 active:scale-98"
                    >
                      <span>{activeSlide.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Next / Previous Navigation Buttons */}
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl border border-slate-200/80 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Desktop Quick Thumbnails */}
            <div className="absolute top-6 right-6 z-20 hidden lg:flex items-center gap-2 bg-slate-950/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              {CAROUSEL_SLIDES.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(idx)}
                    title={slide.title}
                    className={`relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer border ${
                      isActive
                        ? "w-16 h-11 border-white ring-2 ring-blue-500 shadow-lg scale-105"
                        : "w-11 h-11 border-white/30 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Progress Bar along Bottom */}
          <div className="h-1.5 w-full bg-slate-200/70 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Mobile Dot Navigation */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 pt-1">
          {CAROUSEL_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? "w-6 h-2 bg-blue-600"
                  : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
