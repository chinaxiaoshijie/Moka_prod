"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import MainLayout from "@/components/MainLayout";

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    if (interviewId) {
      fetchInterview();
      fetchFeedbacks();
    }
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id || null);
      }
    } catch {}
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

  const handleSendEmailToCandidate = async () => {
    setSendingEmail(true);
    setEmailMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interviews/${interviewId}/send-candidate-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: emailSubject,
            content: emailContent,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setEmailMessage("✅ " + data.message);
        setShowEmailModal(false);
        setEmailSubject("");
        setEmailContent("");
      } else {
        setEmailMessage("❌ " + (data.message || "发送失败"));
      }
    } catch (err: any) {
      setEmailMessage("❌ 邮件发送失败: " + (err.message || "未知错误"));
    } finally {
      setSendingEmail(false);
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
      PENDING: "text-[#4371FF] bg-[#EFF3FF]",
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

  // Determine if current user can submit feedback
  const currentUserHasFeedback = feedbacks.some(
    (fb) => fb.interviewerId === currentUserId,
  );
  const canShowFeedbackButton =
    interview &&
    interview.status !== "CANCELLED" &&
    !currentUserHasFeedback;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#E8EBF0] border-t-[#4371FF]" />
        </div>
      </MainLayout>
    );
  }

  if (!interview) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
            面试不存在
          </h2>
          <p className="text-[#666] text-sm mb-6">
            该面试安排已被删除或您没有权限查看
          </p>
          <button
            onClick={() => router.push("/interviews")}
            className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
          >
            返回面试列表
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/interviews")}
            className="text-[#666] hover:text-[#1A1A1A] mb-4 flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回面试列表
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
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
              <p className="text-[#666] text-sm">
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
                    className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    标记完成
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/interviews/edit?id=${interview.id}`)
                    }
                    className="border border-[#E8EBF0] hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
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
              {canShowFeedbackButton && (
                <button
                  onClick={() =>
                    router.push(
                      `/feedback/submit?interviewId=${interview.id}`,
                    )
                  }
                  className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
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
          <div className="mb-5 bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1A1A1A]">面试流程状态</h2>
              <button
                onClick={() => router.push(`/interview-processes/${interview.processId}`)}
                className="text-sm text-[#4371FF] hover:text-[#3461E6] font-medium"
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
                  processInfo.status === 'IN_PROGRESS' ? 'bg-[#EFF3FF] text-[#4371FF]' :
                  processInfo.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {processInfo.status === 'IN_PROGRESS' ? '进行中' :
                   processInfo.status === 'COMPLETED' ? '已完成' : '未开始'}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4371FF] rounded-full transition-all duration-500"
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
                          ? 'bg-[#EFF3FF] border-[#4371FF]/30'
                          : isScheduled
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50 border-[#E8EBF0]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-[#4371FF] animate-pulse inline-block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                      )}
                      <span className={`font-medium text-xs ${
                        isCompleted ? 'text-emerald-700' :
                        isCurrent ? 'text-[#4371FF]' : 'text-slate-600'
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
          <div className="mb-5 bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
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
            <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">
                面试信息
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#666] mb-1">候选人</p>
                  <p className="font-medium text-[#1A1A1A] text-sm">
                    {interview.candidate.name}
                  </p>
                  <p className="text-xs text-[#666] mt-0.5">
                    {interview.candidate.phone}
                  </p>
                  {interview.candidate.email && (
                    <p className="text-xs text-[#666]">
                      {interview.candidate.email}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#666] mb-1">应聘职位</p>
                  <p className="font-medium text-[#1A1A1A] text-sm">
                    {interview.position.title}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#666] mb-1">面试官</p>
                  <p className="font-medium text-[#1A1A1A] text-sm">
                    {interview.interviewer.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#666] mb-1">面试类型</p>
                  <p className="font-medium text-[#1A1A1A] text-sm">
                    {getTypeText(interview.type)} ·{" "}
                    {getFormatText(interview.format)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[#666] mb-1">面试时间</p>
                  <p className="font-medium text-[#1A1A1A] text-sm">
                    {formatDateTime(interview.startTime)}
                  </p>
                  <p className="text-xs text-[#666] mt-0.5">
                    至{" "}
                    {formatDateTime(interview.endTime)
                      .split(" ")
                      .slice(-2)
                      .join("")}
                  </p>
                </div>
                {interview.location && (
                  <div className="col-span-2">
                    <p className="text-xs text-[#666] mb-1">面试地点</p>
                    <p className="font-medium text-[#1A1A1A] text-sm">
                      {interview.location}
                    </p>
                  </div>
                )}
                {interview.meetingUrl && (
                  <div className="col-span-2">
                    <p className="text-xs text-[#666] mb-1">会议链接</p>
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
                    <p className="text-xs text-[#666] mb-1">会议号</p>
                    <p className="font-medium text-[#1A1A1A] text-sm">
                      {interview.meetingNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Feedback List */}
            <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#1A1A1A]">面试反馈</h2>
                {canShowFeedbackButton &&
                  feedbacks.length === 0 && (
                    <button
                      onClick={() =>
                        router.push(
                          `/feedback/submit?interviewId=${interview.id}`,
                        )
                      }
                      className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2 text-xs font-medium shadow-sm"
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
                      className="border border-[#E8EBF0] rounded-lg p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1A1A1A] text-sm">
                            {feedback.interviewer.name}
                          </span>
                          <span className="text-xs text-[#666]">
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
                                  ? "text-[#4371FF]"
                                  : "text-slate-200"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-2 text-xs text-[#666]">
                            {feedback.overallRating}分
                          </span>
                        </div>
                      )}

                      {feedback.strengths && (
                        <div className="mb-2">
                          <p className="text-xs text-[#666] mb-1">优势</p>
                          <p className="text-slate-700 text-sm">
                            {feedback.strengths}
                          </p>
                        </div>
                      )}

                      {feedback.weaknesses && (
                        <div className="mb-2">
                          <p className="text-xs text-[#666] mb-1">不足</p>
                          <p className="text-slate-700 text-sm">
                            {feedback.weaknesses}
                          </p>
                        </div>
                      )}

                      {feedback.notes && (
                        <div>
                          <p className="text-xs text-[#666] mb-1">备注</p>
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
            <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
              <h3 className="font-semibold text-[#1A1A1A] mb-3 text-sm">快捷操作</h3>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    router.push(`/interview-processes/${interview.processId}`)
                  }
                  disabled={!interview.processId}
                  className="w-full px-4 py-3 text-left rounded-lg border border-[#E8EBF0] hover:border-[#4371FF]/30 hover:bg-[#EFF3FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="font-medium text-[#1A1A1A] text-sm">查看面试流程</p>
                  <p className="text-xs text-[#666] mt-0.5">查看完整招聘流程</p>
                </button>
                <button
                  onClick={() =>
                    router.push(
                      `/candidates?search=${interview.candidate.name}`,
                    )
                  }
                  className="w-full px-4 py-3 text-left rounded-lg border border-[#E8EBF0] hover:border-[#4371FF]/30 hover:bg-[#EFF3FF] transition-all"
                >
                  <p className="font-medium text-[#1A1A1A] text-sm">查看候选人</p>
                  <p className="text-xs text-[#666] mt-0.5">查看候选人详情</p>
                </button>
                {interview.candidate.email && (
                  <button
                    onClick={() => {
                      setEmailSubject(`面试通知 - ${interview.position.title}`);
                      setEmailContent(`
<p>尊敬的 ${interview.candidate.name} 您好：</p>
<p>感谢您应聘我司 ${interview.position.title} 职位。经过初步筛选，我们诚挚邀请您参加面试：</p>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin-top: 0; color: #666;">面试信息</h3>
  <p><strong>职位：</strong>${interview.position.title}</p>
  <p><strong>时间：</strong>${formatDateTime(interview.startTime)}</p>
  <p><strong>形式：</strong>${getFormatText(interview.format)}</p>
  ${interview.location ? `<p><strong>面试地点：</strong>${interview.location}</p>` : ''}
  ${interview.meetingUrl ? `<p><strong>会议链接：</strong>${interview.meetingUrl}</p>` : ''}
  <p><strong>面试官：</strong>${interview.interviewer.name || '待定'}</p>
</div>
<p>请您准时参加。如有任何问题，请随时与我们联系。</p>
<p>祝您面试顺利！</p>
`);
                      setShowEmailModal(true);
                    }}
                    className="w-full px-4 py-3 text-left rounded-lg border border-[#4371FF]/30 hover:bg-[#EFF3FF] transition-all"
                  >
                    <p className="font-medium text-[#4371FF] text-sm">发送邮件给候选人</p>
                    <p className="text-xs text-[#666] mt-0.5">手动发送面试通知邮件</p>
                  </button>
                )}
              </div>
            </div>

            {emailMessage && (
              <div className={`rounded-xl p-4 border ${emailMessage.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <p className="text-sm">{emailMessage}</p>
              </div>
            )}

            <div className="bg-[#EFF3FF] rounded-xl p-5 border border-[#4371FF]/20">
              <h3 className="font-semibold text-[#4371FF] mb-2 text-sm">提示</h3>
              <p className="text-xs text-[#4371FF]/80 leading-relaxed">
                面试完成后，请及时填写反馈，帮助团队做出更好的招聘决策。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E8EBF0] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">发送邮件给候选人</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  收件人
                </label>
                <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-[#666] border border-[#E8EBF0]">
                  {interview?.candidate.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  邮件主题
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8EBF0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4371FF] focus:border-transparent"
                  placeholder="请输入邮件主题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  邮件内容
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8EBF0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4371FF] focus:border-transparent min-h-[300px] font-mono"
                  placeholder="请输入邮件内容（支持 HTML 格式）"
                />
              </div>

              {emailMessage && (
                <div className={`rounded-lg p-3 border ${emailMessage.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  <p className="text-sm">{emailMessage}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[#E8EBF0] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-5 py-2.5 border border-[#E8EBF0] rounded-lg text-sm font-medium text-[#666] hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleSendEmailToCandidate}
                disabled={sendingEmail || !emailSubject.trim()}
                className="px-5 py-2.5 bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>发送中...</span>
                  </>
                ) : (
                  <span>发送邮件</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
