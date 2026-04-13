"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/MainLayout";

interface Feedback {
  id: string;
  interviewId: string;
  interviewerId: string;
  interviewer: { name: string };
  result: "PASS" | "FAIL" | "PENDING";
  strengths: string | null;
  weaknesses: string | null;
  overallRating: number | null;
  notes: string | null;
  createdAt: string;
}

interface InterviewSummary {
  interviewId: string;
  candidateName: string;
  positionTitle: string;
  interviewType: string;
  roundNumber?: number;
  totalRounds?: number;
  processStatus?: string;
  feedbacks: Feedback[];
  averageRating: number | null;
  finalResult: string;
}

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");

  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [myFeedback, setMyFeedback] = useState<Feedback | null>(null);
  const [result, setResult] = useState<"PASS" | "FAIL" | "PENDING">("PENDING");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [overallRating, setOverallRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
    }

    if (interviewId) {
      fetchInterviewDetails();
      fetchFeedback();
    }
  }, [interviewId]);

  const fetchInterviewDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interviews/${interviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (summary) {
          setSummary({
            ...summary,
            roundNumber: data.roundNumber,
            totalRounds: data.totalRounds,
            processStatus: data.process?.status,
          });
        } else {
          setSummary({
            interviewId: data.id,
            candidateName: data.candidate?.name || "",
            positionTitle: data.position?.title || "",
            interviewType: data.type,
            roundNumber: data.roundNumber,
            totalRounds: data.totalRounds,
            processStatus: data.process?.status,
            feedbacks: [],
            averageRating: null,
            finalResult: "待定",
          });
        }
      }
    } catch (err) {
      console.error("获取面试详情失败", err);
    }
  };

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/feedback/interview/${interviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("获取反馈失败");
      }

      const data = await response.json();
      setSummary(data);

      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        const existingFeedback = data.feedbacks.find(
          (f: Feedback) => f.interviewerId === user.id,
        );
        if (existingFeedback) {
          setMyFeedback(existingFeedback);
          setResult(existingFeedback.result);
          setStrengths(existingFeedback.strengths || "");
          setWeaknesses(existingFeedback.weaknesses || "");
          setOverallRating(existingFeedback.overallRating || 3);
          setNotes(existingFeedback.notes || "");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // 防止重复提交
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      if (isEditing && myFeedback) {
        const response = await apiFetch(
          `/feedback/${myFeedback.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              result,
              strengths: strengths || undefined,
              weaknesses: weaknesses || undefined,
              overallRating,
              notes: notes || undefined,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "更新反馈失败");
        }
      } else {
        const response = await apiFetch("/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            interviewId,
            result,
            strengths: strengths || undefined,
            weaknesses: weaknesses || undefined,
            overallRating,
            notes: notes || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "提交反馈失败");
        }
      }

      await fetchFeedback();
      setShowForm(false);
      setIsEditing(false);
      setResult("PENDING");
      setStrengths("");
      setWeaknesses("");
      setOverallRating(3);
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case "PASS":
        return "通过";
      case "FAIL":
        return "不通过";
      case "PENDING":
        return "待定";
      default:
        return result;
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "PASS":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "FAIL":
        return "bg-red-100 text-red-700 border-red-200";
      case "PENDING":
        return "bg-[#EFF3FF] text-[#4371FF] border-[#4371FF]/30";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (!interviewId) {
    return (
      <MainLayout>
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">面试反馈</h1>
            <p className="text-slate-500 mb-6 text-sm">请选择要查看反馈的面试</p>
            <button
              onClick={() => router.push("/interviews")}
              className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              查看面试列表
            </button>
          </div>
        </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-[#4371FF]" />
            </div>
          ) : summary ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">面试反馈</h1>
                <button
                  onClick={() => router.push("/interviews")}
                  className="border border-[#E8EBF0] hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                >
                  返回
                </button>
              </div>

              <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">
                  面试信息
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">候选人</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {summary.candidateName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">应聘职位</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {summary.positionTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">面试类型</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {summary.interviewType === "INTERVIEW_1"
                        ? "初试"
                        : summary.interviewType === "INTERVIEW_2"
                          ? "复试"
                          : "终试"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">面试轮次</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {summary.roundNumber && summary.totalRounds
                        ? `第${summary.roundNumber}轮 / 共${summary.totalRounds}轮`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">综合结果</p>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getResultColor(summary.finalResult === "通过" ? "PASS" : summary.finalResult === "不通过" ? "FAIL" : "PENDING")}`}
                    >
                      {summary.finalResult}
                    </span>
                  </div>
                </div>
                {summary.averageRating && (
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">平均评分</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl text-[#4371FF]">
                        {renderStars(Math.round(summary.averageRating))}
                      </span>
                      <span className="text-sm text-slate-500">
                        ({summary.averageRating.toFixed(1)} / 5)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E8EBF0] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700">
                    面试官反馈 ({summary.feedbacks.length})
                  </h2>
                  <div className="flex gap-2">
                    {myFeedback && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowForm(true);
                        }}
                        className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        修改我的反馈
                      </button>
                    )}
                    {!myFeedback && (
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setShowForm(!showForm);
                        }}
                        className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {showForm ? "取消" : "添加反馈"}
                      </button>
                    )}
                  </div>
                </div>

                {showForm && (
                  <div className="p-6 border-b border-[#E8EBF0] bg-slate-50/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          面试结果 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                          {["PASS", "FAIL", "PENDING"].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() =>
                                setResult(r as "PASS" | "FAIL" | "PENDING")
                              }
                              className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                                result === r
                                  ? r === "PASS"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : r === "FAIL"
                                      ? "border-red-500 bg-red-50 text-red-700"
                                      : "border-[#4371FF] bg-[#EFF3FF] text-[#4371FF]"
                                  : "border-slate-200 text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {getResultText(r)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            优势
                          </label>
                          <textarea
                            value={strengths}
                            onChange={(e) => setStrengths(e.target.value)}
                            className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                            rows={3}
                            placeholder="候选人的优势..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            劣势
                          </label>
                          <textarea
                            value={weaknesses}
                            onChange={(e) => setWeaknesses(e.target.value)}
                            className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                            rows={3}
                            placeholder="需要改进的地方..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          综合评分 (1-5)
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={overallRating}
                            onChange={(e) =>
                              setOverallRating(Number(e.target.value))
                            }
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4371FF]"
                          />
                          <span className="text-xl text-[#4371FF]">
                            {renderStars(overallRating)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          备注
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                          rows={2}
                          placeholder="其他补充说明..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "提交中..." : (isEditing ? "更新反馈" : "提交反馈")}
                      </button>
                    </form>
                  </div>
                )}

                <div className="divide-y divide-slate-50">
                  {summary.feedbacks.map((feedback, index) => (
                    <div
                      key={feedback.id}
                      className="p-6"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                            {feedback.interviewer.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">
                            {feedback.interviewer.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getResultColor(feedback.result)}`}
                          >
                            {getResultText(feedback.result)}
                          </span>
                          {feedback.overallRating && (
                            <span className="text-[#4371FF] text-base">
                              {renderStars(feedback.overallRating)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        {feedback.strengths && (
                          <div className="flex gap-2">
                            <span className="text-emerald-600 font-medium">
                              优势:
                            </span>
                            <span className="text-slate-600">
                              {feedback.strengths}
                            </span>
                          </div>
                        )}
                        {feedback.weaknesses && (
                          <div className="flex gap-2">
                            <span className="text-red-500 font-medium">
                              劣势:
                            </span>
                            <span className="text-slate-600">
                              {feedback.weaknesses}
                            </span>
                          </div>
                        )}
                        {feedback.notes && (
                          <div className="flex gap-2">
                            <span className="text-slate-400 font-medium">
                              备注:
                            </span>
                            <span className="text-slate-600">
                              {feedback.notes}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        提交时间:{" "}
                        {new Date(feedback.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}

                  {summary.feedbacks.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500">暂无反馈</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </MainLayout>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-[#4371FF]" />
          </main>
        </MainLayout>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
