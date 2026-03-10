"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3001/notifications?unreadOnly=${filter === "unread"}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.items || []);
      }
    } catch (err) {
      console.error("获取通知失败", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string, link?: string | null) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:3001/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );

      if (link) {
        router.push(link);
      }
    } catch (err) {
      console.error("标记已读失败", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:3001/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("标记全部已读失败", err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:3001/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("删除通知失败", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      INTERVIEW_REMINDER: "📅",
      FEEDBACK_REQUEST: "📝",
      PROCESS_UPDATE: "🔄",
      SYSTEM: "🔔",
    };
    return icons[type] || "🔔";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                通知中心
              </h1>
              <p className="text-slate-500">您有 {unreadCount} 条未读通知</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                全部标记已读
              </button>
            )}
          </div>

          {/* 筛选标签 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === "all"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              全部 ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === "unread"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              未读 ({unreadCount})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                🔔
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {filter === "unread" ? "没有未读通知" : "暂无通知"}
              </h3>
              <p className="text-slate-500">
                {filter === "unread"
                  ? "您已查看所有通知"
                  : "有新消息时会在这里显示"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                    !notification.read
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3
                            className={`font-semibold text-lg ${
                              !notification.read
                                ? "text-slate-900"
                                : "text-slate-600"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-slate-600 mt-1">
                            {notification.content}
                          </p>
                          <p className="text-sm text-slate-400 mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() =>
                                markAsRead(notification.id, notification.link)
                              }
                              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                            >
                              标记已读
                            </button>
                          )}
                          {notification.link && notification.read && (
                            <button
                              onClick={() => router.push(notification.link!)}
                              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                              查看详情
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="删除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
