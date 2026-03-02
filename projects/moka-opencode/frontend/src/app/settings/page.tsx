"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
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
      }));
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/auth/profile", {
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">系统设置</h1>
            <p className="text-slate-500">管理个人信息和系统配置</p>
          </div>

          {/* 标签页 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              个人资料
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "system"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              系统信息
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "about"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              关于
            </button>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl p-4 ${
                message.includes("成功")
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          {/* 个人资料 */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  基本信息
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      角色
                    </label>
                    <input
                      type="text"
                      value={user?.role === "HR" ? "HR管理员" : "面试官"}
                      disabled
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 text-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg font-medium disabled:opacity-50"
                  >
                    {loading ? "保存中..." : "保存修改"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  修改密码
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg font-medium disabled:opacity-50"
                  >
                    {loading ? "修改中..." : "修改密码"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 系统信息 */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  系统信息
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">系统版本</span>
                    <span className="font-medium">v1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">最后更新</span>
                    <span className="font-medium">2026-02-24</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-slate-600">数据库状态</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                      正常
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  缓存管理
                </h3>
                <p className="text-slate-500 mb-4">
                  清除本地缓存数据，需要重新登录
                </p>
                <button
                  onClick={handleClearCache}
                  className="px-6 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium"
                >
                  清除缓存并退出
                </button>
              </div>
            </div>
          )}

          {/* 关于 */}
          {activeTab === "about" && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-3xl font-bold">M</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Moka 面试管理系统
              </h2>
              <p className="text-slate-500 mb-6">智能化招聘管理平台</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p>版本: v1.0.0</p>
                <p>技术栈: NestJS + Next.js + Prisma + PostgreSQL</p>
                <p>© 2026 Moka Interview System. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
