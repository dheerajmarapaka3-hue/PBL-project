import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);
  const [logFormData, setLogFormData] = useState({
    type: "blood_pressure",
    value_primary: "",
    value_secondary: "",
    unit: "mmHg",
    notes: "",
  });
  const [logLoading, setLogLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.dashboard.getSummary();
      setDashboardData(res.data);
      setError("");
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setError("Unable to load health dashboard. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Quick Action: Quick Add 250ml Water
  const handleQuickAddWater = async () => {
    try {
      await api.vitals.createMeasurement({
        type: "water",
        value_primary: 250.0,
        unit: "ml",
        notes: "Quick hydration log from dashboard",
      });
      showToast("Hydration logged! +250ml 💧");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle routine status from dashboard
  const handleToggleRoutine = async (routineId) => {
    try {
      await api.routines.toggle(routineId);
      showToast("Habit updated! 🌿");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  // Update dose status from dashboard
  const handleDoseStatus = async (doseId, status) => {
    try {
      await api.medicines.updateDoseStatus(doseId, status);
      showToast(status === "taken" ? "Dose recorded as taken! 💊" : "Dose marked skipped.");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit quick vitals modal
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setLogLoading(true);
    try {
      await api.vitals.createMeasurement({
        type: logFormData.type,
        value_primary: parseFloat(logFormData.value_primary),
        value_secondary: logFormData.value_secondary ? parseFloat(logFormData.value_secondary) : null,
        unit: logFormData.unit,
        notes: logFormData.notes || null,
      });
      setShowLogModal(false);
      setLogFormData({
        type: "blood_pressure",
        value_primary: "",
        value_secondary: "",
        unit: "mmHg",
        notes: "",
      });
      showToast("Health vital recorded! ✨");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Failed to log measurement. Check your values.");
    } finally {
      setLogLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-semibold text-on-surface-variant">Synthesizing health metrics...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="rounded-3xl p-6 bg-error-container/30 border border-error/20 flex flex-col items-center text-center gap-3">
        <span className="material-symbols-outlined text-error text-[36px]">error</span>
        <h2 className="text-base font-bold text-error">Dashboard Notice</h2>
        <p className="text-xs text-on-surface-variant max-w-md">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { vitality, proactive_insight, today_doses, today_routines, nutrition_summary, recent_documents } =
    dashboardData;

  // Calculate circular gauge offset for vitality score (dasharray 301.6)
  const score = vitality.total_score || 0;
  const circumference = 301.6;
  const dashoffset = circumference - (circumference * Math.min(100, Math.max(0, score))) / 100;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all bg-primary text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-md text-xs font-bold animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Greeting & Status Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Encrypted Health Vault • Live Database</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">
            {dashboardData.greeting} <span className="inline-block text-secondary">🌿</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            {vitality.status_label}: {vitality.explanation}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Log Vital</span>
          </button>
        </div>
      </div>

      {/* 1. Proactive AI Companion Insight Card */}
      <div className="relative overflow-hidden rounded-3xl p-5 md:p-6 bg-gradient-to-br from-white/90 via-white/70 to-surface-container/60 shadow-[0_12px_32px_-6px_rgba(0,105,72,0.12)] backdrop-blur-xl border border-white">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-secondary-fixed/40 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-tertiary-fixed/40 blur-2xl pointer-events-none" />

        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-tertiary flex items-center justify-center text-white shadow-md flex-shrink-0">
            <span className="material-symbols-outlined text-[26px]">auto_awesome</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-primary tracking-wider uppercase">
                {proactive_insight.tag}
              </span>
              <span className="text-[11px] font-semibold text-outline">{proactive_insight.timestamp}</span>
            </div>
            <p className="text-sm text-on-surface font-medium leading-relaxed">{proactive_insight.message}</p>

            <div className="mt-3 flex items-center gap-3">
              <Link
                to="/assistant"
                className="px-4 py-2 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>{proactive_insight.action_label}</span>
              </Link>
              <Link
                to="/routines"
                className="px-3.5 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold active:scale-95 transition-all"
              >
                Review Habits
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid: Vitality Synthesis & Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Vitality Score Bento Card */}
        <div className="lg:col-span-1 rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Today's Vitality</span>
              <h2 className="text-lg font-bold text-on-surface">Health Synthesis</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">
              {vitality.percentile}
            </span>
          </div>

          {/* SVG Gauge */}
          <div className="flex items-center justify-center my-3">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="vitalityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#006948" />
                    <stop offset="50%" stopColor="#007bb9" />
                    <stop offset="100%" stopColor="#86f2e4" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="48" fill="transparent" stroke="#eaedff" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="transparent"
                  stroke="url(#vitalityGradient)"
                  strokeWidth="10"
                  strokeDasharray="301.6"
                  strokeDashoffset={dashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-on-surface leading-none">{score}</span>
                <span className="text-[10px] text-outline font-bold mt-0.5">/ 100 VIBE</span>
              </div>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-on-surface-variant">Hydration</span>
              <span className="font-bold text-on-surface">{vitality.hydration_score} / 20</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-tertiary transition-all"
                style={{ width: `${(vitality.hydration_score / 20) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium mt-1">
              <span className="text-on-surface-variant">Sleep Rest</span>
              <span className="font-bold text-on-surface">{vitality.sleep_score} / 25</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(vitality.sleep_score / 25) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium mt-1">
              <span className="text-on-surface-variant">Daily Habits</span>
              <span className="font-bold text-on-surface">{vitality.routine_score} / 25</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container">
              <div
                className="h-full rounded-full bg-secondary transition-all"
                style={{ width: `${(vitality.routine_score / 25) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Health Metrics Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-2 gap-4">
          {/* Water Intake Card */}
          <div className="rounded-3xl p-5 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-tertiary-fixed/50 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">water_drop</span>
              </div>
              <button
                onClick={handleQuickAddWater}
                className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold hover:bg-tertiary hover:text-white transition-all active:scale-95"
              >
                +250ml
              </button>
            </div>
            <div className="mt-4">
              <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Hydration</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-on-surface">{nutrition_summary.water_ml || 0}</span>
                <span className="text-xs text-outline font-medium">/ {nutrition_summary.target_water_ml} ml</span>
              </div>
            </div>
          </div>

          {/* Blood Pressure Card */}
          <div className="rounded-3xl p-5 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-error-container/60 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">favorite</span>
              </div>
              <Link to="/tracking" className="text-xs text-primary font-bold hover:underline">
                View Trends
              </Link>
            </div>
            <div className="mt-4">
              <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Blood Pressure</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-on-surface">
                  {dashboardData.vitals_summary.find((s) => s.type === "blood_pressure")?.latest_value_primary || "—"}
                  {dashboardData.vitals_summary.find((s) => s.type === "blood_pressure")?.latest_value_secondary
                    ? `/${dashboardData.vitals_summary.find((s) => s.type === "blood_pressure").latest_value_secondary}`
                    : ""}
                </span>
                <span className="text-xs text-outline font-medium">mmHg</span>
              </div>
            </div>
          </div>

          {/* Sleep Card */}
          <div className="rounded-3xl p-5 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">bedtime</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                Target: 8h
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Restorative Sleep</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-on-surface">
                  {dashboardData.vitals_summary.find((s) => s.type === "sleep")?.latest_value_primary || "—"}
                </span>
                <span className="text-xs text-outline font-medium">hours</span>
              </div>
            </div>
          </div>

          {/* Active Workout Minutes Card */}
          <div className="rounded-3xl p-5 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-primary-fixed/50 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">fitness_center</span>
              </div>
              <Link to="/workouts" className="text-xs text-primary font-bold hover:underline">
                Workouts
              </Link>
            </div>
            <div className="mt-4">
              <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Weekly Active</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-on-surface">{dashboardData.weekly_active_minutes}</span>
                <span className="text-xs text-outline font-medium">/ 150 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Section: Today's Medicines & Today's Routines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today's Medicines Card */}
        <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">medication</span>
              <h2 className="text-base font-bold text-on-surface">Scheduled Doses Today</h2>
            </div>
            <Link to="/medicines" className="text-xs font-bold text-primary hover:underline">
              Manage Meds
            </Link>
          </div>

          {today_doses.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-outline">
              <span className="material-symbols-outlined text-[32px] mb-1">check_circle</span>
              <p className="text-xs">No medicine doses scheduled for today.</p>
              <Link to="/medicines" className="mt-2 text-xs font-bold text-primary hover:underline">
                + Add Medicine
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {today_doses.map((dose) => (
                <div
                  key={dose.id}
                  className="p-3.5 rounded-2xl bg-surface-container-low flex items-center justify-between gap-3 border border-outline-variant/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-primary font-bold shadow-xs">
                      <span className="text-xs">{dose.scheduled_time}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface leading-tight">{dose.medicine_name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {dose.dosage} • {dose.instructions}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {dose.status === "taken" ? (
                      <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check</span> Taken
                      </span>
                    ) : dose.status === "skipped" ? (
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-outline text-xs font-bold">
                        Skipped
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDoseStatus(dose.id, "taken")}
                          className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-container active:scale-95 transition-all shadow-xs"
                        >
                          Take
                        </button>
                        <button
                          onClick={() => handleDoseStatus(dose.id, "skipped")}
                          className="p-1.5 text-outline hover:text-on-surface transition-colors"
                          title="Skip dose"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Routines Card */}
        <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">checklist</span>
              <h2 className="text-base font-bold text-on-surface">Daily Wellness Routines</h2>
            </div>
            <Link to="/routines" className="text-xs font-bold text-primary hover:underline">
              All Routines
            </Link>
          </div>

          {today_routines.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-outline">
              <span className="material-symbols-outlined text-[32px] mb-1">spa</span>
              <p className="text-xs">No active daily habits yet.</p>
              <Link to="/routines" className="mt-2 text-xs font-bold text-primary hover:underline">
                + Create Routine
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {today_routines.map((routine) => (
                <div
                  key={routine.id}
                  onClick={() => handleToggleRoutine(routine.id)}
                  className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border cursor-pointer transition-all ${
                    routine.completed_today
                      ? "bg-primary-fixed/20 border-primary/30"
                      : "bg-surface-container-low border-outline-variant/20 hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        routine.completed_today ? "bg-primary text-white" : "border-2 border-outline-variant"
                      }`}
                    >
                      {routine.completed_today && (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold leading-tight ${
                          routine.completed_today ? "line-through text-outline" : "text-on-surface"
                        }`}
                      >
                        {routine.title}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {routine.category} {routine.target_time ? `• ${routine.target_time}` : ""}
                      </p>
                    </div>
                  </div>

                  {routine.streak_days > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[11px] font-bold flex items-center gap-1">
                      🔥 {routine.streak_days}d
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Medical Documents Preview */}
      <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">description</span>
            <h2 className="text-base font-bold text-on-surface">Recent Medical Documents</h2>
          </div>
          <Link to="/reports" className="text-xs font-bold text-primary hover:underline">
            View All Reports
          </Link>
        </div>

        {recent_documents.length === 0 ? (
          <div className="py-6 text-center text-outline">
            <p className="text-xs">No medical reports uploaded yet.</p>
            <Link to="/reports" className="mt-1 inline-block text-xs font-bold text-primary hover:underline">
              + Upload Report or Prescription
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recent_documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-2"
              >
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-bold text-primary uppercase">
                    {doc.category}
                  </span>
                  <h3 className="text-xs font-bold text-on-surface mt-1.5 truncate">{doc.title}</h3>
                  <p className="text-[11px] text-outline">{doc.document_date}</p>
                </div>
                <Link
                  to="/reports"
                  className="text-[11px] font-bold text-secondary flex items-center gap-1 hover:underline mt-1"
                >
                  <span>Open details</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Log Measurement Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Log Health Measurement</h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-full text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Measurement Type</label>
                <select
                  value={logFormData.type}
                  onChange={(e) => {
                    const t = e.target.value;
                    let u = "mmHg";
                    if (t === "heart_rate") u = "bpm";
                    else if (t === "weight") u = "kg";
                    else if (t === "sleep") u = "hours";
                    else if (t === "water") u = "ml";
                    else if (t === "blood_glucose") u = "mg/dL";
                    else if (t === "body_temp") u = "°C";
                    else if (t === "steps") u = "steps";
                    setLogFormData({ ...logFormData, type: t, unit: u });
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="blood_pressure">Blood Pressure (Systolic / Diastolic)</option>
                  <option value="heart_rate">Heart Rate (Pulse)</option>
                  <option value="sleep">Sleep Duration</option>
                  <option value="water">Water Intake</option>
                  <option value="weight">Body Weight</option>
                  <option value="blood_glucose">Blood Glucose</option>
                  <option value="steps">Daily Steps</option>
                  <option value="body_temp">Body Temperature</option>
                </select>
              </div>

              {/* Primary Value Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">
                  {logFormData.type === "blood_pressure" ? "Systolic Value" : "Value"} ({logFormData.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={logFormData.type === "blood_pressure" ? "e.g. 120" : "Enter value"}
                  value={logFormData.value_primary}
                  onChange={(e) => setLogFormData({ ...logFormData, value_primary: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Secondary Value (Diastolic for BP) */}
              {logFormData.type === "blood_pressure" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Diastolic Value (mmHg)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 80"
                    value={logFormData.value_secondary}
                    onChange={(e) => setLogFormData({ ...logFormData, value_secondary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. After morning walk"
                  value={logFormData.notes}
                  onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logLoading}
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {logLoading ? "Saving..." : "Save Measurement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
