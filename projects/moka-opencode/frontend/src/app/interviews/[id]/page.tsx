"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Interview {
  id: string;
  candidateId: string;
  candidate: { name: string; phone: string; email: string | null };
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
  processId: string | null;
  roundNumber: number | null;
  createdAt: string;
}

interface Feedback {
  id: string;
  interviewerId: string;
  interviewer: { name: string };
  result: string;
  strengths: string | null;
  weaknesses: string | null;
  overallRating: number | null;
  notes: string | null;
  createdAt: string;
}

export default function InterviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
      fetchFeedbacks();
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
        throw new Error("获取面试详情失败");
      }

      const data = await response.json();
      setInterview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3001/feedback/interview/${interviewId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data || []);
      }
    } catch (err) {
      console.error("获取反馈失败", err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
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
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error("更新状态失败");
      }

      await fetchInterview();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个面试安排吗？")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3001/interviews/${interviewId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("删除面试失败");
      }

      router.push("/interviews");
    } catch (err: any) {
      setError(err.message);
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

  const getResultText = (result: string) => {
    const resultMap: { [key: string]: string } = {
      PASS: "通过",
      FAIL: "不通过",
      PENDING: "待定",
    };
    return resultMap[result] || result;
  };

  const getResultColor = (result: string) => {
    const colorMap: { [key: string]: string } = {
      PASS: "text-emerald-600 bg-emerald-50",
      FAIL: "text-red-600 bg-red-50",
      PENDING: "text-amber-600 bg-amber-50",
    };
    return colorMap[result] || "text-slate-600 bg-slate-50";
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "long",
    });
  };

  if (loading) {
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
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              ❌
            </div>
            <h2 className="text-xl font-medium text-slate-900 mb-2">
              面试不存在
            </h2>
            <p className="text-slate-500 mb-6">
              该面试安排已被删除或您没有权限查看
            </p>
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
        <div className="max-w-4xl mx-auto">
          {/* 头部 */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/interviews")}
              className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
            >
              <span>←</span> 返回面试列表
            </button>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">
                    {interview.candidate.name}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      interview.status,
                    )}`}
                  >
                    {getStatusText(interview.status)}
                  </span>
                </div>
                <p className="text-slate-500">
                  {interview.position.title} · {getTypeText(interview.type)} ·{" "}
                  {getFormatText(interview.format)}
                </p>
              </div>
              <div className="flex gap-3">
                {interview.status === "SCHEDULED" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus("COMPLETED")}
                      disabled={updating}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50"
                    >
                      标记完成
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/interviews/edit?id=${interview.id}`)
                      }
                      className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("CANCELLED")}
                      disabled={updating}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                      取消面试
                    </button>
                  </>
                )}
                {interview.status === "COMPLETED" && (
                  <button
                    onClick={() =>
                      router.push(
                        `/feedback/submit?interviewId=${interview.id}`,
                      )
                    }
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg"
                  >
                    填写反馈
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="删除面试"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6">
            {/* 左侧：面试信息 */}
            <div className="col-span-2 space-y-6">
              {/* 基本信息 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  面试信息
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">候选人</p>
                    <p className="font-medium text-slate-900">
                      {interview.candidate.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {interview.candidate.phone}
                    </p>
                    {interview.candidate.email && (
                      <p className="text-sm text-slate-500">
                        {interview.candidate.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">应聘职位</p>
                    <p className="font-medium text-slate-900">
                      {interview.position.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">面试官</p>
                    <p className="font-medium text-slate-900">
                      {interview.interviewer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">面试类型</p>
                    <p className="font-medium text-slate-900">
                      {getTypeText(interview.type)} ·{" "}
                      {getFormatText(interview.format)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500 mb-1">面试时间</p>
                    <p className="font-medium text-slate-900">
                      {formatDateTime(interview.startTime)}
                    </p>
                    <p className="text-sm text-slate-500">
                      至{" "}
                      {formatDateTime(interview.endTime)
                        .split(" ")
                        .slice(-2)
                        .join("")}
                    </p>
                  </div>
                  {interview.location && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500 mb-1">面试地点</p>
                      <p className="font-medium text-slate-900">
                        {interview.location}
                      </p>
                    </div>
                  )}
                  {interview.meetingUrl && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500 mb-1">会议链接</p>
                      <a
                        href={interview.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {interview.meetingUrl}
                      </a>
                    </div>
                  )}
                  {interview.meetingNumber && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500 mb-1">会议号</p>
                      <p className="font-medium text-slate-900">
                        {interview.meetingNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 反馈列表 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">面试反馈</h2>
                  {interview.status === "COMPLETED" &&
                    feedbacks.length === 0 && (
                      <button
                        onClick={() =>
                          router.push(
                            `/feedback/submit?interviewId=${interview.id}`,
                          )
                        }
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-medium hover:shadow-lg"
                      >
                        添加反馈
                      </button>
                    )}
                </div>

                {feedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                      📝
                    </div>
                    <p className="text-slate-500">暂无反馈</p>
                    {interview.status === "COMPLETED" && (
                      <p className="text-sm text-slate-400 mt-1">
                        面试完成后请填写反馈
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="border border-slate-100 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {feedback.interviewer.name}
                            </span>
                            <span className="text-sm text-slate-400">
                              {new Date(feedback.createdAt).toLocaleDateString(
                                "zh-CN",
                              )}
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getResultColor(
                              feedback.result,
                            )}`}
                          >
                            {getResultText(feedback.result)}
                          </span>
                        </div>

                        {feedback.overallRating && (
                          <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${
                                  star <= feedback.overallRating!
                                    ? "text-amber-400"
                                    : "text-slate-200"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 text-sm text-slate-500">
                              {feedback.overallRating}分
                            </span>
                          </div>
                        )}

                        {feedback.strengths && (
                          <div className="mb-2">
                            <p className="text-sm text-slate-500 mb-1">优势</p>
                            <p className="text-slate-700">
                              {feedback.strengths}
                            </p>
                          </div>
                        )}

                        {feedback.weaknesses && (
                          <div className="mb-2">
                            <p className="text-sm text-slate-500 mb-1">不足</p>
                            <p className="text-slate-700">
                              {feedback.weaknesses}
                            </p>
                          </div>
                        )}

                        {feedback.notes && (
                          <div>
                            <p className="text-sm text-slate-500 mb-1">备注</p>
                            <p className="text-slate-700">{feedback.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：快捷操作 */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-900 mb-4">快捷操作</h3>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      router.push(`/interview-processes/${interview.processId}`)
                    }
                    disabled={!interview.processId}
                    className="w-full px-4 py-3 text-left rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900">查看面试流程</p>
                    <p className="text-sm text-slate-500">查看完整招聘流程</p>
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/candidates?search=${interview.candidate.name}`,
                      )
                    }
                    className="w-full px-4 py-3 text-left rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-all"
                  >
                    <p className="font-medium text-slate-900">查看候选人</p>
                    <p className="text-sm text-slate-500">查看候选人详情</p>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-2">💡 提示</h3>
                <p className="text-sm text-amber-800">
                  面试完成后，请及时填写反馈，帮助团队做出更好的招聘决策。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
