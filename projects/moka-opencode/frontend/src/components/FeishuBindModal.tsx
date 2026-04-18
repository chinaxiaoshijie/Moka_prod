"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface FeishuBindModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBound: () => void;
  onSkip: () => void;
}

export default function FeishuBindModal({ isOpen, onClose, onBound, onSkip }: FeishuBindModalProps) {
  const [binding, setBinding] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const handleBind = useCallback(async () => {
    setBinding(true);
    setMessage("");
    try {
      const res = await apiFetch("/auth/feishu/oauth-url", {
        method: "GET",
      });

      if (!res.ok) {
        setMessage("获取授权链接失败");
        setMessageType("error");
        setBinding(false);
        return;
      }

      const data = await res.json();
      if (!data.url) {
        setMessage("未获取到飞书授权链接，请检查配置");
        setMessageType("error");
        setBinding(false);
        return;
      }

      // 监听子窗口回调
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === "feishu-bind-success") {
          const openId = event.data.openId;
          if (!openId) {
            setMessage("绑定失败：未获取到飞书账号信息");
            setMessageType("error");
            setBinding(false);
            return;
          }

          // 调用 bind 端点完成绑定
          try {
            const bindRes = await apiFetch("/auth/feishu/bind", {
              method: "POST",
              body: JSON.stringify({ openId }),
            });
            const bindData = await bindRes.json();
            if (bindData.success) {
              setMessage("飞书账号绑定成功！");
              setMessageType("success");
              // 更新本地 user 信息
              const user = JSON.parse(localStorage.getItem("user") || "{}");
              user.feishuOuId = openId;
              localStorage.setItem("user", JSON.stringify(user));
              setTimeout(() => {
                setBinding(false);
                onBound();
                onClose();
              }, 1200);
            } else {
              setMessage(bindData.message || "绑定失败");
              setMessageType("error");
              setBinding(false);
            }
          } catch (err) {
            console.error("绑定请求异常:", err);
            setMessage("绑定请求失败，请重试");
            setMessageType("error");
            setBinding(false);
          }
        } else if (event.data?.type === "feishu-bind-error") {
          setMessage("飞书授权未完成，请重试");
          setMessageType("error");
          setBinding(false);
        }
      };

      window.addEventListener("message", handleMessage);

      // 打开飞书授权窗口
      const popup = window.open(data.url, "feishu-oauth", "width=600,height=700,menubar=no,toolbar=no");
      if (!popup) {
        // 弹窗被拦截，直接在当前页打开
        window.removeEventListener("message", handleMessage);
        window.location.href = data.url;
        return;
      }

      // 轮询检查弹窗是否关闭
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", handleMessage);
          // 如果还没收到绑定成功消息，认为用户放弃了
          if (messageType !== "success" && !message) {
            setMessage("授权窗口已关闭，如未完成绑定请重试");
            setMessageType("error");
            setBinding(false);
          }
        }
      }, 500);

    } catch (err) {
      console.error("飞书绑定异常:", err);
      setMessage("网络错误，请稍后重试");
      setMessageType("error");
      setBinding(false);
    }
  }, [onBound, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3370FF] to-[#4371FF] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.5" fill="none"/>
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">绑定飞书账号</h3>
              <p className="text-white/70 text-xs">享受更高效的面试管理体验</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="space-y-3 mb-5">
            {[
              { icon: "📅", title: "飞书日历自动同步", desc: "面试安排自动添加到你的飞书日历" },
              { icon: "🔔", title: "面试提醒直达飞书", desc: "新面试安排实时推送到飞书消息" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-lg px-3.5 py-2.5 text-sm mb-4 ${
              messageType === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-600 border border-red-100"
            }`}>
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              disabled={binding}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              稍后绑定
            </button>
            <button
              onClick={handleBind}
              disabled={binding}
              className="flex-1 rounded-lg bg-[#4371FF] hover:bg-[#3461E6] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {binding ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  授权中...
                </>
              ) : (
                "立即绑定飞书"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
