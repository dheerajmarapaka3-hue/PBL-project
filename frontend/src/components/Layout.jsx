import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("healthmate_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("healthmate_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased">
      <Navbar sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex pt-16">
        <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />

        <div
          className={`flex-1 transition-all duration-300 ease-in-out min-w-0 ${
            sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
          }`}
        >
          <main className="p-4 md:p-6 pb-24 lg:pb-12 max-w-7xl mx-auto w-full transition-all">
            <Outlet />
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
