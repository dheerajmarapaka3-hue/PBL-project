import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function WelcomeOnboarding() {
  const { login, register, updateProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("welcome"); // welcome, login, register, onboarding
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "Prefer not to say",
    dob: "",
    height: "",
    weight: "",
    bloodGroup: "",
    unitPreference: "metric",
    activityLevel: "moderate",
    dietaryPreference: "Omnivore",
    allergies: "",
    medicalConditions: "",
    healthGoals: "Improve daily energy and maintain healthy habits",
    emergencyContactName: "",
    emergencyContactPhone: "",
    targetWaterMl: 2500,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated and not in the middle of onboarding, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated && activeTab !== "onboarding") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, activeTab, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(formData.email, formData.password, formData.fullName);
      // Move to onboarding questionnaire
      setActiveTab("onboarding");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        dob: formData.dob || null,
        gender: formData.gender || null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        blood_group: formData.bloodGroup || null,
        unit_preference: formData.unitPreference,
        activity_level: formData.activityLevel,
        dietary_preference: formData.dietaryPreference,
        allergies: formData.allergies || null,
        medical_conditions: formData.medicalConditions || null,
        health_goals: formData.healthGoals,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        target_water_ml: parseInt(formData.targetWaterMl, 10) || 2500,
      });
      navigate("/dashboard");
    } catch (err) {
      console.warn("Onboarding profile update warning:", err);
      // Still navigate to dashboard
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-[#f2f3ff] to-[#eaedff] flex flex-col justify-center items-center px-4 py-8 antialiased">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md">
          <span className="material-symbols-outlined text-[28px]">health_and_safety</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-2xl text-on-surface tracking-tight">HealthMate</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold shadow-sm">
              AI
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">Your Personal Wellness Companion</p>
        </div>
      </div>

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/80 p-6 md:p-8 transition-all">
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-error-container/70 border border-error/30 text-error text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* 1. Welcome Screen */}
        {activeTab === "welcome" && (
          <div className="flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-secondary-container/50 flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-[44px]">spa</span>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-2">
                Empower Your Vitality
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Understand your vitals, build balanced routines, track medicines, organize medical documents, and chat with your AI health companion.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 mt-2">
              <button
                onClick={() => setActiveTab("register")}
                className="w-full py-3.5 px-6 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              <button
                onClick={() => setActiveTab("login")}
                className="w-full py-3 px-6 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-sm transition-all active:scale-95 border border-outline-variant/30"
              >
                Already have an account? Sign In
              </button>
            </div>

            <p className="text-[11px] text-outline mt-2">
              🔒 Private, encrypted health vault • No wearable hardware required.
            </p>
          </div>
        )}

        {/* 2. Login Screen */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Welcome Back</h2>
              <p className="text-xs text-on-surface-variant">Sign in to your HealthMate account</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                </>
              )}
            </button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        )}

        {/* 3. Register Screen */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Create Your Account</h2>
              <p className="text-xs text-on-surface-variant">Start your personalized health companion</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Sarah Connor"
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Already registered? Sign In
              </button>
            </div>
          </form>
        )}

        {/* 4. Onboarding Questionnaire */}
        {activeTab === "onboarding" && (
          <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-primary uppercase">Step 2 of 2</span>
                <h2 className="text-xl font-extrabold text-on-surface">Personalize HealthMate</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-xs text-outline hover:text-on-surface"
              >
                Skip for now
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              HealthMate tailors daily insights, vitality scores, and routine suggestions to your lifestyle.
            </p>

            {/* Health Goals */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Primary Health Goal</label>
              <select
                name="healthGoals"
                value={formData.healthGoals}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="Improve daily energy and vitality">Improve daily energy & vitality</option>
                <option value="Maintain healthy blood pressure and heart wellness">Healthy blood pressure & cardio wellness</option>
                <option value="Better sleep quality and stress reduction">Better sleep & stress reduction</option>
                <option value="Weight management and balanced nutrition">Weight management & nutrition</option>
                <option value="Manage chronic condition with medication adherence">Medication & routine organization</option>
              </select>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  placeholder="e.g. 170"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  name="weight"
                  placeholder="e.g. 65"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Diet & Activity Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">Dietary Preference</label>
                <select
                  name="dietaryPreference"
                  value={formData.dietaryPreference}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Omnivore">Omnivore</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Keto">Keto</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">Activity Level</label>
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="sedentary">Sedentary (Desk job)</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="very_active">Very Active</option>
                </select>
              </div>
            </div>

            {/* Allergies & Conditions */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Allergies (Optional)</label>
              <input
                type="text"
                name="allergies"
                placeholder="e.g. Penicillin, Peanuts, None"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Daily Water Goal (ml)</label>
              <input
                type="number"
                name="targetWaterMl"
                value={formData.targetWaterMl}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save & Go to Dashboard</span>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
