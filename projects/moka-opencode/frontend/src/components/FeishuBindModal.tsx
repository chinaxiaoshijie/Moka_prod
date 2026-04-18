"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

const LOCAL_STORAGE_KEY = "moka_feishu_bind_dismissed";

interface FeishuBindModalProps {
  /** Whether to show the modal */
  open: boolean;
  /** Called after successful binding or dismiss */
  onClose: (bound?: boolean) => void;
}

/**
 * 飞书绑定引导弹窗
 * 在用户登录后检测 feishuOuId 为空时弹出，引导绑定飞书账号
 * 支持 OAuth 弹窗授权，也支持"稍后绑定"
 */
export default function FeishuBindModal({ open, onClose }: FeishuBindModalProps) {
  const [binding, setBinding] = useState(false);
  const [message, setMessage] = useState("");

  // 当弹窗关闭时清空消息
  useEffect(() => {
    if (!open) {
      setMessage("");
      setBinding(false);
    }
  }, [open]);

  const handleBind = async () => {
    setBinding(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await apiFetch("/auth/feishu/oauth-url", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setMessage("获取授权链接失败");
        setBinding(false);
        return;
      }

      const { url } = await res.json();

      // 监听 OAuth 窗口回调
      const messageHandler = async (event: MessageEvent) => {
        if (event.data?.type === "feishu-bind-success") {
          window.removeEventListener("message", messageHandler);
          const openId = event.data.openId;

          // 调用 bind 端点保存到数据库
          try {
            const bindRes = await apiFetch("/auth/feishu/bind", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ openId }),
            });
            const bindData = await bindRes.json();
            if (bindRes.ok && bindData.success) {
              // 刷新 localStorage 中的 user 信息
              const profileRes = await apiFetch("/auth/profile", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (profileRes.ok) {
                const profile = await profileRes.json();
                localStorage.setItem("user", JSON.stringify(profile));
              }
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              onClose(true);
            } else {
              setMessage(bindData.message || "绑定失败");
              setBinding(false);
            }
          } catch (e) {
            console.error("绑定失败", e);
            setMessage("保存绑定信息失败");
            setBinding(false);
          }
        } else if (event.data?.type === "feishu-bind-error") {
          window.removeEventListener("message", messageHandler);
          setMessage("授权已取消或失败");
          setBinding(false);
        }
      };
      window.addEventListener("message", messageHandler);

      // 打开飞书授权窗口
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
      setMessage("网络错误，请稍后重试");
      setBinding(false);
    }
  };

  const handleDismiss = () => {
    // 记录已跳过，避免每次登录都弹
    localStorage.setItem(LOCAL_STORAGE_KEY, Date.now().toString());
    onClose(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative px-6 pt-6 pb-4 text-center" style={{ background: "linear-gradient(135deg, #3370FF 0%, #5B8DEF 100%)" }}>
          {/* Feishu icon */}
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="white" fillOpacity="0.9" />
              <path d="M16 24l5 5L32 18" stroke="#3370FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">绑定飞书账号</h2>
          <p className="text-white/70 text-sm">开启飞书日历面试提醒</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="space-y-3 mb-5">
            {[
              { icon: "📅", title: "日历同步", desc: "面试安排自动同步到飞书日历" },
              { icon: "🔔", title: "消息提醒", desc: "面试前自动收到飞书消息通知" },
              { icon: "👤", title: "身份统一", desc: "一次绑定，全系统通用" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F7FA]">
                <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-sm font-medium text-[#1A1A1A]">{item.title}</div>
                  <div className="text-xs text-[#00000073] mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {message && (
            <div className={`rounded-xl p-3 text-sm mb-4 ${
              message.includes("成功") || message.includes("已绑定")
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={binding}
              className="flex-1 rounded-xl border border-[#E8EBF0] bg-white hover:bg-[#F5F7FA] text-[#666] px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              稍后绑定
            </button>
            <button
              type="button"
              onClick={handleBind}
              disabled={binding}
              className="flex-1 rounded-xl bg-[#3370FF] hover:bg-[#2860E0] text-white px-4 py-2.5 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {binding ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  授权中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  立即绑定
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
