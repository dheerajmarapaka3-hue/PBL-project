import React, { useState, useEffect } from "react";
import { api } from "../api/client";

export default function MeditationYoga() {
  const [sessions, setSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Interactive Player state
  const [activeSession, setActiveSession] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [breathePhase, setBreathePhase] = useState("Inhale"); // Inhale, Hold, Exhale, Rest
  const [phaseSeconds, setPhaseSeconds] = useState(4);
  const [completedCelebration, setCompletedCelebration] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, historyRes] = await Promise.all([
        api.meditation.getCatalog(),
        api.meditation.getHistory(),
      ]);
      setSessions(sessionsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to load meditation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer loop for active session
  useEffect(() => {
    let interval = null;
    if (isPlaying && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });

        // Breathing cycle logic
        setPhaseSeconds((prev) => {
          if (prev <= 1) {
            if (activeSession?.id === "deep-478") {
              if (breathePhase === "Inhale") {
                setBreathePhase("Hold");
                return 7;
              } else if (breathePhase === "Hold") {
                setBreathePhase("Exhale");
                return 8;
              } else {
                setBreathePhase("Inhale");
                return 4;
              }
            } else {
              // Box breathing 4-4-4-4 default
              if (breathePhase === "Inhale") {
                setBreathePhase("Hold");
                return 4;
              } else if (breathePhase === "Hold") {
                setBreathePhase("Exhale");
                return 4;
              } else if (breathePhase === "Exhale") {
                setBreathePhase("Rest");
                return 4;
              } else {
                setBreathePhase("Inhale");
                return 4;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, secondsRemaining, breathePhase, activeSession]);

  const startSession = (session) => {
    setActiveSession(session);
    const secs = session.duration_minutes * 60;
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setIsPlaying(true);
    setBreathePhase("Inhale");
    setPhaseSeconds(4);
    setCompletedCelebration(false);
  };

  const handleCompleteSession = async () => {
    setIsPlaying(false);
    if (!activeSession) return;
    try {
      await api.meditation.complete({
        session_name: activeSession.title,
        session_type: activeSession.category,
        duration_minutes: activeSession.duration_minutes,
        notes: "Completed with guided timer visualizer",
      });
      setCompletedCelebration(true);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-semibold text-on-surface-variant">Centering Mindful Space...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Meditation & Yoga</h1>
        <p className="text-xs text-on-surface-variant">
          Cultivate inner calm, regulate autonomic stress, and restore mobility through guided breathwork and mindful postures.
        </p>
      </div>

      {/* Guided Sessions Catalog Grid */}
      <div>
        <h2 className="text-base font-bold text-on-surface mb-3">Curated Guided Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl p-5 bg-white border border-outline-variant/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[10px] font-bold uppercase">
                    {s.category}
                  </span>
                  <span className="text-xs font-semibold text-outline">{s.duration_minutes} mins</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface leading-tight">{s.title}</h3>
                </div>

                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{s.description}</p>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-outline italic">Guided Visualizer</span>
                <button
                  onClick={() => startSession(s)}
                  className="px-4 py-2 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Begin Session</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mindfulness History */}
      <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <h2 className="text-base font-bold text-on-surface">Mindfulness Practice History</h2>

        {history.length === 0 ? (
          <div className="py-8 text-center text-outline text-xs">
            No completed sessions recorded yet. Select any breathing or yoga session above to begin your practice!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date Completed</th>
                  <th className="py-3 px-3">Practice Name</th>
                  <th className="py-3 px-3">Modality</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-medium">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3 text-on-surface">
                      {new Date(h.completed_at).toLocaleDateString()}{" "}
                      <span className="text-outline">
                        {new Date(h.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">spa</span>
                      <span>{h.session_name}</span>
                    </td>
                    <td className="py-3 px-3 text-on-surface">{h.session_type}</td>
                    <td className="py-3 px-3 font-bold text-primary">{h.duration_minutes} mins</td>
                    <td className="py-3 px-3 text-outline max-w-xs truncate">{h.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Guided Session Modal */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-gradient-to-br from-white via-surface to-surface-container rounded-3xl p-6 md:p-8 shadow-2xl border border-white flex flex-col items-center text-center gap-6 animate-fadeIn relative">
            <button
              onClick={() => {
                setIsPlaying(false);
                setActiveSession(null);
              }}
              className="absolute top-5 right-5 p-1 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>

            <div>
              <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold uppercase">
                {activeSession.category}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mt-2">{activeSession.title}</h2>
              <p className="text-xs text-on-surface-variant max-w-sm mt-1">{activeSession.guidance}</p>
            </div>

            {/* Interactive Animated Breathing Visualizer */}
            <div className="relative w-48 h-48 flex items-center justify-center my-2">
              {/* Outer Glowing Rings */}
              <div
                className={`absolute w-full h-full rounded-full bg-gradient-to-tr from-primary/20 via-secondary/20 to-tertiary/20 blur-xl transition-all duration-1000 ${
                  breathePhase === "Inhale"
                    ? "scale-125 opacity-90"
                    : breathePhase === "Hold"
                    ? "scale-110 opacity-70"
                    : "scale-90 opacity-40"
                }`}
              />

              {/* Dynamic Center Circle */}
              <div
                className={`w-36 h-36 rounded-full bg-gradient-to-tr from-primary via-secondary to-tertiary text-white flex flex-col items-center justify-center shadow-xl transition-all duration-1000 ease-in-out ${
                  breathePhase === "Inhale"
                    ? "scale-115"
                    : breathePhase === "Hold"
                    ? "scale-110 ring-4 ring-white/50"
                    : "scale-90"
                }`}
              >
                <span className="text-sm font-extrabold uppercase tracking-widest">{breathePhase}</span>
                <span className="text-2xl font-black mt-0.5">{phaseSeconds}s</span>
              </div>
            </div>

            {/* Session Countdown Timer */}
            <div>
              <span className="text-3xl font-extrabold text-on-surface tracking-tight">
                {formatTime(secondsRemaining)}
              </span>
              <p className="text-[11px] text-outline font-medium">Session Time Remaining</p>
            </div>

            {completedCelebration && (
              <div className="p-3 rounded-2xl bg-primary text-white text-xs font-bold animate-bounce flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Session completed & recorded in your wellness journal! 🌿</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <span className="material-symbols-outlined text-[32px]">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>

              <button
                onClick={() => {
                  setSecondsRemaining(totalSeconds);
                  setBreathePhase("Inhale");
                  setPhaseSeconds(4);
                }}
                className="w-11 h-11 rounded-full bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center active:scale-95 transition-all"
                title="Reset timer"
              >
                <span className="material-symbols-outlined text-[20px]">restart_alt</span>
              </button>

              <button
                onClick={handleCompleteSession}
                className="px-4 py-2.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold hover:bg-secondary hover:text-white active:scale-95 transition-all shadow-xs"
              >
                Complete & Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
