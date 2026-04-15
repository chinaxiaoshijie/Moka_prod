"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  feishuOuId?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "system" | "about">(
    "profile",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    feishuOuId: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFormData((prev) => ({
        ...prev,
        name: parsed.name || "",
        email: parsed.email || "",
        feishuOuId: parsed.feishuOuId || "",
      }));
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage("个人信息更新成功");
      } else {
        setMessage("更新失败，请重试");
      }
    } catch (error) {
      setMessage("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeishuId = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feishuOuId: formData.feishuOuId,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage("飞书ID绑定成功");
      } else {
        setMessage("绑定失败，请重试");
      }
    } catch (error) {
      setMessage("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("两次输入的密码不一致");
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage("新密码长度至少为6位");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await apiFetch("/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "密码修改失败");
        return;
      }
      setMessage("密码修改成功");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setMessage("密码修改失败");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const tabs = [
    { id: "profile" as const, label: "个人资料" },
    { id: "system" as const, label: "系统信息" },
    { id: "about" as const, label: "关于" },
  ];

  return (
    <MainLayout>
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">系统设置</h1>
            <p className="text-slate-500 text-sm mt-1">管理个人信息和系统配置</p>
          </div>

          {/* 标签页 */}
          <div className="flex gap-1 mb-6 bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#4371FF] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl p-4 text-sm ${
                message.includes("成功")
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          {/* 个人资料 */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-5">
                  基本信息
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      姓名
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      飞书ID
                    </label>
                    <input
                      type="text"
                      value={formData.feishuOuId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          feishuOuId: e.target.value,
                        }))
                      }
                      placeholder="请输入飞书OuId"
                      className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateFeishuId}
                    disabled={loading}
                    className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    {loading ? "绑定中..." : "绑定飞书ID"}
                  </button>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      角色
                    </label>
                    <input
                      type="text"
                      value={user?.role === "HR" ? "HR管理员" : "面试官"}
                      disabled
                      className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm bg-slate-50 text-slate-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    {loading ? "保存中..." : "保存修改"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-5">
                  修改密码
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      当前密码
                    </label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      新密码
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    {loading ? "修改中..." : "修改密码"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 系统信息 */}
          {activeTab === "system" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-5">
                  系统信息
                </h3>
                <div className="space-y-0">
                  <div className="flex items-center justify-between py-3.5 border-b border-slate-50">
                    <span className="text-sm text-slate-600">系统版本</span>
                    <span className="text-sm font-medium text-slate-900">v2.0.0</span>
                  </div>
                  <div className="flex items-center justify-between py-3.5 border-b border-slate-50">
                    <span className="text-sm text-slate-600">最后更新</span>
                    <span className="text-sm font-medium text-slate-900">2026-04-09</span>
                  </div>
                  <div className="flex items-center justify-between py-3.5">
                    <span className="text-sm text-slate-600">数据库状态</span>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      正常
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  缓存管理
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  清除本地缓存数据，需要重新登录
                </p>
                <button
                  onClick={handleClearCache}
                  className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2.5 text-sm font-medium"
                >
                  清除缓存并退出
                </button>
              </div>
            </div>
          )}

          {/* 关于 */}
          {activeTab === "about" && (
            <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-10 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#4371FF] to-[#3461E6] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">M</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                码隆智能面试系统
              </h2>
              <p className="text-slate-500 text-sm mb-6">智能化招聘管理平台</p>
              <div className="space-y-2 text-sm text-slate-500">
                <p>版本: v2.0.0</p>
                <p>技术栈: NestJS + Next.js + Prisma + PostgreSQL</p>
                <p>© 2026 码隆智能科技. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </MainLayout>
  );
}
