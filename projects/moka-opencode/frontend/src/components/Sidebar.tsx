"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";

interface User {
  name: string;
  role: string;
}

const navItems = [
  { path: "/dashboard", label: "控制台", icon: "📊" },
  { path: "/analytics", label: "数据分析", icon: "📈" },
  { path: "/calendar", label: "面试日历", icon: "🗓️" },
  { path: "/positions", label: "职位管理", icon: "💼" },
  { path: "/candidates", label: "候选人", icon: "👥" },
  { path: "/interviews", label: "面试安排", icon: "📅" },
  { path: "/users", label: "用户管理", icon: "👤" },
  { path: "/settings", label: "系统设置", icon: "⚙️" },
];

const interviewerNavItems = [
  { path: "/dashboard", label: "控制台", icon: "📊" },
  { path: "/my-interviews", label: "我的面试", icon: "🎯" },
];

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
    // 清除 cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // 使用硬跳转确保重定向生效
    window.location.href = "/login";
  };

  const items = user?.role === "INTERVIEWER" ? interviewerNavItems : navItems;

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-[#0f172a] text-white flex-col shadow-2xl z-50">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            M
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Moka</h1>
            <p className="text-xs text-slate-400">面试管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3">
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname === item.path
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {pathname === item.path && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">
                {user?.role === "HR" ? "HR管理员" : "面试官"}
              </p>
            </div>
            {user && <NotificationBell />}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-sm"
        >
          <span>🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
