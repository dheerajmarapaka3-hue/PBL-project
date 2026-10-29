import React, { useState, useEffect } from "react";
import { api } from "../api/client";

export default function DailyRoutines() {
  const [routines, setRoutines] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Routine Modal
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  const [routineForm, setRoutineForm] = useState({
    title: "",
    category: "Morning",
    target_time: "07:30",
    recurrence: "daily",
    icon: "check_circle",
  });

  // Add Goal Modal
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "",
    category: "activity",
    target_value: 150,
    current_value: 0,
    unit: "mins",
    deadline: "",
  });

  // AI Routine Generator State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGoalPrompt, setAiGoalPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [proposedPlan, setProposedPlan] = useState(null);
  const [selectedProposals, setSelectedProposals] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routinesRes, goalsRes] = await Promise.all([
        api.routines.list(),
        api.goals.list(),
      ]);
      setRoutines(routinesRes.data);
      setGoals(goalsRes.data);
    } catch (err) {
      console.error("Failed to load routines/goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (routineId) => {
    try {
      await api.routines.toggle(routineId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    try {
      await api.routines.create(routineForm);
      setShowAddRoutineModal(false);
      setRoutineForm({
        title: "",
        category: "Morning",
        target_time: "07:30",
        recurrence: "daily",
        icon: "check_circle",
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to create routine.");
    }
  };

  const handleDeleteRoutine = async (id) => {
    if (!window.confirm("Remove this routine?")) return;
    try {
      await api.routines.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await api.goals.create({
        ...goalForm,
        target_value: parseFloat(goalForm.target_value),
        current_value: parseFloat(goalForm.current_value) || 0,
      });
      setShowAddGoalModal(false);
      setGoalForm({
        title: "",
        category: "activity",
        target_value: 150,
        current_value: 0,
        unit: "mins",
        deadline: "",
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm("Remove this health goal?")) return;
    try {
      await api.goals.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // AI Routine Generator Prompt Submit
  const handleAiSuggest = async (e) => {
    e.preventDefault();
    if (!aiGoalPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await api.routines.aiSuggest(aiGoalPrompt);
      setProposedPlan(res.data);
      // Select all proposed items by default for convenience
      setSelectedProposals(res.data.proposed_routines.map((_, i) => i));
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan.");
    } finally {
      setAiGenerating(false);
    }
  };

  // Confirm and Save AI Proposed Routines
  const handleSaveSelectedProposals = async () => {
    if (!proposedPlan) return;
    try {
      for (const idx of selectedProposals) {
        const item = proposedPlan.proposed_routines[idx];
        await api.routines.create({
          title: item.title,
          category: item.category,
          target_time: item.target_time,
          recurrence: item.recurrence,
          icon: item.icon,
        });
      }
      setShowAiModal(false);
      setProposedPlan(null);
      setAiGoalPrompt("");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving proposed routines.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-semibold text-on-surface-variant">Loading Routines & Goals...</span>
      </div>
    );
  }

  const completedTodayCount = routines.filter((r) => r.completed_today).length;
  const routinePct = routines.length > 0 ? Math.round((completedTodayCount / routines.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Daily Routines & Goals</h1>
          <p className="text-xs text-on-surface-variant">
            Nurture sustainable lifestyle habits, sustain daily streaks, and achieve tangible wellness goals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setProposedPlan(null);
              setShowAiModal(true);
            }}
            className="px-4 py-2.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold hover:bg-secondary hover:text-white transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>AI Routine Planner</span>
          </button>

          <button
            onClick={() => setShowAddRoutineModal(true)}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Routine</span>
          </button>
        </div>
      </div>

      {/* Routine Progress Bento */}
      <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-fixed/50 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[32px]">task_alt</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Today's Discipline</span>
            <h2 className="text-xl font-extrabold text-on-surface">
              {completedTodayCount} of {routines.length} Habits Completed
            </h2>
            <p className="text-xs text-on-surface-variant">
              {routinePct >= 80 ? "Radiant momentum! Your habits anchor total vitality." : "Keep up the gentle consistency today."}
            </p>
          </div>
        </div>

        <div className="w-full md:w-64 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-on-surface">Daily Completion</span>
            <span className="text-primary">{routinePct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
              style={{ width: `${routinePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Active Routines List */}
      <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface">Daily Habits Checklist</h2>
          <span className="text-xs text-outline">{routines.length} Routines Configured</span>
        </div>

        {routines.length === 0 ? (
          <div className="py-10 text-center text-outline text-xs border border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[36px]">checklist</span>
            <p>You haven't added any daily routines yet.</p>
            <button
              onClick={() => setShowAddRoutineModal(true)}
              className="mt-1 text-xs font-bold text-primary hover:underline"
            >
              + Create your first healthy habit
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {routines.map((routine) => (
              <div
                key={routine.id}
                onClick={() => handleToggle(routine.id)}
                className={`p-4 rounded-2xl flex items-center justify-between gap-3 border cursor-pointer transition-all ${
                  routine.completed_today
                    ? "bg-primary-fixed/20 border-primary/30"
                    : "bg-surface-container-low border-outline-variant/20 hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <button
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      routine.completed_today ? "bg-primary text-white shadow-xs" : "border-2 border-outline-variant"
                    }`}
                  >
                    {routine.completed_today && (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    )}
                  </button>

                  <div>
                    <h3
                      className={`text-sm font-bold leading-tight ${
                        routine.completed_today ? "line-through text-outline" : "text-on-surface"
                      }`}
                    >
                      {routine.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {routine.category} • {routine.recurrence} {routine.target_time ? `• at ${routine.target_time}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {routine.streak_days > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container text-xs font-bold flex items-center gap-1">
                      🔥 {routine.streak_days} days
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoutine(routine.id);
                    }}
                    className="p-1 text-outline hover:text-error transition-colors"
                    title="Remove routine"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wellness Goals Section */}
      <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">flag</span>
            <h2 className="text-base font-bold text-on-surface">Wellness Goals</h2>
          </div>
          <button
            onClick={() => setShowAddGoalModal(true)}
            className="text-xs font-bold text-primary hover:underline"
          >
            + Set New Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="py-8 text-center text-outline text-xs">
            No long-term wellness goals set yet. Add goals for hydration, workout frequency, or sleep.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
              return (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                        {g.category}
                      </span>
                      <h3 className="text-sm font-bold text-on-surface mt-0.5">{g.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1 text-outline hover:text-error"
                      title="Remove goal"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between text-xs font-extrabold mb-1">
                      <span className="text-on-surface">
                        {g.current_value} / {g.target_value} {g.unit}
                      </span>
                      <span className="text-primary">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {g.deadline && <p className="text-[10px] text-outline">Deadline: {g.deadline}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Routine Plan Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-outline-variant/30 animate-fadeIn max-h-[85vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
                <h2 className="text-lg font-bold text-on-surface">AI Habit Plan Generator</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Describe your wellness aspiration in natural language. AI Mate will generate an evidence-backed
              habit proposal that you can review and edit before saving.
            </p>

            <form onSubmit={handleAiSuggest} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Build a restorative evening sleep & wind-down routine"
                  value={aiGoalPrompt}
                  onChange={(e) => setAiGoalPrompt(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="submit"
                  disabled={aiGenerating || !aiGoalPrompt.trim()}
                  className="px-4 py-2.5 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-50 active:scale-95 transition-all shadow-xs"
                >
                  {aiGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>

            {/* Proposed Plan Review Area */}
            {proposedPlan && (
              <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/20">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{proposedPlan.plan_title}</h3>
                  <p className="text-xs text-outline">{proposedPlan.plan_description}</p>
                </div>

                <div className="flex flex-col gap-2">
                  {proposedPlan.proposed_routines.map((item, idx) => {
                    const isChecked = selectedProposals.includes(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedProposals(selectedProposals.filter((i) => i !== idx));
                          } else {
                            setSelectedProposals([...selectedProposals, idx]);
                          }
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? "bg-primary-fixed/20 border-primary/40"
                            : "bg-surface-container-low border-outline-variant/20 opacity-60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-on-surface">{item.title}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            {item.category} • {item.target_time}
                          </p>
                          <p className="text-[10px] text-outline italic mt-0.5">{item.reason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-outline">
                    {selectedProposals.length} of {proposedPlan.proposed_routines.length} selected
                  </span>
                  <button
                    onClick={handleSaveSelectedProposals}
                    disabled={selectedProposals.length === 0}
                    className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    Save Selected Habits
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Routine Modal */}
      {showAddRoutineModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Add Wellness Routine</h2>
              <button onClick={() => setShowAddRoutineModal(false)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateRoutine} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Habit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500ml Morning Water, 15m Walk"
                  value={routineForm.title}
                  onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Category</label>
                  <select
                    value={routineForm.category}
                    onChange={(e) => setRoutineForm({ ...routineForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Anytime">Anytime</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Target Time</label>
                  <input
                    type="time"
                    value={routineForm.target_time}
                    onChange={(e) => setRoutineForm({ ...routineForm, target_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Recurrence</label>
                <select
                  value={routineForm.recurrence}
                  onChange={(e) => setRoutineForm({ ...routineForm, recurrence: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekends">Weekends only</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoutineModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Set Wellness Goal</h2>
              <button onClick={() => setShowAddGoalModal(false)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 150 Active Cardio Minutes / Week"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Target Value</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={goalForm.target_value}
                    onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mins, steps, ml"
                    value={goalForm.unit}
                    onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
