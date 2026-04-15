"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";

interface User {
  name: string;
  role: string;
}

/* Page title map from pathname */
const pageTitles: Record<string, string> = {
  "/dashboard": "控制台",
  "/analytics": "数据分析",
  "/calendar": "面试日历",
  "/positions": "职位管理",
  "/candidates": "候选人",
  "/interviews": "面试安排",
  "/users": "用户管理",
  "/settings": "系统设置",
  "/my-interviews": "我的面试",
};

export default function TopBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const pageTitle = pageTitles[pathname] || "码隆智能面试";

  return (
    <header className="fixed top-0 left-0 lg:left-[208px] right-0 h-14 bg-white border-b border-[#E8EBF0] z-40 flex items-center px-4 lg:px-6 gap-4">
      {/* Page title */}
      <h1 className="text-[15px] font-semibold text-[#1A1A1A] flex-shrink-0">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative hidden md:block">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#999]"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜索..."
            className="pl-8 pr-3 py-1.5 text-[13px] bg-[#F5F7FA] border border-[#E8EBF0] rounded-lg w-44 text-[#1A1A1A] placeholder-[#999] focus:outline-none focus:border-[#4371FF] focus:ring-1 focus:ring-[#4371FF]/20 transition-all"
          />
        </div>

        {/* Help icon */}
        <button className="w-8 h-8 flex items-center justify-center text-[#999] hover:text-[#666] hover:bg-[#F5F7FA] rounded-lg transition-colors">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
        </button>

        {/* Notification bell */}
        {user && <NotificationBell />}

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-[#1A2B5F] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 cursor-pointer">
          {user?.name?.charAt(0) || "U"}
        </div>
      </div>
    </header>
  );
}
