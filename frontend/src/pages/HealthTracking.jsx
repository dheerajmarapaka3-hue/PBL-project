import React, { useState, useEffect } from "react";
import { api } from "../api/client";

export default function HealthTracking() {
  const [analytics, setAnalytics] = useState([]);
  const [selectedType, setSelectedType] = useState("blood_pressure");
  const [timeframe, setTimeframe] = useState(30); // 7, 30, 90
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "blood_pressure",
    value_primary: "",
    value_secondary: "",
    unit: "mmHg",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchVitalsData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, historyRes] = await Promise.all([
        api.vitals.getAnalytics(timeframe),
        api.vitals.getMeasurements(selectedType),
      ]);
      setAnalytics(analyticsRes.data);
      setHistoryList(historyRes.data);
    } catch (err) {
      console.error("Vitals load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitalsData();
  }, [timeframe, selectedType]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.vitals.createMeasurement({
        type: formData.type,
        value_primary: parseFloat(formData.value_primary),
        value_secondary: formData.value_secondary ? parseFloat(formData.value_secondary) : null,
        unit: formData.unit,
        notes: formData.notes || null,
      });
      setShowModal(false);
      setFormData({
        type: selectedType,
        value_primary: "",
        value_secondary: "",
        unit: formData.unit,
        notes: "",
      });
      fetchVitalsData();
    } catch (err) {
      console.error(err);
      alert("Failed to save measurement. Check values.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recorded measurement?")) return;
    try {
      await api.vitals.deleteMeasurement(id);
      fetchVitalsData();
    } catch (err) {
      console.error(err);
    }
  };

  const currentSummary = analytics.find((a) => a.type === selectedType) || {
    type: selectedType,
    unit: "",
    history: [],
    normal_range: "Standard",
    status: "No Data",
  };

  // Generate SVG path for trend points
  const points = currentSummary.history || [];
  let svgPath = "";
  if (points.length > 1) {
    const minVal = Math.min(...points.map((p) => p.value_primary));
    const maxVal = Math.max(...points.map((p) => p.value_primary));
    const range = maxVal - minVal || 1;
    const width = 600;
    const height = 180;
    const padding = 20;

    const coords = points.map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.value_primary - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    svgPath = "M " + coords.join(" L ");
  }

  const metricTypes = [
    { key: "blood_pressure", label: "Blood Pressure", icon: "favorite", unit: "mmHg" },
    { key: "heart_rate", label: "Heart Rate", icon: "ecg", unit: "bpm" },
    { key: "sleep", label: "Sleep Duration", icon: "bedtime", unit: "hours" },
    { key: "water", label: "Hydration", icon: "water_drop", unit: "ml" },
    { key: "weight", label: "Body Weight", icon: "monitor_weight", unit: "kg" },
    { key: "blood_glucose", label: "Blood Glucose", icon: "bloodtype", unit: "mg/dL" },
    { key: "steps", label: "Daily Steps", icon: "directions_walk", unit: "steps" },
    { key: "body_temp", label: "Temperature", icon: "device_thermostat", unit: "°C" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Page Title & Log Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Health Vitals & Analytics</h1>
          <p className="text-xs text-on-surface-variant">
            Track biological measurements, review longitudinal trends, and identify healthy patterns.
          </p>
        </div>

        <button
          onClick={() => {
            const currentObj = metricTypes.find((m) => m.key === selectedType);
            setFormData({
              type: selectedType,
              value_primary: "",
              value_secondary: "",
              unit: currentObj?.unit || "mmHg",
              notes: "",
            });
            setShowModal(true);
          }}
          className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Record Measurement</span>
        </button>
      </div>

      {/* Metric Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {metricTypes.map((m) => {
          const isSelected = selectedType === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setSelectedType(m.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-on-surface hover:bg-surface-container-low border border-outline-variant/30"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Metric Summary Bento & Trend Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-on-surface">
                {metricTypes.find((m) => m.key === selectedType)?.label} Trend
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                {currentSummary.status}
              </span>
            </div>
            <p className="text-xs text-outline mt-0.5">Reference Target: {currentSummary.normal_range}</p>
          </div>

          {/* Timeframe Selector (7d, 30d, 90d) */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-surface-container-low border border-outline-variant/30 self-start sm:self-auto">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setTimeframe(d)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  timeframe === d ? "bg-white text-primary shadow-xs" : "text-outline hover:text-on-surface"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {/* 4 Overview Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Latest Entry</span>
            <p className="text-xl font-extrabold text-on-surface mt-1">
              {currentSummary.latest_value_primary != null ? currentSummary.latest_value_primary : "—"}
              {currentSummary.latest_value_secondary ? `/${currentSummary.latest_value_secondary}` : ""}
              <span className="text-xs text-outline font-medium ml-1">{currentSummary.unit}</span>
            </p>
            <span className="text-[10px] text-outline">{currentSummary.latest_date || "No readings"}</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Period Average</span>
            <p className="text-xl font-extrabold text-on-surface mt-1">
              {currentSummary.average != null ? currentSummary.average : "—"}
              <span className="text-xs text-outline font-medium ml-1">{currentSummary.unit}</span>
            </p>
            <span className="text-[10px] text-outline">Mean value</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Minimum</span>
            <p className="text-xl font-extrabold text-on-surface mt-1">
              {currentSummary.min != null ? currentSummary.min : "—"}
              <span className="text-xs text-outline font-medium ml-1">{currentSummary.unit}</span>
            </p>
            <span className="text-[10px] text-outline">Lowest logged</span>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Maximum</span>
            <p className="text-xl font-extrabold text-on-surface mt-1">
              {currentSummary.max != null ? currentSummary.max : "—"}
              <span className="text-xs text-outline font-medium ml-1">{currentSummary.unit}</span>
            </p>
            <span className="text-[10px] text-outline">Peak recorded</span>
          </div>
        </div>

        {/* SVG Trend Graph */}
        <div className="h-56 w-full rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 p-4 flex flex-col justify-between relative overflow-hidden">
          {points.length > 1 ? (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006948" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#006948" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal guide lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#bccac0" strokeDasharray="4 4" strokeWidth="0.8" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#bccac0" strokeDasharray="4 4" strokeWidth="0.8" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#bccac0" strokeDasharray="4 4" strokeWidth="0.8" />

              {/* Trend Line */}
              <path d={svgPath} fill="none" stroke="#006948" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-outline gap-1">
              <span className="material-symbols-outlined text-[32px]">show_chart</span>
              <p className="text-xs">Need at least 2 recorded measurements to draw trend lines.</p>
            </div>
          )}

          {/* Timeline points footer */}
          <div className="flex items-center justify-between text-[10px] text-outline font-semibold px-2">
            <span>{points[0]?.date || "Oldest"}</span>
            <span>{points[Math.floor(points.length / 2)]?.date || "Midpoint"}</span>
            <span>{points[points.length - 1]?.date || "Latest"}</span>
          </div>
        </div>
      </div>

      {/* Measurement History Table */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <h2 className="text-base font-bold text-on-surface">Recorded Measurement History</h2>

        {historyList.length === 0 ? (
          <div className="py-8 text-center text-outline text-xs">
            No readings recorded for this metric yet. Click "Record Measurement" above to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Value</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-medium">
                {historyList.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3 text-on-surface">
                      {new Date(item.recorded_at).toLocaleDateString()}{" "}
                      <span className="text-outline">
                        {new Date(item.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-primary">
                      {item.value_primary}
                      {item.value_secondary ? ` / ${item.value_secondary}` : ""} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant truncate max-w-xs">{item.notes || "—"}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded-full text-outline hover:text-error transition-colors"
                        title="Delete reading"
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

      {/* Log Measurement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Record Health Measurement</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Measurement Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const t = e.target.value;
                    const match = metricTypes.find((m) => m.key === t);
                    setFormData({ ...formData, type: t, unit: match?.unit || "mmHg" });
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {metricTypes.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">
                  {formData.type === "blood_pressure" ? "Systolic Reading" : "Value"} ({formData.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Enter value"
                  value={formData.value_primary}
                  onChange={(e) => setFormData({ ...formData, value_primary: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {formData.type === "blood_pressure" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Diastolic Reading (mmHg)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 80"
                    value={formData.value_secondary}
                    onChange={(e) => setFormData({ ...formData, value_secondary: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 30 mins after breakfast"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Reading"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
