"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
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
        // 使用硬跳转确保重定向生效
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
        // 即使加载失败也要停止 loading
        setLoading(false);
      }
    };

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const hrModules = [
    {
      title: "职位管理",
      desc: "管理招聘职位信息",
      icon: "💼",
      path: "/positions",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "候选人管理",
      desc: "查看候选人信息",
      icon: "👥",
      path: "/candidates",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "面试安排",
      desc: "安排面试日程",
      icon: "📅",
      path: "/interviews",
      color: "from-violet-500 to-violet-600",
    },
  ];

  const interviewerModules = [
    {
      title: "我的面试",
      desc: "查看待面试的候选人",
      icon: "🎯",
      path: "/my-interviews",
      color: "from-amber-500 to-amber-600",
    },
  ];

  const modules = user?.role === "HR" ? hrModules : interviewerModules;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              欢迎回来，{user?.name}
            </h1>
            <p className="text-slate-500">
              {user?.role === "HR" ? "HR管理员" : "面试官"} ·{" "}
              {new Date().toLocaleDateString("zh-CN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {user?.role === "HR" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                    💼
                  </div>
                  <span className="text-sm text-slate-400">职位</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.positions}
                </p>
                <p className="text-sm text-slate-500 mt-1">在招职位</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl">
                    👥
                  </div>
                  <span className="text-sm text-slate-400">候选人</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.candidates}
                </p>
                <p className="text-sm text-slate-500 mt-1">总候选人</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-2xl">
                    📅
                  </div>
                  <span className="text-sm text-slate-400">面试</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.interviews}
                </p>
                <p className="text-sm text-slate-500 mt-1">待进行</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
                    ⏳
                  </div>
                  <span className="text-sm text-slate-400">待处理</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.pending}
                </p>
                <p className="text-sm text-slate-500 mt-1">待处理候选人</p>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">功能模块</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {modules.map((module) => (
                <button
                  key={module.path}
                  onClick={() => router.push(module.path)}
                  className="group relative bg-white rounded-2xl p-6 text-left shadow-sm border border-slate-100 card-hover overflow-hidden"
                >
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${module.color} opacity-10 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500`}
                  />
                  <div className="relative z-10">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-3xl text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      {module.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {module.title}
                    </h3>
                    <p className="text-slate-500 text-sm">{module.desc}</p>
                  </div>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-600">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
