"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  name: string;
  role: string;
}

/* SVG icon components — line style, 20x20 */
const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 3v18h18" /><path d="M7 16l4-6 4 3 5-7" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  positions: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  ),
  candidates: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  interviews: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path d="M12 12v4m0 0h2m-2 0H10" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  myInterviews: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

const navItems = [
  { path: "/dashboard", label: "控制台", iconKey: "dashboard" },
  { path: "/analytics", label: "数据分析", iconKey: "analytics" },
  { path: "/calendar", label: "面试日历", iconKey: "calendar" },
  { path: "/positions", label: "职位管理", iconKey: "positions" },
  { path: "/candidates", label: "候选人", iconKey: "candidates" },
  { path: "/interviews", label: "面试安排", iconKey: "interviews" },
  { path: "/users", label: "用户管理", iconKey: "users" },
];

const interviewerNavItems = [
  { path: "/dashboard", label: "控制台", iconKey: "dashboard" },
  { path: "/my-interviews", label: "我的面试", iconKey: "myInterviews" },
];

/* Moka mountain logo — white on dark bg */
const MokaLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#1890ff" />
    <path
      d="M6 23L11 13L16 19L21 11L26 23H6Z"
      fill="white"
      fillOpacity="0.9"
    />
    <path
      d="M6 23L11 13L16 19"
      stroke="white"
      strokeWidth="1"
      strokeOpacity="0.4"
      fill="none"
    />
  </svg>
);

export default function Sidebar() {
  const router = useRouter();
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

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  const items = user?.role === "INTERVIEWER" ? interviewerNavItems : navItems;

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[208px] bg-[#001529] flex-col z-50">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <MokaLogo />
          <div>
            <p className="text-[14px] font-bold text-white leading-tight">Moka招聘</p>
            <p className="text-[11px] text-[#ffffff66] leading-tight mt-0.5">用人经理端</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-[#ffffff1a]" />

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-[#1890ff] text-white"
                    : "text-[#ffffffa6] hover:bg-[#ffffff0f] hover:text-white"
                }`}
              >
                <span className={isActive ? "text-white" : "text-[#ffffff66]"}>
                  {icons[item.iconKey]}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4">
        {/* Settings link */}
        <button
          onClick={() => router.push("/settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors duration-150 mb-1 ${
            pathname === "/settings"
              ? "bg-[#1890ff] text-white"
              : "text-[#ffffffa6] hover:bg-[#ffffff0f] hover:text-white"
          }`}
        >
          <span className={pathname === "/settings" ? "text-white" : "text-[#ffffff66]"}>
            {icons.settings}
          </span>
          <span>设置</span>
        </button>

        {/* Divider */}
        <div className="h-px bg-[#ffffff1a] my-2" />

        {/* User info */}
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-[#1890ff] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white truncate leading-tight">
              {user?.name}
            </p>
            <p className="text-[11px] text-[#ffffff66] leading-tight">
              {user?.role === "HR" ? "HR 管理员" : "面试官"}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[#ffffff66] hover:text-white hover:bg-[#ffffff0f] rounded-md transition-colors text-[13px]"
        >
          {icons.logout}
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
