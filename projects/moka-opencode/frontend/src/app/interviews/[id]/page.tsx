"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

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
  const [processInfo, setProcessInfo] = useState<any>(null);
  const [loadingProcess, setLoadingProcess] = useState(false);
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

  // Fetch process info when interview is loaded
  useEffect(() => {
    if (interview?.processId) {
      fetchProcessInfo();
    }
  }, [interview?.processId]);

  // Refresh data when page becomes visible (e.g., after returning from feedback page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && interviewId) {
        fetchFeedbacks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      const response = await apiFetch(
        `/feedback/interview/${interviewId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        let feedbacks = [];
        if (Array.isArray(data)) {
          feedbacks = data;
        } else if (Array.isArray(data?.data)) {
          feedbacks = data.data;
        } else if (Array.isArray(data?.feedbacks)) {
          feedbacks = data.feedbacks;
        }
        setFeedbacks(feedbacks);
      }
    } catch (err) {
      console.error("获取反馈失败", err);
    }
  };

  // Fetch process info for timeline
  const fetchProcessInfo = async () => {
    if (!interview?.processId) return;
    setLoadingProcess(true);
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interview-processes/${interview.processId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setProcessInfo(data);
      }
    } catch (err) {
      console.error("获取流程信息失败", err);
    } finally {
      setLoadingProcess(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interviews/${interviewId}`,
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
      const response = await apiFetch(
        `/interviews/${interviewId}`,
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
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-60 p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
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
        <main className="flex-1 lg:ml-60 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              面试不存在
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              该面试安排已被删除或您没有权限查看
            </p>
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
      <main className="flex-1 lg:ml-60 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/interviews")}
              className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1.5 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回面试列表
            </button>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {interview.candidate.name}
                  </h1>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      interview.status,
                    )}`}
                  >
                    {getStatusText(interview.status)}
                  </span>
                </div>
                <p className="text-slate-500 text-sm">
                  {interview.position.title} · {getTypeText(interview.type)} ·{" "}
                  {getFormatText(interview.format)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {interview.status === "SCHEDULED" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus("COMPLETED")}
                      disabled={updating}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
                    >
                      标记完成
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/interviews/edit?id=${interview.id}`)
                      }
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("CANCELLED")}
                      disabled={updating}
                      className="bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
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
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
                  >
                    填写反馈
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-3 py-2.5 text-sm"
                  title="删除面试"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Interview Process Status Card */}
          {processInfo && (
            <div className="mb-5 bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">面试流程状态</h2>
                <button
                  onClick={() => router.push(`/interview-processes/${interview.processId}`)}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  查看详情 →
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500 text-xs">
                    当前第 {processInfo.currentRound} 轮 / 共 {processInfo.totalRounds} 轮
                  </span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    processInfo.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                    processInfo.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {processInfo.status === 'IN_PROGRESS' ? '进行中' :
                     processInfo.status === 'COMPLETED' ? '已完成' : '未开始'}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${(processInfo.currentRound / processInfo.totalRounds) * 100}%` }}
                  />
                </div>
              </div>

              {/* Round timeline */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {processInfo.rounds?.map((round: any) => {
                  const interviewForRound = processInfo.interviews?.find(
                    (i: any) => i.roundNumber === round.roundNumber
                  );
                  const isCompleted = interviewForRound?.status === 'COMPLETED';
                  const isCurrent = round.roundNumber === processInfo.currentRound;
                  const isScheduled = interviewForRound && interviewForRound.status === 'SCHEDULED';

                  return (
                    <div
                      key={round.roundNumber}
                      className={`flex-shrink-0 px-3.5 py-2.5 rounded-lg border transition-all ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-200'
                          : isCurrent
                            ? 'bg-amber-50 border-amber-300'
                            : isScheduled
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                        )}
                        <span className={`font-medium text-xs ${
                          isCompleted ? 'text-emerald-700' :
                          isCurrent ? 'text-amber-700' : 'text-slate-600'
                        }`}>
                          {round.isHRRound ? 'HR面' : `第${round.roundNumber}轮`}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {round.interviewerName}
                      </div>
                      {interviewForRound && (
                        <div className={`text-xs mt-0.5 ${
                          isCompleted ? 'text-emerald-600' :
                          isScheduled ? 'text-blue-600' : 'text-slate-400'
                        }`}>
                          {isCompleted ? '已完成' :
                           isScheduled ? new Date(interviewForRound.startTime).toLocaleDateString('zh-CN') :
                           '待安排'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loadingProcess && (
            <div className="mb-5 bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <div className="animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
                <div className="flex gap-3">
                  <div className="h-14 bg-slate-100 rounded-lg w-24"></div>
                  <div className="h-14 bg-slate-100 rounded-lg w-24"></div>
                  <div className="h-14 bg-slate-100 rounded-lg w-24"></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-5">
            {/* Left: Interview Info */}
            <div className="col-span-2 space-y-5">
              {/* Basic Info */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">
                  面试信息
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">候选人</p>
                    <p className="font-medium text-slate-900 text-sm">
                      {interview.candidate.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {interview.candidate.phone}
                    </p>
                    {interview.candidate.email && (
                      <p className="text-xs text-slate-500">
                        {interview.candidate.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">应聘职位</p>
                    <p className="font-medium text-slate-900 text-sm">
                      {interview.position.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">面试官</p>
                    <p className="font-medium text-slate-900 text-sm">
                      {interview.interviewer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">面试类型</p>
                    <p className="font-medium text-slate-900 text-sm">
                      {getTypeText(interview.type)} ·{" "}
                      {getFormatText(interview.format)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">面试时间</p>
                    <p className="font-medium text-slate-900 text-sm">
                      {formatDateTime(interview.startTime)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      至{" "}
                      {formatDateTime(interview.endTime)
                        .split(" ")
                        .slice(-2)
                        .join("")}
                    </p>
                  </div>
                  {interview.location && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">面试地点</p>
                      <p className="font-medium text-slate-900 text-sm">
                        {interview.location}
                      </p>
                    </div>
                  )}
                  {interview.meetingUrl && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">会议链接</p>
                      <a
                        href={interview.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-sm"
                      >
                        {interview.meetingUrl}
                      </a>
                    </div>
                  )}
                  {interview.meetingNumber && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">会议号</p>
                      <p className="font-medium text-slate-900 text-sm">
                        {interview.meetingNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback List */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-900">面试反馈</h2>
                  {interview.status === "COMPLETED" &&
                    feedbacks.length === 0 && (
                      <button
                        onClick={() =>
                          router.push(
                            `/feedback/submit?interviewId=${interview.id}`,
                          )
                        }
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2 text-xs font-medium shadow-sm"
                      >
                        添加反馈
                      </button>
                    )}
                </div>

                {feedbacks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-500 text-sm">暂无反馈</p>
                    {interview.status === "COMPLETED" && (
                      <p className="text-xs text-slate-400 mt-1">
                        面试完成后请填写反馈
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="border border-slate-100 rounded-lg p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 text-sm">
                              {feedback.interviewer.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(feedback.createdAt).toLocaleDateString(
                                "zh-CN",
                              )}
                            </span>
                          </div>
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultColor(
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
                                className={`text-base ${
                                  star <= feedback.overallRating!
                                    ? "text-amber-400"
                                    : "text-slate-200"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 text-xs text-slate-500">
                              {feedback.overallRating}分
                            </span>
                          </div>
                        )}

                        {feedback.strengths && (
                          <div className="mb-2">
                            <p className="text-xs text-slate-500 mb-1">优势</p>
                            <p className="text-slate-700 text-sm">
                              {feedback.strengths}
                            </p>
                          </div>
                        )}

                        {feedback.weaknesses && (
                          <div className="mb-2">
                            <p className="text-xs text-slate-500 mb-1">不足</p>
                            <p className="text-slate-700 text-sm">
                              {feedback.weaknesses}
                            </p>
                          </div>
                        )}

                        {feedback.notes && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">备注</p>
                            <p className="text-slate-700 text-sm">{feedback.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">快捷操作</h3>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      router.push(`/interview-processes/${interview.processId}`)
                    }
                    disabled={!interview.processId}
                    className="w-full px-4 py-3 text-left rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900 text-sm">查看面试流程</p>
                    <p className="text-xs text-slate-500 mt-0.5">查看完整招聘流程</p>
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/candidates?search=${interview.candidate.name}`,
                      )
                    }
                    className="w-full px-4 py-3 text-left rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all"
                  >
                    <p className="font-medium text-slate-900 text-sm">查看候选人</p>
                    <p className="text-xs text-slate-500 mt-0.5">查看候选人详情</p>
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                <h3 className="font-semibold text-amber-900 mb-2 text-sm">提示</h3>
                <p className="text-xs text-amber-800 leading-relaxed">
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
