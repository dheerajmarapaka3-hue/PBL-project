import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/assistant", label: "AI Health Mate", icon: "auto_awesome", highlight: true },
  { path: "/tracking", label: "Health Vitals", icon: "monitoring" },
  { path: "/reports", label: "Medical Reports", icon: "description" },
  { path: "/medicines", label: "Medicines & Doses", icon: "medication" },
  { path: "/nutrition", label: "Nutrition Diary", icon: "nutrition" },
  { path: "/workouts", label: "Exercise & Workouts", icon: "fitness_center" },
  { path: "/meditation", label: "Meditation & Yoga", icon: "self_improvement" },
  { path: "/routines", label: "Routines & Goals", icon: "checklist" },
  { path: "/profile", label: "Profile & Settings", icon: "settings" },
];

export default function Sidebar({ collapsed, toggleSidebar }) {
  return (
    <aside
      className={`hidden lg:flex flex-col fixed top-16 bottom-0 left-0 bg-white/85 backdrop-blur-xl border-r border-outline-variant/30 py-5 overflow-y-auto overflow-x-hidden z-30 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20 px-2.5 items-center" : "w-64 px-4"
      }`}
    >
      {/* Header with Title and Minimize/Maximize Button */}
      <div
        className={`flex items-center mb-3 ${
          collapsed ? "justify-center w-full" : "justify-between px-2"
        }`}
      >
        {!collapsed && (
          <span className="text-[11px] font-bold tracking-wider text-outline uppercase truncate">
            Health Navigation
          </span>
        )}

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-xl text-outline hover:text-primary hover:bg-surface-container transition-all active:scale-95 flex items-center justify-center border border-outline-variant/20"
          title={collapsed ? "Maximize Navigation Bar (Expand menu)" : "Minimize Navigation Bar (Collapse menu)"}
          aria-label={collapsed ? "Maximize Navigation Bar" : "Minimize Navigation Bar"}
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? "last_page" : "first_page"}
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-1.5 w-full">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-2xl text-sm font-semibold transition-all group ${
                collapsed
                  ? "justify-center p-3"
                  : "gap-3 px-3.5 py-2.5"
              } ${
                isActive
                  ? "bg-primary text-on-primary shadow-sm"
                  : item.highlight
                  ? "text-primary hover:bg-secondary-container/40"
                  : "text-on-surface hover:bg-surface-container-low"
              }`
            }
          >
            <span
              className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                item.highlight ? "animate-pulse" : ""
              }`}
            >
              {item.icon}
            </span>

            {!collapsed && (
              <span className="truncate whitespace-nowrap">{item.label}</span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Emergency Assistance Card */}
      <div className="mt-auto pt-4 w-full">
        {!collapsed ? (
          <div className="rounded-2xl p-3.5 bg-gradient-to-br from-error-container/60 to-surface-container-low border border-error/20 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-error">
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              <span className="text-xs font-bold uppercase tracking-wider">Emergency Aid</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-tight">
              If experiencing acute chest pain or emergency symptoms, call immediate medical dispatch.
            </p>
            <a
              href="tel:112"
              className="w-full py-1.5 px-3 rounded-full bg-error text-white text-xs font-bold text-center active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">call</span>
              <span>Emergency: 112 / 911</span>
            </a>
          </div>
        ) : (
          <a
            href="tel:112"
            title="Emergency Aid: Call 112 / 911"
            className="w-12 h-12 mx-auto rounded-2xl bg-error text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">emergency</span>
          </a>
        )}
      </div>
    </aside>
  );
}
