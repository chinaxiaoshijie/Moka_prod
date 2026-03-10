"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Interview {
  id: string;
  candidate: { name: string; phone: string };
  position: { title: string };
  interviewer: { name: string };
  type: string;
  format: string;
  startTime: string;
  endTime: string;
  status: string;
  location: string | null;
  meetingUrl: string | null;
}

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/interviews", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取面试列表失败");
      }

      const data = await response.json();
      setInterviews(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      INTERVIEW_1: "初试",
      INTERVIEW_2: "复试",
      INTERVIEW_3: "终试",
    };
    return typeMap[type] || type;
  };

  const getFormatText = (format: string) => {
    const formatMap: { [key: string]: string } = {
      ONLINE: "线上",
      OFFLINE: "线下",
    };
    return formatMap[format] || format;
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      SCHEDULED: "已安排",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
      COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
      CANCELLED: "bg-red-100 text-red-700 border-red-200",
    };
    return colorMap[status] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                面试安排
              </h1>
              <p className="text-slate-500">查看和管理面试日程</p>
            </div>
            <button
              onClick={() => router.push("/interviews/new")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              安排面试
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview, index) => (
                <div
                  key={interview.id}
                  onClick={() => router.push(`/interviews/${interview.id}`)}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {interview.candidate.name}
                        </h3>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">
                          {interview.position.title}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(interview.status)}`}
                        >
                          {getStatusText(interview.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="text-violet-500">👤</span>
                          <span>面试官：{interview.interviewer.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="text-blue-500">🎯</span>
                          <span>
                            {getTypeText(interview.type)} ·{" "}
                            {getFormatText(interview.format)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="text-amber-500">📅</span>
                          <span>{formatDateTime(interview.startTime)}</span>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-emerald-500">📍</span>
                            <span>{interview.location}</span>
                          </div>
                        )}
                        {interview.meetingUrl && (
                          <div className="flex items-center gap-2 text-slate-600 col-span-2">
                            <span className="text-blue-500">🔗</span>
                            <a
                              href={interview.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 hover:underline truncate"
                            >
                              {interview.meetingUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex gap-2 ml-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {interview.status === "SCHEDULED" && (
                        <>
                          <button
                            onClick={() =>
                              router.push(`/interviews/${interview.id}`)
                            }
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                          >
                            查看详情
                          </button>
                        </>
                      )}
                      {interview.status === "COMPLETED" && (
                        <button
                          onClick={() =>
                            router.push(`/interviews/${interview.id}`)
                          }
                          className="px-4 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors text-sm font-medium"
                        >
                          查看详情
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {interviews.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                    📅
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    暂无面试安排
                  </h3>
                  <p className="text-slate-500">
                    候选人接受面试邀请后将显示在这里
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
