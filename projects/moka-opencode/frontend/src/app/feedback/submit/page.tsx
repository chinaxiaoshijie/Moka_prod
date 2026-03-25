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
  startTime: string;
}

export default function SubmitFeedbackPage() {
  const router = useRouter();
  const [interviewId, setInterviewId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setInterviewId(params.get("interviewId"));
    }
  }, []);

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    result: "PENDING" as "PASS" | "FAIL" | "PENDING",
    overallRating: 0,
    strengths: "",
    weaknesses: "",
    notes: "",
  });

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId]);

  const fetchInterview = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interviews/${interviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("获取面试信息失败");
      }

      const data = await response.json();
      setInterview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.overallRating === 0) {
      setError("请选择评分");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interviewId,
          result: formData.result,
          overallRating: formData.overallRating,
          strengths: formData.strengths || undefined,
          weaknesses: formData.weaknesses || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "提交反馈失败");
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

  const getResultText = (result: string) => {
    const resultMap: { [key: string]: string } = {
      PASS: "通过",
      FAIL: "不通过",
      PENDING: "待定",
    };
    return resultMap[result] || result;
  };

  if (fetchLoading) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-60 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-amber-600" />
          </div>
        </main>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-60 p-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              面试不存在
            </h2>
            <button
              onClick={() => router.push("/interviews")}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
            >
              返回面试列表
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-60 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push(`/interviews/${interviewId}`)}
              className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1 text-sm"
            >
              <span>←</span> 返回面试详情
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
              填写面试反馈
            </h1>
            <p className="text-slate-500 text-sm">
              为 {interview.candidate.name} 的{getTypeText(interview.type)}填写评价
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 面试信息摘要 */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">候选人：</span>
                    <span className="font-medium text-slate-700">
                      {interview.candidate.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">职位：</span>
                    <span className="font-medium text-slate-700">
                      {interview.position.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">面试官：</span>
                    <span className="font-medium text-slate-700">
                      {interview.interviewer.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">面试时间：</span>
                    <span className="font-medium text-slate-700">
                      {new Date(interview.startTime).toLocaleString("zh-CN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 总体评价 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  总体评价 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {["PASS", "FAIL", "PENDING"].map((result) => (
                    <label
                      key={result}
                      className={`flex-1 cursor-pointer rounded-lg border-2 p-3.5 text-center transition-all ${
                        formData.result === result
                          ? result === "PASS"
                            ? "border-emerald-500 bg-emerald-50"
                            : result === "FAIL"
                              ? "border-red-500 bg-red-50"
                              : "border-amber-500 bg-amber-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={result}
                        checked={formData.result === result}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            result: e.target.value as any,
                          }))
                        }
                        className="hidden"
                      />
                      <span
                        className={`text-sm font-medium ${
                          formData.result === result
                            ? result === "PASS"
                              ? "text-emerald-700"
                              : result === "FAIL"
                                ? "text-red-700"
                                : "text-amber-700"
                            : "text-slate-600"
                        }`}
                      >
                        {getResultText(result)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 评分 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  综合评分 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          overallRating: star,
                        }))
                      }
                      className={`text-3xl transition-all ${
                        star <= formData.overallRating
                          ? "text-amber-400 scale-110"
                          : "text-slate-200 hover:text-slate-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {formData.overallRating > 0
                    ? `${formData.overallRating} 星`
                    : "点击星星进行评分"}
                </p>
              </div>

              {/* 优势 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  优势亮点
                </label>
                <textarea
                  value={formData.strengths}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      strengths: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="请描述候选人的优势和亮点..."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none resize-none"
                />
              </div>

              {/* 不足 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  待提升项
                </label>
                <textarea
                  value={formData.weaknesses}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      weaknesses: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="请描述候选人需要提升的方面..."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none resize-none"
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  其他备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="其他需要记录的信息..."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none resize-none"
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push(`/interviews/${interviewId}`)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      提交中...
                    </span>
                  ) : (
                    "提交反馈"
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
