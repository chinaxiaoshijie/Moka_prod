"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "登录失败，请检查用户名和密码");
        setLoading(false);
        return;
      }

      if (!data.access_token || !data.user) {
        setError("登录响应格式错误");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      document.cookie = `token=${data.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err);
      setError("网络错误，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-[#0c1222] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-600/8 via-transparent to-blue-600/5" />
          <div className="absolute top-24 left-16 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-24 right-16 w-80 h-80 bg-slate-500/5 rounded-full blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="text-white/80 text-base font-semibold tracking-tight">
              Moka
            </span>
          </div>

          <div className="max-w-md">
            <h1 className="text-[2.5rem] xl:text-5xl font-bold text-white leading-[1.15] mb-5 tracking-tight">
              智能化
              <br />
              <span className="text-amber-400">招聘管理平台</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed mb-12">
              高效管理职位发布、候选人筛选、面试流程与反馈评估，助力企业精准招聘。
            </p>

            <div className="space-y-5">
              {[
                { label: "职位管理", desc: "灵活创建和跟踪招聘需求" },
                { label: "简历解析", desc: "PDF 简历一键导入候选人信息" },
                { label: "面试协调", desc: "多轮面试自动安排与提醒" },
                { label: "数据洞察", desc: "招聘漏斗与转化率实时分析" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 flex-shrink-0" />
                  <div>
                    <span className="text-white/80 text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="text-slate-500 text-sm ml-2">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs">&copy; 2026 Moka</p>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[340px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Moka</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
              欢迎回来
            </h2>
            <p className="text-slate-500 text-sm">登录您的账号以继续</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none"
                placeholder="请输入用户名"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all outline-none"
                placeholder="请输入密码"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  登录中...
                </span>
              ) : (
                "登录"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-3">测试账号</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername("hr");
                  setPassword("hr123456");
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 hover:border-amber-200 hover:bg-amber-50/50 transition-colors text-center"
              >
                <span className="font-medium text-amber-700 block text-[11px]">
                  HR
                </span>
                <span className="text-slate-400 text-[11px]">
                  hr / hr123456
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername("interviewer");
                  setPassword("interviewer123");
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-center"
              >
                <span className="font-medium text-blue-700 block text-[11px]">
                  面试官
                </span>
                <span className="text-slate-400 text-[11px]">interviewer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
