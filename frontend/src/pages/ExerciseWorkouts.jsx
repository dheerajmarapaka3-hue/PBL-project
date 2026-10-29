import React, { useState, useEffect } from "react";
import { api, resolveAssetUrl } from "../api/client";

const WORKOUT_CATEGORIES = [
  { type: "Brisk Walking", icon: "directions_walk", met: 3.8, desc: "Gentle aerobic circulation" },
  { type: "Cardio Running", icon: "directions_run", met: 8.0, desc: "High heart rate endurance" },
  { type: "Strength Training", icon: "fitness_center", met: 5.0, desc: "Resistance & lean muscle" },
  { type: "HIIT Session", icon: "bolt", met: 9.0, desc: "Interval metabolic conditioning" },
  { type: "Cycling", icon: "directions_bike", met: 6.5, desc: "Low-impact leg stamina" },
  { type: "Swimming", icon: "pool", met: 7.0, desc: "Full body buoyancy cardio" },
  { type: "Yoga Flow", icon: "self_improvement", met: 3.0, desc: "Mobility, balance & breath" },
  { type: "Stretching & Mobility", icon: "accessibility_new", met: 2.5, desc: "Joint opening & recovery" },
];

// Reusable SVG Animation Player Component with Reduced-Motion and Play/Pause Controls
function ExerciseAnimationPlayer({ frames, sequence = [0, 1, 2, 1], frameDurationMs = 180, alt = "Exercise animation" }) {
  const [frameIdx, setFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Check system prefers-reduced-motion
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || !frames || frames.length === 0) return;
    const seq = sequence && sequence.length > 0 ? sequence : [0, 1, 2, 1];
    let step = 0;

    const interval = setInterval(() => {
      step = (step + 1) % seq.length;
      setFrameIdx(seq[step]);
    }, frameDurationMs || 180);

    return () => clearInterval(interval);
  }, [isPlaying, prefersReducedMotion, frames, sequence, frameDurationMs]);

  const rawSrc = frames && frames[frameIdx] ? frames[frameIdx] : frames?.[0];
  const activeSrc = resolveAssetUrl(rawSrc);

  if (!frames || frames.length === 0 || imgError) {
    return (
      <div className="w-full h-56 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-800">
        <span className="material-symbols-outlined text-[36px]">fitness_center</span>
        <span className="text-xs">No animated preview available</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-56 sm:h-72 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800 shadow-inner group">
      <img
        src={activeSrc}
        alt={alt}
        onError={() => setImgError(true)}
        className="max-h-full max-w-full object-contain p-4 select-none"
      />

      {/* Floating Player Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs shadow-md">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none"
          aria-label={isPlaying ? "Pause exercise animation" : "Play exercise animation"}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isPlaying ? "pause" : "play_arrow"}
          </span>
          <span className="text-[11px] font-bold">{isPlaying ? "Pause" : "Play"}</span>
        </button>
        <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
          Frame {frameIdx + 1}/{frames.length}
        </span>
      </div>
    </div>
  );
}

export default function ExerciseWorkouts() {
  const [activeTab, setActiveTab] = useState("library"); // "tracking" or "library"

  // Tracking State
  const [stats, setStats] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Library State
  const [exercises, setExercises] = useState([]);
  const [exercisesTotal, setExercisesTotal] = useState(0);
  const [exercisesPage, setExercisesPage] = useState(1);
  const [exercisesPages, setExercisesPages] = useState(1);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [filters, setFilters] = useState({ categories: [], body_parts: [], target_muscles: [], equipment: [], difficulties: [] });

  // Filter selections
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [filterAnimatedOnly, setFilterAnimatedOnly] = useState(false);

  // Exercise Detail Modal
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Log Workout Modal Form
  const [showLogModal, setShowLogModal] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: "Brisk Walking",
    duration_minutes: 30,
    calories_burned: 150,
    intensity: "Moderate",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial tracking data
  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const [statsRes, listRes] = await Promise.all([
        api.workouts.getStats(),
        api.workouts.list(),
      ]);
      setStats(statsRes.data);
      setWorkouts(listRes.data);
    } catch (err) {
      console.error("Failed to load workout stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Filter Options once
  useEffect(() => {
    fetchTrackingData();
    api.exercises.getFilters()
      .then((res) => setFilters(res.data))
      .catch((err) => console.error("Failed to load exercise filters:", err));
  }, []);

  // Fetch Exercises on search/filter/page change
  useEffect(() => {
    if (activeTab !== "library") return;

    const fetchExercises = async () => {
      setLibraryLoading(true);
      try {
        const params = {
          page: exercisesPage,
          limit: 20,
          search: searchTerm || undefined,
          category: selectedCategory || undefined,
          body_part: selectedBodyPart || undefined,
          equipment: selectedEquipment || undefined,
          difficulty: selectedDifficulty || undefined,
          has_animation: filterAnimatedOnly ? true : undefined,
        };
        const res = await api.exercises.list(params);
        setExercises(res.data.items);
        setExercisesTotal(res.data.total);
        setExercisesPages(res.data.pages);
      } catch (err) {
        console.error("Failed to load exercise library:", err);
      } finally {
        setLibraryLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchExercises, 250);
    return () => clearTimeout(debounceTimer);
  }, [
    activeTab,
    exercisesPage,
    searchTerm,
    selectedCategory,
    selectedBodyPart,
    selectedEquipment,
    selectedDifficulty,
    filterAnimatedOnly,
  ]);

  const handleOpenDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.exercises.getDetail(id);
      setSelectedExercise(res.data);
    } catch (err) {
      console.error("Failed to load exercise details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLogExerciseFromCatalog = (ex) => {
    const met = ex.met || 4.5;
    const dur = 30;
    const cal = Math.round(met * dur * 1.05);
    setFormData({
      activity_type: ex.name,
      duration_minutes: dur,
      calories_burned: cal,
      intensity: ex.difficulty === "Advanced" ? "High" : ex.difficulty === "Beginner" ? "Low" : "Moderate",
      notes: `Logged from ${ex.source} Exercise Catalogue. Target: ${ex.target_muscle || "General"}.`,
    });
    setSelectedExercise(null);
    setShowLogModal(true);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.workouts.log({
        activity_type: formData.activity_type,
        duration_minutes: parseInt(formData.duration_minutes, 10),
        calories_burned: parseFloat(formData.calories_burned) || 0,
        intensity: formData.intensity,
        notes: formData.notes || null,
      });
      setShowLogModal(false);
      fetchTrackingData();
    } catch (err) {
      console.error(err);
      alert("Failed to log workout.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workout entry?")) return;
    try {
      await api.workouts.delete(id);
      fetchTrackingData();
    } catch (err) {
      console.error(err);
    }
  };

  const activeProgress = stats
    ? Math.min(100, Math.round((stats.weekly_active_minutes / stats.target_active_minutes) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
      {/* Header & Log Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Exercise & Workouts</h1>
          <p className="text-xs text-on-surface-variant">
            Explore 1,940+ illustrated & animated exercises, build endurance, and track weekly movement.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              activity_type: "Brisk Walking",
              duration_minutes: 30,
              calories_burned: 150,
              intensity: "Moderate",
              notes: "",
            });
            setShowLogModal(true);
          }}
          className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Log Workout</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "library"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">fitness_center</span>
          <span>Exercise Library</span>
          <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-extrabold">
            1,940+
          </span>
        </button>

        <button
          onClick={() => setActiveTab("tracking")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "tracking"
              ? "bg-primary text-white shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">monitoring</span>
          <span>My Activity & History</span>
        </button>
      </div>

      {/* TAB 1: EXERCISE LIBRARY */}
      {activeTab === "library" && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* Search & Filter Toolbar */}
          <div className="p-4 md:p-5 rounded-3xl bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setExercisesPage(1);
                }}
                placeholder="Search by exercise name, target muscle (e.g. bicep, abs), or equipment..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setExercisesPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setExercisesPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
              >
                <option value="">All Categories</option>
                {filters.categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedBodyPart}
                onChange={(e) => {
                  setSelectedBodyPart(e.target.value);
                  setExercisesPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
              >
                <option value="">All Body Parts</option>
                {filters.body_parts.map((bp) => (
                  <option key={bp} value={bp}>
                    {bp}
                  </option>
                ))}
              </select>

              <select
                value={selectedEquipment}
                onChange={(e) => {
                  setSelectedEquipment(e.target.value);
                  setExercisesPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
              >
                <option value="">All Equipment</option>
                {filters.equipment.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setExercisesPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface focus:outline-none"
              >
                <option value="">All Difficulties</option>
                {filters.difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setFilterAnimatedOnly(!filterAnimatedOnly);
                  setExercisesPage(1);
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  filterAnimatedOnly
                    ? "bg-secondary text-white border-secondary shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">animation</span>
                <span>Animated</span>
              </button>
            </div>
          </div>

          {/* Results Summary & Pagination Header */}
          <div className="flex items-center justify-between text-xs text-outline font-medium px-2">
            <span>
              Showing <strong className="text-on-surface">{exercises.length}</strong> of{" "}
              <strong className="text-on-surface">{exercisesTotal}</strong> exercises
            </span>
            <span>
              Page {exercisesPage} of {exercisesPages}
            </span>
          </div>

          {/* Exercises Grid */}
          {libraryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-white border border-outline-variant/20 p-4 animate-pulse flex flex-col justify-between">
                  <div className="w-full h-36 bg-surface-container rounded-2xl" />
                  <div className="h-4 bg-surface-container rounded-md w-3/4" />
                  <div className="h-3 bg-surface-container rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-outline-variant/30 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[40px] text-outline">search_off</span>
              <h3 className="text-sm font-bold text-on-surface">No matching exercises found</h3>
              <p className="text-xs text-outline max-w-sm">
                Try adjusting your search query, or clear some filter chips to view more of the 1,940+ exercises.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setSelectedBodyPart("");
                  setSelectedEquipment("");
                  setSelectedDifficulty("");
                  setFilterAnimatedOnly(false);
                  setExercisesPage(1);
                }}
                className="mt-2 px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => handleOpenDetail(ex.id)}
                  className="group p-3.5 rounded-3xl bg-white border border-outline-variant/30 hover:border-primary/50 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-3"
                >
                  {/* Thumbnail Container */}
                  <div className="relative w-full h-40 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800">
                    {ex.image_url ? (
                      <img
                        src={resolveAssetUrl(ex.image_url)}
                        alt={ex.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[36px] text-slate-500">
                        fitness_center
                      </span>
                    )}

                    {/* Source / Animation Badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {ex.has_animation && (
                        <span
                          className="px-2 py-0.5 rounded-full bg-secondary/90 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-0.5"
                          title="Animated motion demonstration available"
                        >
                          <span className="material-symbols-outlined text-[12px]">animation</span>
                          <span>Motion</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Exercise Info */}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xs font-extrabold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                      {ex.name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                        {ex.target_muscle || ex.body_part}
                      </span>
                      {ex.equipment && (
                        <span className="text-[10px] text-outline font-medium truncate max-w-[120px]">
                          • {ex.equipment}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer & Quick Log Button */}
                  <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-primary">{Math.round((ex.met || 4.5) * 30 * 1.05)} kcal/30m</span>
                    <span className="text-secondary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Details</span>
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {exercisesPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                disabled={exercisesPage <= 1}
                onClick={() => setExercisesPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-bold text-on-surface disabled:opacity-30 hover:bg-surface-container transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Previous</span>
              </button>

              <span className="text-xs font-semibold text-outline px-2">
                Page {exercisesPage} of {exercisesPages}
              </span>

              <button
                disabled={exercisesPage >= exercisesPages}
                onClick={() => setExercisesPage((p) => Math.min(exercisesPages, p + 1))}
                className="px-4 py-2 rounded-full border border-outline-variant/30 text-xs font-bold text-on-surface disabled:opacity-30 hover:bg-surface-container transition-all flex items-center gap-1"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY WORKOUTS & STATS (Preserved existing implementation) */}
      {activeTab === "tracking" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Weekly Progress Bento */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                      Aerobic Baseline Target (WHO 150m)
                    </span>
                    <h2 className="text-xl font-extrabold text-on-surface mt-0.5">
                      Weekly Active Minutes
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">
                    {activeProgress}% Met
                  </span>
                </div>

                <div className="flex items-baseline gap-2 my-2">
                  <span className="text-4xl font-extrabold text-on-surface">{stats.weekly_active_minutes}</span>
                  <span className="text-sm text-outline font-semibold">/ {stats.target_active_minutes} mins</span>
                </div>

                <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${activeProgress}%` }}
                  />
                </div>

                <p className="text-xs text-on-surface-variant">
                  {stats.weekly_active_minutes >= stats.target_active_minutes
                    ? "🎉 Radiant job! You have surpassed the standard 150-minute aerobic health guideline this week."
                    : `${stats.target_active_minutes - stats.weekly_active_minutes} minutes remaining this week to reach baseline cardio goal.`}
                </p>
              </div>

              <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Energy Expended</span>
                <div>
                  <span className="text-3xl font-extrabold text-primary">{Math.round(stats.total_calories_burned)}</span>
                  <span className="text-xs text-outline font-semibold ml-1">kcal burned</span>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs font-semibold text-on-surface">
                  <span>Logged Workouts</span>
                  <span className="font-extrabold">{stats.total_workouts_count} sessions</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Exercise Modalities Cards */}
          <div>
            <h2 className="text-base font-bold text-on-surface mb-3">Popular Movement Modalities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {WORKOUT_CATEGORIES.map((cat) => (
                <div
                  key={cat.type}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      activity_type: cat.type,
                      calories_burned: Math.round(cat.met * 30 * 1.1),
                    });
                    setShowLogModal(true);
                  }}
                  className="p-4 rounded-3xl bg-white border border-outline-variant/30 hover:border-primary/50 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-2"
                >
                  <div className="w-10 h-10 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-on-surface leading-tight">{cat.type}</h3>
                    <p className="text-[10px] text-outline mt-0.5">{cat.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold text-secondary flex items-center gap-1 mt-1">
                    <span>+ Log 30m</span>
                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Workout History Log */}
          <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="text-base font-bold text-on-surface">Workout Activity History</h2>

            {workouts.length === 0 ? (
              <div className="py-8 text-center text-outline text-xs">
                No workouts logged yet. Click "Log Workout" above or pick an exercise from the library.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Activity</th>
                      <th className="py-3 px-3">Duration</th>
                      <th className="py-3 px-3">Intensity</th>
                      <th className="py-3 px-3">Est. Calories</th>
                      <th className="py-3 px-3">Notes</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 font-medium">
                    {workouts.map((w) => (
                      <tr key={w.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-3 text-on-surface">
                          {new Date(w.recorded_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">fitness_center</span>
                          <span>{w.activity_type}</span>
                        </td>
                        <td className="py-3 px-3 text-on-surface">{w.duration_minutes} mins</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                            {w.intensity}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-primary">{Math.round(w.calories_burned)} kcal</td>
                        <td className="py-3 px-3 text-outline max-w-xs truncate">{w.notes || "—"}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="p-1 text-outline hover:text-error transition-colors"
                            title="Delete log"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXERCISE DETAIL MODAL */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-wider">
                  {selectedExercise.category || "General"}
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mt-1">
                  {selectedExercise.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-outline flex-wrap">
                  <span><strong>Target:</strong> {selectedExercise.target_muscle}</span>
                  <span>•</span>
                  <span><strong>Body Part:</strong> {selectedExercise.body_part}</span>
                  {selectedExercise.equipment && (
                    <>
                      <span>•</span>
                      <span><strong>Equipment:</strong> {selectedExercise.equipment}</span>
                    </>
                  )}
                  {selectedExercise.difficulty && (
                    <>
                      <span>•</span>
                      <span><strong>Level:</strong> {selectedExercise.difficulty}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedExercise(null)}
                className="p-1.5 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-all"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Media Demonstration (Animation Player or WebP image) */}
            {selectedExercise.has_animation && selectedExercise.animation_frames?.length > 0 ? (
              <ExerciseAnimationPlayer
                frames={selectedExercise.animation_frames}
                sequence={selectedExercise.animation_sequence}
                frameDurationMs={selectedExercise.frame_duration_ms}
                alt={`${selectedExercise.name} animation`}
              />
            ) : selectedExercise.image_url ? (
              <div className="w-full h-56 sm:h-72 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800">
                <img
                  src={resolveAssetUrl(selectedExercise.image_url)}
                  alt={selectedExercise.name}
                  className="max-h-full max-w-full object-contain p-4"
                />
              </div>
            ) : null}

            {/* Description (if provided) */}
            {selectedExercise.description && (
              <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
                {selectedExercise.description}
              </p>
            )}

            {/* Step-by-Step Instructions */}
            {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-outline mb-2">
                  Step-by-Step Execution
                </h4>
                <ol className="flex flex-col gap-2">
                  {selectedExercise.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-on-surface">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Secondary Muscles & Form Tips */}
            {selectedExercise.secondary_muscles && selectedExercise.secondary_muscles.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                  Supporting Muscles
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedExercise.secondary_muscles.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedExercise.tips && selectedExercise.tips.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-secondary-container/30 border border-secondary/20">
                <h4 className="text-xs font-bold text-secondary mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
                  <span>Form Tips</span>
                </h4>
                <ul className="list-disc list-inside text-xs text-on-surface space-y-1">
                  {selectedExercise.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action & Calorie Expenditure Bar */}
            <div className="pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs">
                <span className="text-outline">Estimated Energy: </span>
                <strong className="text-primary font-bold">
                  {Math.round((selectedExercise.met || 4.5) * 30 * 1.05)} kcal
                </strong>
                <span className="text-outline"> per 30 minutes</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedExercise(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleLogExerciseFromCatalog(selectedExercise)}
                  className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_task</span>
                  <span>Log This Exercise</span>
                </button>
              </div>
            </div>

            {/* Attribution Notice */}
            <div className="pt-2 border-t border-outline-variant/10 text-[10px] text-outline leading-normal">
              <span>{selectedExercise.attribution}</span>
              {" • "}
              <a href="https://repdb.co" target="_blank" rel="noreferrer nofollow" className="underline hover:text-primary">
                RepDB
              </a>
              {" • "}
              <a href="https://github.com/ozansozuozgit/flow-exercise-dataset" target="_blank" rel="noreferrer" className="underline hover:text-primary">
                Flow Exercise Dataset
              </a>
            </div>
          </div>
        </div>
      )}

      {/* RECORD COMPLETED WORKOUT MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Record Completed Workout</h2>
              <button onClick={() => setShowLogModal(false)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Activity / Exercise Name</label>
                <input
                  type="text"
                  required
                  value={formData.activity_type}
                  onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    required
                    value={formData.duration_minutes}
                    onChange={(e) => {
                      const dur = parseInt(e.target.value, 10) || 0;
                      setFormData({
                        ...formData,
                        duration_minutes: e.target.value,
                        calories_burned: Math.round(5 * dur * 1.05),
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Intensity</label>
                  <select
                    value={formData.intensity}
                    onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Low">Low (Conversational)</option>
                    <option value="Moderate">Moderate (Sweating lightly)</option>
                    <option value="High">High (Vigorous breathing)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Est. Calories Burned (kcal)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.calories_burned}
                  onChange={(e) => setFormData({ ...formData, calories_burned: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 3 sets of 10 reps, felt strong"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Log Workout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
