import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ sidebarCollapsed, toggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const initial = user?.full_name ? user.full_name[0].toUpperCase() : "U";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-header h-16 px-4 md:px-6 flex items-center justify-between transition-all">
      {/* Left Area: Toggle + Brand Logo */}
      <div className="flex items-center gap-3">
        {/* Sidebar Minimize / Maximize Button */}
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container active:scale-95 transition-all items-center justify-center border border-outline-variant/30"
            title={sidebarCollapsed ? "Maximize Sidebar (Show navigation menu)" : "Minimize Sidebar (Hide navigation menu to expand content)"}
            aria-label={sidebarCollapsed ? "Maximize Sidebar" : "Minimize Sidebar"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {sidebarCollapsed ? "menu" : "menu_open"}
            </span>
          </button>
        )}

        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 active:scale-95 transition-transform">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg md:text-xl text-on-surface tracking-tight">HealthMate</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold shadow-sm">
              AI
            </span>
          </div>
        </Link>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick AI Assistant Button on Header */}
        <Link
          to="/assistant"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary-container/60 hover:bg-secondary-container text-on-secondary-container text-xs font-bold transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
          <span>Ask AI Mate</span>
        </Link>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-2.5 pr-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 transition-all active:scale-95"
            aria-label="User menu"
          >
            <span className="text-xs font-bold text-on-surface hidden md:inline">
              {user?.full_name?.split(" ")[0] || "User"}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold shadow-sm">
              {initial}
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-outline-variant/30 py-2 z-50 animate-fadeIn"
              onClick={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-bold text-on-surface truncate">{user?.full_name}</p>
                <p className="text-xs text-outline truncate">{user?.email}</p>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                <span>Profile & Settings</span>
              </Link>
              <Link
                to="/routines"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">task_alt</span>
                <span>Daily Routines</span>
              </Link>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    navigate("/welcome");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error-container/30 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
