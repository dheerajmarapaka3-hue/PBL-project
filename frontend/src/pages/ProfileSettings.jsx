import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import {
  User,
  Shield,
  Heart,
  Target,
  Phone,
  Download,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  Save,
} from "lucide-react";

export default function ProfileSettings() {
  const { user, updateProfile, logout, deleteAccount } = useAuth();

  const profile = user?.profile || {};

  const [activeTab, setActiveTab] = useState("health"); // health, targets, emergency, privacy
  const [formData, setFormData] = useState({
    age: profile.age || "",
    gender: profile.gender || "",
    height_cm: profile.height_cm || "",
    weight_kg: profile.weight_kg || "",
    blood_type: profile.blood_type || "",
    dietary_preference: profile.dietary_preference || "omnivore",
    allergies: profile.allergies || "",
    medical_conditions: profile.medical_conditions || "",
    emergency_contact_name: profile.emergency_contact_name || "",
    emergency_contact_phone: profile.emergency_contact_phone || "",
    target_water_ml: profile.target_water_ml || 2500,
    target_sleep_hours: profile.target_sleep_hours || 8.0,
    target_steps: profile.target_steps || 8000,
    target_calories: profile.target_calories || 2000,
    unit_preference: profile.unit_preference || "metric",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSaveSuccess(false);

    try {
      // Clean numeric payload
      const payload = {
        age: formData.age ? Number(formData.age) : null,
        gender: formData.gender || null,
        height_cm: formData.height_cm ? Number(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
        blood_type: formData.blood_type || null,
        dietary_preference: formData.dietary_preference,
        allergies: formData.allergies || null,
        medical_conditions: formData.medical_conditions || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        target_water_ml: Number(formData.target_water_ml) || 2500,
        target_sleep_hours: Number(formData.target_sleep_hours) || 8.0,
        target_steps: Number(formData.target_steps) || 8000,
        target_calories: Number(formData.target_calories) || 2000,
        unit_preference: formData.unit_preference,
      };

      await updateProfile(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to save profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await api.auth.exportData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `healthmate_data_${user?.id || "export"}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export your health records. Please try again later.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== "delete my account") {
      alert("Please type 'delete my account' to confirm permanent deletion.");
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  // BMI Calculation if height and weight present
  const bmi =
    formData.height_cm && formData.weight_kg
      ? (formData.weight_kg / Math.pow(formData.height_cm / 100, 2)).toFixed(1)
      : null;

  const getBmiCategory = (val) => {
    const num = parseFloat(val);
    if (num < 18.5) return { label: "Underweight", color: "text-amber-600 bg-amber-50" };
    if (num < 25) return { label: "Normal Range", color: "text-primary bg-primary/10" };
    if (num < 30) return { label: "Overweight", color: "text-amber-700 bg-amber-100" };
    return { label: "High Risk", color: "text-red-700 bg-red-100" };
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-headline">
            Profile & Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your personal health profile, daily wellness targets, privacy, and account security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* User Card Overview */}
      <div className="bg-gradient-to-r from-primary to-primary-container p-6 rounded-3xl text-white shadow-xl shadow-primary/10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black shadow-inner">
          {user?.full_name?.charAt(0).toUpperCase() || "H"}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-2xl font-bold">{user?.full_name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
              HealthMate Member
            </span>
          </div>
          <p className="text-emerald-100 text-sm mt-1">{user?.email}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-emerald-100/90 font-medium">
            <span>Blood Group: <strong>{formData.blood_type || "Not set"}</strong></span>
            <span>•</span>
            <span>Diet: <strong className="capitalize">{formData.dietary_preference || "Standard"}</strong></span>
            <span>•</span>
            <span>Units: <strong className="capitalize">{formData.unit_preference}</strong></span>
          </div>
        </div>

        {bmi && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[140px]">
            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-100">Calculated BMI</p>
            <p className="text-3xl font-extrabold mt-0.5">{bmi}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${getBmiCategory(bmi).color}`}>
              {getBmiCategory(bmi).label}
            </span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("health")}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "health"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Heart size={16} />
          Health Profile
        </button>

        <button
          onClick={() => setActiveTab("targets")}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "targets"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Target size={16} />
          Wellness Targets
        </button>

        <button
          onClick={() => setActiveTab("emergency")}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "emergency"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Phone size={16} />
          Emergency & Safety
        </button>

        <button
          onClick={() => setActiveTab("privacy")}
          className={`pb-3 px-4 font-semibold text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "privacy"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Shield size={16} />
          Data, Export & Privacy
        </button>
      </div>

      {/* Success & Error alerts */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
          <span>Your profile and preferences have been updated successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm flex items-center gap-3 animate-fadeIn">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Health Profile */}
        {activeTab === "health" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-headline">Physical Attributes</h3>
              <p className="text-xs text-slate-500">Provide accurate metrics to help HealthMate calculate calorie needs and wellness scores.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Age (Years)
                </label>
                <input
                  type="number"
                  name="age"
                  min="1"
                  max="125"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="e.g. 29"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Biological Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / Non-binary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Blood Group
                </label>
                <select
                  name="blood_type"
                  value={formData.blood_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                >
                  <option value="">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height_cm"
                  step="0.5"
                  value={formData.height_cm}
                  onChange={handleInputChange}
                  placeholder="e.g. 175"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight_kg"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={handleInputChange}
                  placeholder="e.g. 70.5"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Dietary Lifestyle
                </label>
                <select
                  name="dietary_preference"
                  value={formData.dietary_preference}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                >
                  <option value="omnivore">Omnivore (Standard)</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="keto">Ketogenic</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="gluten-free">Gluten-Free</option>
                  <option value="halal">Halal</option>
                  <option value="jain">Jain Vegetarian</option>
                </select>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <h3 className="text-lg font-bold text-slate-900 font-headline">Clinical Background & Allergies</h3>
              <p className="text-xs text-slate-500">Voluntary information used exclusively to contextualize AI wellness responses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Known Allergies
                </label>
                <textarea
                  name="allergies"
                  rows={3}
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="e.g. Penicillin, Peanuts, Pollen (or none)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chronic Conditions or Prior Surgeries
                </label>
                <textarea
                  name="medical_conditions"
                  rows={3}
                  value={formData.medical_conditions}
                  onChange={handleInputChange}
                  placeholder="e.g. Mild Asthma, Hypertension, Knee Arthroscopy 2024"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Measurement System Preference
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="unit_preference"
                    value="metric"
                    checked={formData.unit_preference === "metric"}
                    onChange={handleInputChange}
                    className="accent-primary"
                  />
                  Metric (kg, cm, ml)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="unit_preference"
                    value="imperial"
                    checked={formData.unit_preference === "imperial"}
                    onChange={handleInputChange}
                    className="accent-primary"
                  />
                  Imperial (lbs, feet/inches, oz)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Wellness Targets */}
        {activeTab === "targets" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-headline">Daily Health Targets</h3>
              <p className="text-xs text-slate-500">Configure your daily baseline goals for vitality tracking and dashboard gauges.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-cyan-50/50 border border-cyan-100">
                <label className="block text-xs font-bold text-cyan-900 uppercase tracking-wider mb-2">
                  Daily Water Target (ml)
                </label>
                <input
                  type="number"
                  name="target_water_ml"
                  step="100"
                  min="500"
                  max="6000"
                  value={formData.target_water_ml}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-semibold bg-white"
                />
                <p className="text-xs text-cyan-700 mt-2">Recommended: 2,500 ml (~8-10 glasses) per day.</p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                  Daily Sleep Goal (Hours)
                </label>
                <input
                  type="number"
                  name="target_sleep_hours"
                  step="0.5"
                  min="4"
                  max="14"
                  value={formData.target_sleep_hours}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold bg-white"
                />
                <p className="text-xs text-indigo-700 mt-2">Recommended: 7.5 - 8.5 hours for adult restorative sleep.</p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                  Daily Step Goal
                </label>
                <input
                  type="number"
                  name="target_steps"
                  step="500"
                  min="1000"
                  max="30000"
                  value={formData.target_steps}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold bg-white"
                />
                <p className="text-xs text-emerald-700 mt-2">Standard health benchmark: 8,000 - 10,000 steps daily.</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                  Calorie Target (kcal)
                </label>
                <input
                  type="number"
                  name="target_calories"
                  step="50"
                  min="1000"
                  max="5000"
                  value={formData.target_calories}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold bg-white"
                />
                <p className="text-xs text-amber-700 mt-2">Used for nutrition diary energy budget comparison.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Emergency & Safety */}
        {activeTab === "emergency" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-headline">Emergency Contact Information</h3>
              <p className="text-xs text-slate-500">Kept locally accessible in case of critical medical assistance needs.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Dr. Jane Smith or Spouse Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +1 555-0192 or +91 9876543210"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-4">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1">Medical Emergency Disclaimer</p>
                <p>
                  HealthMate AI provides educational guidance, habit assistance, and document organization. It is
                  <strong> not an emergency response service or diagnostic medical system</strong>. If you or someone you know is
                  experiencing acute chest pain, shortness of breath, sudden numbness, or life-threatening distress, call
                  emergency services immediately (<strong>112</strong> in India / Europe, or <strong>911</strong> in the United States).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Data & Privacy */}
        {activeTab === "privacy" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-headline">Privacy & Data Sovereignty</h3>
              <p className="text-xs text-slate-500">You have complete control over your health information, uploaded reports, and account data.</p>
            </div>

            {/* Export Personal Data */}
            <div className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Download size={18} className="text-primary" />
                  <span>Download Health Data Archive (JSON)</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-lg">
                  Export your complete health record, logged vitals, medicine history, daily routines, and profile metrics
                  in standard portable JSON format.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isExporting ? "Exporting..." : "Export Data"}
              </button>
            </div>

            {/* Permanent Account Deletion */}
            <div className="p-6 rounded-2xl border border-red-200 bg-red-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
                  <Trash2 size={18} className="text-red-600" />
                  <span>Permanent Account & Data Deletion</span>
                </div>
                <p className="text-xs text-red-700 mt-1 max-w-lg">
                  Irreversibly deletes your account, login credentials, physical uploaded documents, medical records, and conversation history.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition whitespace-nowrap shadow-sm shadow-red-600/20"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Global Save Button (visible on tabs that have form inputs) */}
        {activeTab !== "privacy" && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/95 transition shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? "Saving Changes..." : "Save Preferences"}
            </button>
          </div>
        )}
      </form>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900 font-headline">Delete HealthMate Account?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This action is <strong>permanent and cannot be undone</strong>. All your vitals history, uploaded medical
                documents, medicine schedules, food logs, and AI conversations will be immediately wiped from the database.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type <strong>delete my account</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete my account"
                className="w-full px-4 py-3 rounded-xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-mono"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText.trim().toLowerCase() !== "delete my account"}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-40"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
