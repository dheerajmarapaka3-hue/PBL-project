import React, { useState, useEffect } from "react";
import { api } from "../api/client";

export default function MedicinesReminders() {
  const [medicines, setMedicines] = useState([]);
  const [todayDoses, setTodayDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    form: "Tablet",
    instructions: "Take with water after meal",
    frequency: "Daily",
    schedule_times: "08:00",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [medsRes, dosesRes] = await Promise.all([
        api.medicines.list(),
        api.medicines.getTodayDoses(),
      ]);
      setMedicines(medsRes.data);
      setTodayDoses(dosesRes.data);
    } catch (err) {
      console.error("Failed to load medicines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const requestNotificationAccess = async () => {
    if (typeof Notification === "undefined") {
      alert("Browser notifications are not supported in this environment.");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    if (perm === "granted") {
      showToast("Notification permission enabled! 🔔");
      new Notification("HealthMate AI Reminder", {
        body: "You're all set! Reminders for your scheduled doses will appear here.",
      });
    }
  };

  const handleDoseAction = async (doseId, status) => {
    try {
      await api.medicines.updateDoseStatus(doseId, status);
      showToast(status === "taken" ? "Dose recorded as taken! 💊" : "Dose marked skipped.");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.medicines.create(formData);
      setShowAddModal(false);
      setFormData({
        name: "",
        dosage: "",
        form: "Tablet",
        instructions: "Take with water after meal",
        frequency: "Daily",
        schedule_times: "08:00",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        notes: "",
      });
      showToast("Medicine added to cabinet! ✨");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add medicine. Check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this medicine and its scheduled doses?")) return;
    try {
      await api.medicines.delete(id);
      showToast("Medicine removed.");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const completedDoses = todayDoses.filter((d) => d.status === "taken").length;
  const adherenceRate = todayDoses.length > 0 ? Math.round((completedDoses / todayDoses.length) * 100) : 100;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all bg-primary text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-md text-xs font-bold animate-bounce">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Medicines & Reminders</h1>
          <p className="text-xs text-on-surface-variant">
            Maintain consistent medication schedules, track daily doses, and preserve prescribed instructions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {notificationPermission !== "granted" && (
            <button
              onClick={requestNotificationAccess}
              className="px-3.5 py-2 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold hover:bg-secondary hover:text-white transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              <span>Enable Alerts</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Today's Schedule Bento Card */}
      <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed/50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">today</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-on-surface">Today's Dose Schedule</h2>
              <p className="text-xs text-outline">
                {completedDoses} of {todayDoses.length} doses taken ({adherenceRate}% adherence)
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs font-bold text-on-surface">Adherence Tracker</span>
          </div>
        </div>

        {todayDoses.length === 0 ? (
          <div className="py-10 text-center text-outline flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[36px]">medication_liquid</span>
            <p className="text-xs">No doses scheduled for today.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-1 text-xs font-bold text-primary hover:underline"
            >
              + Add a medicine to your schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayDoses.map((dose) => (
              <div
                key={dose.id}
                className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white text-primary flex items-center justify-center text-xs font-bold shadow-xs">
                      {dose.scheduled_time}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-on-surface leading-tight">{dose.medicine_name}</h3>
                      <p className="text-xs text-on-surface-variant">
                        {dose.dosage} • {dose.form}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      dose.status === "taken"
                        ? "bg-primary-fixed text-on-primary-fixed-variant"
                        : dose.status === "skipped"
                        ? "bg-surface-container text-outline"
                        : "bg-tertiary-fixed text-on-tertiary-fixed"
                    }`}
                  >
                    {dose.status}
                  </span>
                </div>

                <p className="text-xs text-outline italic">"{dose.instructions}"</p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                  {dose.status === "taken" ? (
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Recorded at {new Date(dose.taken_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDoseAction(dose.id, "skipped")}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-outline hover:text-on-surface transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleDoseAction(dose.id, "taken")}
                        className="px-4 py-1.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        <span>Take Dose</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Prescribed Medicines Inventory */}
      <div className="rounded-3xl p-6 bg-white shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">inventory_2</span>
            <h2 className="text-base font-bold text-on-surface">Medicine Cabinet</h2>
          </div>
          <span className="text-xs text-outline">{medicines.length} Medicines Active</span>
        </div>

        {medicines.length === 0 ? (
          <div className="py-8 text-center text-outline text-xs">
            Your medicine cabinet is empty. Add your vitamins, daily prescriptions, or supplements.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 text-outline uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Medicine</th>
                  <th className="py-3 px-3">Form & Dosage</th>
                  <th className="py-3 px-3">Frequency & Times</th>
                  <th className="py-3 px-3">Instructions</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-medium">
                {medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-on-surface">{med.name}</p>
                      <p className="text-[10px] text-outline">Since {med.start_date}</p>
                    </td>
                    <td className="py-3 px-3 text-on-surface">
                      {med.form} • {med.dosage}
                    </td>
                    <td className="py-3 px-3 text-primary font-bold">
                      {med.frequency} ({med.schedule_times})
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant max-w-xs truncate">{med.instructions}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(med.id)}
                        className="p-1 rounded-full text-outline hover:text-error transition-colors"
                        title="Delete medicine"
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

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Add Medicine to Cabinet</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Medicine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lisinopril, Metformin, Vitamin D3"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Strength / Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10mg, 500mg, 1 puff"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Form</label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Drops</option>
                    <option value="Injection">Injection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed">As needed</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Times (e.g. 08:00, 20:00)</label>
                  <input
                    type="text"
                    required
                    placeholder="08:00"
                    value={formData.schedule_times}
                    onChange={(e) => setFormData({ ...formData, schedule_times: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Take with a full glass of water after breakfast"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
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
                  {submitting ? "Saving..." : "Add Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
