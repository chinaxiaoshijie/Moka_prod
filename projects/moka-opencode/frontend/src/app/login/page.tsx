"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import FeishuBindModal from "@/components/FeishuBindModal";

/* 码隆智能 Logo SVG */
const MokaLogoSVG = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#4371FF" />
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

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFeishuBind, setShowFeishuBind] = useState(false);
  const [loginUser, setLoginUser] = useState<any>(null);

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

      // 检查是否已绑定飞书
      if (!data.user.feishuOuId) {
        setLoginUser(data.user);
        setShowFeishuBind(true);
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("网络错误，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Blue branding panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4371FF 0%, #2952CC 60%, #1A3A9F 100%)" }}>
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.04] rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/[0.06] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top logo */}
          <div className="flex items-center gap-2.5">
            <MokaLogoSVG size={36} />
            <span className="text-white font-bold text-[17px] tracking-tight">
              码隆智能面试
            </span>
          </div>

          {/* Center content */}
          <div className="max-w-md">
            <h1 className="text-[2.5rem] xl:text-5xl font-bold text-white leading-[1.15] mb-5 tracking-tight">
              智能化
              <br />
              <span className="text-white/70">招聘管理平台</span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed mb-12">
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
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
                  <div>
                    <span className="text-white/85 text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="text-white/45 text-sm ml-2">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">&copy; 2026 码隆智能科技</p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[360px]">
          {/* Logo at top */}
          <div className="flex items-center gap-2.5 mb-8">
            <MokaLogoSVG size={32} />
            <span className="text-[#1A1A1A] font-bold text-[16px] tracking-tight">
              码隆智能面试
            </span>
          </div>

          <div className="mb-7">
            <h2 className="text-[22px] font-bold text-[#1A1A1A] tracking-tight mb-1">
              欢迎使用码隆智能面试系统
            </h2>
            <p className="text-[#999] text-sm">请登录您的账号</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#666] mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#999] focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 transition-all outline-none"
                placeholder="请输入用户名"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#666] mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#999] focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 transition-all outline-none"
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
              className="w-full rounded-lg bg-[#4371FF] hover:bg-[#3461E6] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
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

          {/* Privacy policy */}
          <p className="text-[11px] text-[#999] text-center mt-4">
            登录即代表您同意
            <span className="text-[#4371FF] cursor-pointer hover:underline ml-0.5">服务条款</span>
            {" "}与{" "}
            <span className="text-[#4371FF] cursor-pointer hover:underline">隐私政策</span>
          </p>

          {/* SSO option */}
          <div className="mt-4 text-center">
            <span className="text-[13px] text-[#999]">
              支持{" "}
              <span className="text-[#4371FF] cursor-pointer hover:underline font-medium">SSO 单点登录</span>
            </span>
          </div>

          {/* Test accounts */}
          <div className="mt-8 pt-6 border-t border-[#F0F2F5]">
            <p className="text-xs text-[#999] text-center mb-3">测试账号</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername("hr");
                  setPassword("hr123456");
                }}
                className="px-3 py-2 bg-[#F5F7FA] border border-[#E8EBF0] rounded-lg text-xs text-[#666] hover:border-[#4371FF]/30 hover:bg-[#EFF3FF] transition-colors text-center"
              >
                <span className="font-semibold text-[#4371FF] block text-[11px]">
                  HR
                </span>
                <span className="text-[#999] text-[11px]">
                  hr / hr123456
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername("interviewer");
                  setPassword("interviewer123");
                }}
                className="px-3 py-2 bg-[#F5F7FA] border border-[#E8EBF0] rounded-lg text-xs text-[#666] hover:border-[#4371FF]/30 hover:bg-[#EFF3FF] transition-colors text-center"
              >
                <span className="font-semibold text-[#4371FF] block text-[11px]">
                  面试官
                </span>
                <span className="text-[#999] text-[11px]">interviewer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 飞书绑定弹窗 */}
      <FeishuBindModal
        isOpen={showFeishuBind}
        onClose={() => setShowFeishuBind(false)}
        onBound={() => {
          setShowFeishuBind(false);
          window.location.href = "/dashboard";
        }}
        onSkip={() => {
          setShowFeishuBind(false);
          window.location.href = "/dashboard";
        }}
      />
    </div>
  );
}
