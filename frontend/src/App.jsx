import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// All 11 Domain Pages
import WelcomeOnboarding from "./pages/WelcomeOnboarding";
import Dashboard from "./pages/Dashboard";
import AIAssistant from "./pages/AIAssistant";
import HealthTracking from "./pages/HealthTracking";
import MedicalReports from "./pages/MedicalReports";
import MedicinesReminders from "./pages/MedicinesReminders";
import NutritionDiary from "./pages/NutritionDiary";
import ExerciseWorkouts from "./pages/ExerciseWorkouts";
import MeditationYoga from "./pages/MeditationYoga";
import DailyRoutines from "./pages/DailyRoutines";
import ProfileSettings from "./pages/ProfileSettings";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/welcome" element={<WelcomeOnboarding />} />

        {/* Protected Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/tracking" element={<HealthTracking />} />
            <Route path="/reports" element={<MedicalReports />} />
            <Route path="/medicines" element={<MedicinesReminders />} />
            <Route path="/nutrition" element={<NutritionDiary />} />
            <Route path="/workouts" element={<ExerciseWorkouts />} />
            <Route path="/meditation" element={<MeditationYoga />} />
            <Route path="/routines" element={<DailyRoutines />} />
            <Route path="/profile" element={<ProfileSettings />} />
          </Route>
        </Route>

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
