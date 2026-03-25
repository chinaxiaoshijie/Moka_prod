"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

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
      const response = await apiFetch("/interviews", {
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
      SCHEDULED: "bg-blue-50 text-blue-700",
      COMPLETED: "bg-emerald-50 text-emerald-700",
      CANCELLED: "bg-red-50 text-red-600",
    };
    return colorMap[status] || "bg-slate-100 text-slate-600";
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
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-60 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                面试安排
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">查看和管理面试日程</p>
            </div>
            <button
              onClick={() => router.push("/interviews/new")}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
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
            <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-amber-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  onClick={() => router.push(`/interviews/${interview.id}`)}
                  className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 p-5 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2.5">
                        <h3 className="text-base font-semibold text-slate-900">
                          {interview.candidate.name}
                        </h3>
                        <span className="text-slate-300">|</span>
                        <span className="text-sm text-slate-600">
                          {interview.position.title}
                        </span>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}
                        >
                          {getStatusText(interview.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-500">
                        <span>面试官：{interview.interviewer.name}</span>
                        <span>
                          {getTypeText(interview.type)} · {getFormatText(interview.format)}
                        </span>
                        <span>{formatDateTime(interview.startTime)}</span>
                        {interview.location && (
                          <span>{interview.location}</span>
                        )}
                        {interview.meetingUrl && (
                          <a
                            href={interview.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-600 hover:text-amber-700 hover:underline truncate max-w-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {interview.meetingUrl}
                          </a>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex gap-2 ml-6 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {interview.status === "SCHEDULED" && (
                        <button
                          onClick={() =>
                            router.push(`/interviews/${interview.id}`)
                          }
                          className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
                        >
                          查看详情
                        </button>
                      )}
                      {interview.status === "COMPLETED" && (
                        <button
                          onClick={() =>
                            router.push(`/interviews/${interview.id}`)
                          }
                          className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
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
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 mb-1">
                    暂无面试安排
                  </h3>
                  <p className="text-sm text-slate-500">
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
