"use client";

import { Search, Bell, User, CheckCircle2 } from "lucide-react";

export function TopNav() {
  return (
    <header
      className="fixed top-0 left-[240px] right-0 h-14 bg-[#111319] border-b border-[#2a2d3e] flex items-center justify-between px-6 z-10"
      role="banner"
    >
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none"
        />
        <input
          type="search"
          placeholder="Search integrations, jobs, logs..."
          className="w-full h-8 pl-8 pr-3 bg-[#1e1f26] border border-[#2a2d3e] rounded text-[13px] text-[#e2e2eb] placeholder-[#6b7280] focus:outline-none focus:border-[#6366f1] transition-colors"
          aria-label="Global search"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* System status */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#10b981]">
          <CheckCircle2 size={13} strokeWidth={2.5} aria-hidden="true" />
          <span className="text-[#c7c4d7]">All systems operational</span>
        </div>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-[#1e1f26] text-[#c7c4d7] hover:text-[#e2e2eb] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={2} />
        </button>

        {/* User profile */}
        <button
          className="w-8 h-8 rounded-md bg-[#6366f1] flex items-center justify-center text-white hover:bg-[#5558e3] transition-colors"
          aria-label="User profile"
        >
          <User size={15} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
