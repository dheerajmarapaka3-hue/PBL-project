import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const primaryMobileItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/assistant", label: "AI Mate", icon: "auto_awesome", highlight: true },
  { path: "/tracking", label: "Vitals", icon: "monitoring" },
  { path: "/medicines", label: "Medicines", icon: "medication" },
];

const moreMenuItems = [
  { path: "/reports", label: "Medical Reports", icon: "description" },
  { path: "/nutrition", label: "Nutrition Diary", icon: "nutrition" },
  { path: "/workouts", label: "Workouts", icon: "fitness_center" },
  { path: "/meditation", label: "Meditation & Yoga", icon: "self_improvement" },
  { path: "/routines", label: "Routines & Goals", icon: "checklist" },
  { path: "/profile", label: "Profile & Settings", icon: "settings" },
];

export default function BottomNav() {
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  return (
    <>
      {/* Mobile Drawer Modal for Extra Navigation */}
      {showMoreDrawer && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setShowMoreDrawer(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-6 shadow-2xl border-t border-outline-variant/30 flex flex-col gap-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-outline-variant/60 mx-auto mb-2" />
            <h3 className="text-base font-bold text-on-surface">More Health Features</h3>

            <div className="grid grid-cols-2 gap-3">
              {moreMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMoreDrawer(false)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <a
                href="tel:112"
                className="w-full py-2.5 px-4 rounded-full bg-error text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>Emergency: 112 / 911</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav h-16 px-3 flex items-center justify-around pb-safe">
        {primaryMobileItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-2xl transition-all ${
                isActive ? "text-primary font-bold" : "text-outline hover:text-on-surface"
              }`
            }
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                item.highlight ? "text-primary animate-pulse" : ""
              }`}
            >
              {item.icon}
            </span>
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}

        {/* More Toggle */}
        <button
          onClick={() => setShowMoreDrawer(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-2xl text-outline hover:text-on-surface transition-all"
          aria-label="More navigation"
        >
          <span className="material-symbols-outlined text-[22px]">apps</span>
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </>
  );
}
