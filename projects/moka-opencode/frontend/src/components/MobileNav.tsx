"use client";

import { useRouter, usePathname } from "next/navigation";

const mobileNavItems = [
  { path: "/dashboard", label: "首页", icon: "📊" },
  { path: "/analytics", label: "分析", icon: "📈" },
  { path: "/calendar", label: "日历", icon: "🗓️" },
  { path: "/candidates", label: "候选人", icon: "👥" },
  { path: "/interviews", label: "面试", icon: "📅" },
  { path: "/settings", label: "设置", icon: "⚙️" },
];

export default function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {mobileNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname === item.path ? "text-amber-600" : "text-slate-400"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
