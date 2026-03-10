"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Interview {
  id: string;
  candidateId: string;
  candidate: { name: string; phone: string };
  positionId: string;
  position: { title: string };
  interviewerId: string;
  interviewer: { name: string };
  type: string;
  format: string;
  startTime: string;
  endTime: string;
  status: string;
  location: string | null;
  meetingUrl: string | null;
  meetingNumber: string | null;
}

interface User {
  id: string;
  name: string;
  role: string;
}

function EditInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("id");

  const [interview, setInterview] = useState<Interview | null>(null);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    interviewerId: "",
    type: "INTERVIEW_1" as "INTERVIEW_1" | "INTERVIEW_2" | "INTERVIEW_3",
    format: "ONLINE" as "ONLINE" | "OFFLINE",
    startTime: "",
    endTime: "",
    location: "",
    meetingUrl: "",
    meetingNumber: "",
  });

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
      fetchInterviewers();
    }
  }, [interviewId]);

  const fetchInterview = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3001/interviews/${interviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("获取面试信息失败");
      }

      const data = await response.json();
      setInterview(data);
      setFormData({
        interviewerId: data.interviewerId,
        type: data.type,
        format: data.format,
        startTime: formatDateTimeLocal(data.startTime),
        endTime: formatDateTimeLocal(data.endTime),
        location: data.location || "",
        meetingUrl: data.meetingUrl || "",
        meetingNumber: data.meetingNumber || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchInterviewers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInterviewers(data || []);
      }
    } catch (err) {
      console.error("获取面试官失败", err);
    }
  };

  const formatDateTimeLocal = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3001/interviews/${interviewId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            interviewerId: formData.interviewerId,
            type: formData.type,
            format: formData.format,
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString(),
            location: formData.location || undefined,
            meetingUrl: formData.meetingUrl || undefined,
            meetingNumber: formData.meetingNumber || undefined,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "更新面试失败");
      }

      router.push(`/interviews/${interviewId}`);
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

  if (fetchLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        </main>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              ❌
            </div>
            <h2 className="text-xl font-medium text-slate-900 mb-2">
              面试不存在
            </h2>
            <button
              onClick={() => router.push("/interviews")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium"
            >
              返回面试列表
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push(`/interviews/${interviewId}`)}
              className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
            >
              <span>←</span> 返回面试详情
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">编辑面试</h1>
            <p className="text-slate-500">
              编辑 {interview.candidate.name} 的{getTypeText(interview.type)}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本信息显示（不可编辑） */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">候选人：</span>
                    <span className="font-medium">
                      {interview.candidate.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">职位：</span>
                    <span className="font-medium">
                      {interview.position.title}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 面试类型 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    面试类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    required
                  >
                    <option value="INTERVIEW_1">初试</option>
                    <option value="INTERVIEW_2">复试</option>
                    <option value="INTERVIEW_3">终试</option>
                  </select>
                </div>

                {/* 面试形式 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    面试形式 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="ONLINE"
                        checked={formData.format === "ONLINE"}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, format: "ONLINE" }))
                        }
                        className="w-4 h-4 text-amber-500"
                      />
                      <span>线上</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="OFFLINE"
                        checked={formData.format === "OFFLINE"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            format: "OFFLINE",
                          }))
                        }
                        className="w-4 h-4 text-amber-500"
                      />
                      <span>线下</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 面试官 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  面试官 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.interviewerId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      interviewerId: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  required
                >
                  <option value="">请选择面试官</option>
                  {interviewers.map((interviewer) => (
                    <option key={interviewer.id} value={interviewer.id}>
                      {interviewer.name} (
                      {interviewer.role === "HR" ? "HR" : "面试官"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 开始时间 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    开始时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>

                {/* 结束时间 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    结束时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
              </div>

              {/* 线下地址或线上链接 */}
              {formData.format === "OFFLINE" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    面试地点
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="例如：公司A座3楼会议室"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      会议链接
                    </label>
                    <input
                      type="url"
                      value={formData.meetingUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          meetingUrl: e.target.value,
                        }))
                      }
                      placeholder="例如：https://meeting.tencent.com/..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      会议号
                    </label>
                    <input
                      type="text"
                      value={formData.meetingNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          meetingNumber: e.target.value,
                        }))
                      }
                      placeholder="例如：123 456 789"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push(`/interviews/${interviewId}`)}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      保存中...
                    </span>
                  ) : (
                    "保存修改"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </main>
        </div>
      }
    >
      <EditInterviewContent />
    </Suspense>
  );
}
