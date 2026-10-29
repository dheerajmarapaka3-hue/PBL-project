import React, { useState, useEffect } from "react";
import { api } from "../api/client";

export default function NutritionDiary() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [mealCategory, setMealCategory] = useState("breakfast");
  const [formData, setFormData] = useState({
    meal_type: "breakfast",
    food_name: "",
    portion: "1 plate",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchNutritionData = async () => {
    try {
      setLoading(true);
      const res = await api.nutrition.getDailySummary(selectedDate);
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch nutrition data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionData();
  }, [selectedDate]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.nutrition.logMeal({
        meal_type: formData.meal_type,
        food_name: formData.food_name.strip ? formData.food_name.strip() : formData.food_name,
        portion: formData.portion,
        calories: parseFloat(formData.calories) || 0,
        protein_g: parseFloat(formData.protein_g) || 0,
        carbs_g: parseFloat(formData.carbs_g) || 0,
        fat_g: parseFloat(formData.fat_g) || 0,
        notes: formData.notes || null,
        recorded_at: new Date(selectedDate + "T12:00:00").toISOString(),
      });
      setShowAddModal(false);
      setFormData({
        meal_type: "breakfast",
        food_name: "",
        portion: "1 serving",
        calories: "",
        protein_g: "",
        carbs_g: "",
        fat_g: "",
        notes: "",
      });
      fetchNutritionData();
    } catch (err) {
      console.error(err);
      alert("Failed to log food entry. Check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (id) => {
    if (!window.confirm("Delete this food entry?")) return;
    try {
      await api.nutrition.deleteMeal(id);
      fetchNutritionData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickWater = async () => {
    try {
      await api.vitals.createMeasurement({
        type: "water",
        value_primary: 250,
        unit: "ml",
        notes: "Quick hydration from Nutrition Diary",
      });
      fetchNutritionData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-semibold text-on-surface-variant">Loading Nutrition Diary...</span>
      </div>
    );
  }

  const calProgress = Math.min(100, Math.round((summary.total_calories / summary.target_calories) * 100));
  const waterProgress = Math.min(100, Math.round((summary.water_intake_ml / summary.target_water_ml) * 100));

  const mealSections = [
    { key: "breakfast", label: "Breakfast", icon: "sunny", time: "Morning" },
    { key: "lunch", label: "Lunch", icon: "wb_sunny", time: "Midday" },
    { key: "dinner", label: "Dinner", icon: "bedtime", time: "Evening" },
    { key: "snack", label: "Snacks & Drinks", icon: "cookie", time: "Anytime" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header & Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Nutrition & Food Diary</h1>
          <p className="text-xs text-on-surface-variant">
            Track wholesome food intake, observe macronutrient balance, and stay properly hydrated.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-full bg-white border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          <button
            onClick={() => {
              setFormData({ ...formData, meal_type: "breakfast" });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Log Meal</span>
          </button>
        </div>
      </div>

      {/* Top Bento: Daily Caloric & Macro Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Calories Bento */}
        <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Energy Budget</span>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
              {calProgress}% Goal
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-on-surface">{Math.round(summary.total_calories)}</span>
              <span className="text-xs text-outline font-semibold">/ {summary.target_calories} kcal</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              {summary.target_calories - summary.total_calories > 0
                ? `${Math.round(summary.target_calories - summary.total_calories)} kcal remaining today`
                : "Calorie target reached"}
            </p>
          </div>

          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${calProgress}%` }} />
          </div>
        </div>

        {/* Macronutrients Bento */}
        <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Macronutrients</span>
            <span className="text-xs text-outline font-bold">Logged Today</span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 text-center">
            <div className="p-2 rounded-2xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-[10px] text-primary font-bold block uppercase">Protein</span>
              <span className="text-base font-extrabold text-on-surface">{summary.total_protein_g}g</span>
            </div>
            <div className="p-2 rounded-2xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-[10px] text-tertiary font-bold block uppercase">Carbs</span>
              <span className="text-base font-extrabold text-on-surface">{summary.total_carbs_g}g</span>
            </div>
            <div className="p-2 rounded-2xl bg-surface-container-low border border-outline-variant/20">
              <span className="text-[10px] text-secondary font-bold block uppercase">Fats</span>
              <span className="text-base font-extrabold text-on-surface">{summary.total_fat_g}g</span>
            </div>
          </div>

          <p className="text-[11px] text-outline text-center">Balanced macronutrient breakdown promotes sustained energy.</p>
        </div>

        {/* Hydration Bento */}
        <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Daily Hydration</span>
            <button
              onClick={handleQuickWater}
              className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold hover:bg-tertiary hover:text-white transition-all active:scale-95"
            >
              +250ml
            </button>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-on-surface">{summary.water_intake_ml}</span>
              <span className="text-xs text-outline font-semibold">/ {summary.target_water_ml} ml</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">{waterProgress}% of optimal hydration</p>
          </div>

          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div className="h-full rounded-full bg-tertiary transition-all" style={{ width: `${waterProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Categorized Meal Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mealSections.map((sec) => {
          const items = summary.meals_by_type[sec.key] || [];
          const sectionCals = Math.round(items.reduce((acc, curr) => acc + curr.calories, 0));

          return (
            <div
              key={sec.key}
              className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">{sec.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{sec.label}</h3>
                    <span className="text-[10px] text-outline">{sec.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-on-surface">{sectionCals} kcal</span>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, meal_type: sec.key });
                      setShowAddModal(true);
                    }}
                    className="p-1.5 rounded-full text-outline hover:text-primary transition-colors"
                    title={`Add food to ${sec.label}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-6 text-center text-outline text-xs border border-dashed border-outline-variant/30 rounded-2xl">
                  No foods recorded for {sec.label.toLowerCase()} yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-on-surface">{meal.food_name}</p>
                        <p className="text-[10px] text-outline">
                          {meal.portion} • P: {meal.protein_g}g | C: {meal.carbs_g}g | F: {meal.fat_g}g
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-on-surface">{Math.round(meal.calories)} kcal</span>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="p-1 text-outline hover:text-error transition-colors"
                          title="Delete entry"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Log Food Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Meal Type</label>
                  <select
                    value={formData.meal_type}
                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Portion / Serving</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 bowl, 200g"
                    value={formData.portion}
                    onChange={(e) => setFormData({ ...formData, portion: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Food / Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steel-cut Oatmeal with Berries"
                  value={formData.food_name}
                  onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface">Calories (kcal)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="350"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface">Protein (g)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="15"
                    value={formData.protein_g}
                    onChange={(e) => setFormData({ ...formData, protein_g: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface">Carbs (g)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="45"
                    value={formData.carbs_g}
                    onChange={(e) => setFormData({ ...formData, carbs_g: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-on-surface">Fats (g)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="8"
                    value={formData.fat_g}
                    onChange={(e) => setFormData({ ...formData, fat_g: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cooked with almond milk"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Log Food"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
