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

  // AI模型设置
  const [aiModel, setAiModel] = useState("qwen-plus");
  const [aiModelLoading, setAiModelLoading] = useState(false);
  const [aiModelMessage, setAiModelMessage] = useState("");

  // 飞书绑定状态
  const [feishuBinding, setFeishuBinding] = useState(false);
  const [feishuBindMessage, setFeishuBindMessage] = useState("");

  const AI_MODELS = [
    { value: "qwen-plus", label: "qwen-plus", desc: "默认模型，均衡性能" },
    { value: "qwen-turbo", label: "qwen-turbo", desc: "更快更便宜" },
    { value: "qwen-max", label: "qwen-max", desc: "更强推理能力" },
    { value: "qwen-long", label: "qwen-long", desc: "长上下文支持" },
    { value: "qwen-coder-plus", label: "qwen-coder-plus", desc: "代码能力强" },
    { value: "qwen3-235b-a22b", label: "qwen3-235b-a22b", desc: "超大参数模型" },
    { value: "qwen3-plus", label: "qwen3-plus", desc: "Qwen3 增强版" },
    { value: "qwen3.6-plus", label: "qwen3.6-plus", desc: "⭐ 最新旗舰，最强综合性能（推荐）" },
    { value: "qwen3-max", label: "qwen3-max", desc: "Qwen3 最强版" },
  ];

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
    // 加载AI模型设置
    loadAiModel();
  }, []);

  const loadAiModel = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await apiFetch("/settings/ai-model", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAiModel(data.model);
      }
    } catch (error) {
      // 静默失败
    }
  };

  const handleUpdateAiModel = async () => {
    setAiModelLoading(true);
    setAiModelMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await apiFetch("/settings/ai-model", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: aiModel }),
      });
      if (res.ok) {
        setAiModelMessage("AI模型已更新，下次诊断将使用新模型");
      } else {
        setAiModelMessage("更新失败，请重试");
      }
    } catch (error) {
      setAiModelMessage("网络错误，请稍后重试");
    } finally {
      setAiModelLoading(false);
    }
  };

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

  // ==================== 飞书 OAuth 绑定 ====================

  /**
   * 打开飞书 OAuth 授权窗口
   */
  const handleFeishuBind = async () => {
    setFeishuBinding(true);
    setFeishuBindMessage("");

    try {
      // 1. 获取 OAuth URL
      const res = await apiFetch("/auth/feishu/oauth-url", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) {
        setFeishuBindMessage("获取授权链接失败");
        setFeishuBinding(false);
        return;
      }

      const { url } = await res.json();

      // 2. 监听 OAuth 窗口回调消息
      const messageHandler = async (event: MessageEvent) => {
        if (event.data?.type === "feishu-bind-success") {
          window.removeEventListener("message", messageHandler);

          // 3. OAuth 窗口关闭后，刷新用户信息
          try {
            const profileRes = await apiFetch("/auth/profile", {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              setUser(profile);
              setFormData((prev) => ({
                ...prev,
                feishuOuId: profile.feishuOuId || "",
              }));
            }
          } catch (e) {
            console.error("刷新用户信息失败", e);
          }

          setFeishuBindMessage("飞书账号绑定成功！");
          setFeishuBinding(false);
        } else if (event.data?.type === "feishu-bind-error") {
          window.removeEventListener("message", messageHandler);
          setFeishuBindMessage("授权已取消或失败");
          setFeishuBinding(false);
        }
      };
      window.addEventListener("message", messageHandler);

      // 3. 打开飞书授权窗口
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(
        url,
        "feishu-oauth",
        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no`,
      );
    } catch (error) {
      setFeishuBindMessage("网络错误，请稍后重试");
      setFeishuBinding(false);
    }
  };

  /**
   * 解绑飞书账号
   */
  const handleFeishuUnbind = async () => {
    if (!confirm("确定要解绑飞书账号吗？解绑后将无法同步飞书日历。")) return;

    try {
      const res = await apiFetch("/auth/feishu/unbind", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.ok) {
        setFeishuBindMessage("飞书账号已解绑");
        const profileRes = await apiFetch("/auth/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUser(profile);
          setFormData((prev) => ({ ...prev, feishuOuId: "" }));
        }
      } else {
        setFeishuBindMessage("解绑失败");
      }
    } catch (error) {
      setFeishuBindMessage("网络错误");
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
                      飞书账号
                    </label>
                    {user?.feishuOuId ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm bg-slate-50 text-slate-600 flex items-center gap-2">
                          <span className="text-green-600">●</span>
                          <span className="truncate">已绑定: {user.feishuOuId}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleFeishuUnbind}
                          disabled={feishuBinding}
                          className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 whitespace-nowrap"
                        >
                          解绑
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm bg-slate-50 text-slate-400">
                          未绑定
                        </div>
                        <button
                          type="button"
                          onClick={handleFeishuBind}
                          disabled={feishuBinding}
                          className="bg-[#3370FF] hover:bg-[#2860E0] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          {feishuBinding ? "授权中..." : "绑定飞书"}
                        </button>
                      </div>
                    )}
                    {feishuBindMessage && (
                      <p className={`mt-1.5 text-xs ${
                        feishuBindMessage.includes("成功") || feishuBindMessage.includes("已解绑")
                          ? "text-green-600"
                          : "text-red-500"
                      }`}>
                        {feishuBindMessage}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      绑定后可在飞书日历收到面试提醒
                    </p>
                  </div>
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
                  AI诊断模型配置
                </h3>
                {aiModelMessage && (
                  <div
                    className={`mb-4 rounded-lg p-3 text-sm ${
                      aiModelMessage.includes("成功") || aiModelMessage.includes("已更新")
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-red-50 border border-red-200 text-red-600"
                    }`}
                  >
                    {aiModelMessage}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      选择AI模型
                    </label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none bg-white"
                    >
                      {AI_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label} - {m.desc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleUpdateAiModel}
                      disabled={aiModelLoading}
                      className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
                    >
                      {aiModelLoading ? "保存中..." : "保存模型设置"}
                    </button>
                    <span className="text-xs text-slate-400">
                      当前: {aiModel}
                    </span>
                  </div>
                </div>
              </div>

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
