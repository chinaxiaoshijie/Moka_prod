"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "HR" | "INTERVIEWER";
}

interface Candidate {
  id: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    positions: 0,
    candidates: 0,
    interviews: 0,
    pending: 0,
  });

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userData || !token) {
        window.location.href = "/login";
        return;
      }

      try {
        setUser(JSON.parse(userData));
      } catch {
        window.location.href = "/login";
        return;
      }

      try {
        const [posRes, candRes, intRes] = await Promise.all([
          apiFetch("/positions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch("/candidates", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch("/interviews", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [posData, candData, intData] = await Promise.all([
          posRes.json(),
          candRes.json(),
          intRes.json(),
        ]);

        setStats({
          positions: posData.total || 0,
          candidates: candData.total || 0,
          interviews: intData.total || 0,
          pending:
            candData.items?.filter(
              (c: Candidate) => c.status === "PENDING"
            ).length || 0,
        });
      } catch (error) {
        console.error("加载统计数据失败", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-amber-600" />
      </div>
    );
  }

  const statCards = [
    { label: "在招职位", value: stats.positions, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "总候选人", value: stats.candidates, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "面试安排", value: stats.interviews, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "待处理", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const hrModules = [
    {
      title: "职位管理",
      desc: "创建和管理招聘职位",
      path: "/positions",
      color: "border-blue-100 hover:border-blue-200",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
    },
    {
      title: "候选人管理",
      desc: "筛选和跟踪候选人",
      path: "/candidates",
      color: "border-emerald-100 hover:border-emerald-200",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      title: "面试安排",
      desc: "管理面试日程",
      path: "/interviews",
      color: "border-violet-100 hover:border-violet-200",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const interviewerModules = [
    {
      title: "我的面试",
      desc: "查看待完成的面试任务",
      path: "/my-interviews",
      color: "border-amber-100 hover:border-amber-200",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const modules = user?.role === "HR" ? hrModules : interviewerModules;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-60 p-5 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
              欢迎回来，{user?.name}
            </h1>
            <p className="text-sm text-slate-500">
              {user?.role === "HR" ? "HR 管理员" : "面试官"} &middot;{" "}
              {new Date().toLocaleDateString("zh-CN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Stats */}
          {user?.role === "HR" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-xl border border-slate-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <span className={`text-lg font-bold font-mono ${card.color}`}>
                        {card.value}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Modules */}
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              功能模块
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {modules.map((m) => (
                <button
                  key={m.path}
                  onClick={() => router.push(m.path)}
                  className={`group bg-white rounded-xl border p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ${m.color}`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${m.iconBg} ${m.iconColor} flex items-center justify-center mb-4`}
                  >
                    {m.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
