"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

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
      const response = await fetch(
        `http://localhost:3001/interviews/${interviewId}`,
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
      const response = await fetch(
        `http://localhost:3001/feedback/interview/${interviewId}`,
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

    try {
      const token = localStorage.getItem("token");

      if (isEditing && myFeedback) {
        const response = await fetch(
          `http://localhost:3001/feedback/${myFeedback.id}`,
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
        const response = await fetch("http://localhost:3001/feedback", {
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
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (!interviewId) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              📝
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">面试反馈</h1>
            <p className="text-slate-500 mb-6">请选择要查看反馈的面试</p>
            <button
              onClick={() => router.push("/interviews")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
            >
              查看面试列表
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
        <div className="max-w-4xl mx-auto">
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
          ) : summary ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">面试反馈</h1>
                <button
                  onClick={() => router.push("/interviews")}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ← 返回
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  面试信息
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">候选人</p>
                    <p className="font-semibold text-slate-900">
                      {summary.candidateName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">应聘职位</p>
                    <p className="font-semibold text-slate-900">
                      {summary.positionTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">面试类型</p>
                    <p className="font-semibold text-slate-900">
                      {summary.interviewType === "INTERVIEW_1"
                        ? "初试"
                        : summary.interviewType === "INTERVIEW_2"
                          ? "复试"
                          : "终试"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">面试轮次</p>
                    <p className="font-semibold text-slate-900">
                      {summary.roundNumber && summary.totalRounds
                        ? `第${summary.roundNumber}轮 / 共${summary.totalRounds}轮`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">综合结果</p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getResultColor(summary.finalResult === "通过" ? "PASS" : summary.finalResult === "不通过" ? "FAIL" : "PENDING")}`}
                    >
                      {summary.finalResult}
                    </span>
                  </div>
                </div>
                {summary.averageRating && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-500 mb-2">平均评分</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl text-amber-500">
                        {renderStars(Math.round(summary.averageRating))}
                      </span>
                      <span className="text-slate-600">
                        ({summary.averageRating.toFixed(1)} / 5)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">
                    面试官反馈 ({summary.feedbacks.length})
                  </h2>
                  <div className="flex gap-2">
                    {myFeedback && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowForm(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
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
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                      >
                        {showForm ? "取消" : "添加反馈"}
                      </button>
                    )}
                  </div>
                </div>

                {showForm && (
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
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
                              className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                                result === r
                                  ? r === "PASS"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                    : r === "FAIL"
                                      ? "border-red-500 bg-red-50 text-red-700"
                                      : "border-amber-500 bg-amber-50 text-amber-700"
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
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
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
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
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
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <span className="text-2xl text-amber-500">
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
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          rows={2}
                          placeholder="其他补充说明..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                      >
                        {isEditing ? "更新反馈" : "提交反馈"}
                      </button>
                    </form>
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {summary.feedbacks.map((feedback, index) => (
                    <div
                      key={feedback.id}
                      className="p-6 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-medium">
                            {feedback.interviewer.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">
                            {feedback.interviewer.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getResultColor(feedback.result)}`}
                          >
                            {getResultText(feedback.result)}
                          </span>
                          {feedback.overallRating && (
                            <span className="text-amber-500 text-lg">
                              {renderStars(feedback.overallRating)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {feedback.strengths && (
                          <div className="flex gap-2">
                            <span className="text-emerald-500 font-medium">
                              优势:
                            </span>
                            <span className="text-slate-700">
                              {feedback.strengths}
                            </span>
                          </div>
                        )}
                        {feedback.weaknesses && (
                          <div className="flex gap-2">
                            <span className="text-red-500 font-medium">
                              劣势:
                            </span>
                            <span className="text-slate-700">
                              {feedback.weaknesses}
                            </span>
                          </div>
                        )}
                        {feedback.notes && (
                          <div className="flex gap-2">
                            <span className="text-slate-500 font-medium">
                              备注:
                            </span>
                            <span className="text-slate-700">
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
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        📝
                      </div>
                      <p className="text-slate-500">暂无反馈</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function FeedbackPage() {
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
      <FeedbackContent />
    </Suspense>
  );
}
