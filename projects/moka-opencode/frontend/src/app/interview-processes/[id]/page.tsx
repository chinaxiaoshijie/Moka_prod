"use client";
import { apiFetch } from "@/lib/api";
import { formatUTCToLocal, utcToLocalInput, localToUTC } from "@/lib/timezone";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";

interface Feedback {
  id: string;
  interviewerId: string;
  interviewerName: string;
  result: string;
  strengths: string | null;
  weaknesses: string | null;
  overallRating: number | null;
  notes: string | null;
  createdAt: string;
}

interface ProcessRound {
  roundNumber: number;
  interviewerId: string;
  interviewerName: string;
  isHRRound: boolean;
  roundType: string;
}

interface ProcessInterview {
  id: string;
  roundNumber: number;
  interviewerId: string;
  interviewerName: string;
  type: string;
  format: string;
  startTime: string;
  endTime: string | null;
  status: string;
  location: string | null;
  meetingUrl: string | null;
  meetingNumber: string | null;
  hasFeedback: boolean;
  feedbackResult?: string;
  feedbacks: Feedback[];
}

interface Process {
  id: string;
  candidateId: string;
  candidateName: string;
  positionId: string;
  positionTitle: string;
  currentRound: number;
  totalRounds: number;
  status: string;
  hasHRRound: boolean;
  createdById: string;
  rounds: ProcessRound[];
  interviews: ProcessInterview[];
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default function InterviewProcessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const processId = params.id as string;

  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingRound, setSchedulingRound] = useState<number | null>(null);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ 防重复提交
  const [scheduleForm, setScheduleForm] = useState({
    startTime: "",
    endTime: "",
    format: "ONLINE" as "ONLINE" | "OFFLINE",
    location: "",
    meetingUrl: "",
    meetingNumber: "",
  });

  // Round config modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configRound, setConfigRound] = useState<number | null>(null);
  const [interviewerOptions, setInterviewerOptions] = useState<UserOption[]>([]);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState("");

  // Feedback edit state
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackEditForm, setFeedbackEditForm] = useState({ notes: "", strengths: "", weaknesses: "" });

  // HR 代填写反馈弹窗状态
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInterviewId, setFeedbackInterviewId] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isCompletingRound, setIsCompletingRound] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    result: "PENDING" as "PASS" | "FAIL" | "PENDING",
    overallRating: 0,
    strengths: "",
    weaknesses: "",
    notes: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // ignore
      }
    }
    fetchProcess();
  }, [processId]);

  // HR 代填写反馈
  const handleSubmitFeedback = async () => {
    if (!feedbackInterviewId) return;
    if (feedbackForm.overallRating === 0) {
      setError("请选择评分");
      return;
    }

    // 防重复提交
    if (isSubmittingFeedback) {
      console.log("正在提交中，请勿重复点击");
      return;
    }
    setIsSubmittingFeedback(true);

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interviewId: feedbackInterviewId,
          result: feedbackForm.result,
          overallRating: feedbackForm.overallRating,
          strengths: feedbackForm.strengths || undefined,
          weaknesses: feedbackForm.weaknesses || undefined,
          notes: feedbackForm.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "提交反馈失败");
      }

      setShowFeedbackModal(false);
      setFeedbackInterviewId(null);
      setFeedbackForm({
        result: "PENDING",
        overallRating: 0,
        strengths: "",
        weaknesses: "",
        notes: "",
      });
      fetchProcess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const fetchProcess = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`/interview-processes/${processId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("获取流程详情失败");
      const data = await response.json();
      setProcess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!schedulingRound) return;
    if (!scheduleForm.startTime || !scheduleForm.endTime) {
      setError("请填写开始时间和结束时间");
      return;
    }
    // ✅ 防重复提交
    if (isSubmitting) {
      console.log("正在提交中，请勿重复点击");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const isEditing = editingInterviewId !== null;
      const url = isEditing
        ? `/interviews/${editingInterviewId}`
        : `/interview-processes/${processId}/rounds/${schedulingRound}/interview`;

      // 转换时间：datetime-local (本地时间) -> UTC
      const body = {
        ...scheduleForm,
        startTime: localToUTC(scheduleForm.startTime),
        endTime: localToUTC(scheduleForm.endTime),
      };

      const response = await apiFetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || (isEditing ? "更新面试安排失败" : "安排面试失败"));
      }
      setShowScheduleModal(false);
      setEditingInterviewId(null);
      fetchProcess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false); // ✅ 释放提交锁
    }
  };

  const handleCompleteRound = async (action: "next" | "complete" | "reject") => {
    // 防重复提交
    if (isCompletingRound) {
      console.log("正在处理中，请勿重复点击");
      return;
    }
    setIsCompletingRound(true);

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interview-processes/${processId}/complete-round`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action }),
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "操作失败");
      }
      setError("");
      fetchProcess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCompletingRound(false);
    }
  };

  const handleUpdateRoundConfig = async () => {
    if (!configRound || !selectedInterviewerId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interview-processes/${processId}/rounds/${configRound}/config`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ interviewerId: selectedInterviewerId }),
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "更新配置失败");
      }
      setShowConfigModal(false);
      fetchProcess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateFeedback = async (feedbackId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`/feedback/${feedbackId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(feedbackEditForm),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "更新反馈失败");
      }
      setEditingFeedbackId(null);
      fetchProcess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openScheduleModal = (roundNumber: number) => {
    setSchedulingRound(roundNumber);
    const existingInterview = process?.interviews.find(i => i.roundNumber === roundNumber);
    if (existingInterview) {
      setEditingInterviewId(existingInterview.id);
      setScheduleForm({
        startTime: existingInterview.startTime ? utcToLocalInput(existingInterview.startTime) : "",
        endTime: existingInterview.endTime ? utcToLocalInput(existingInterview.endTime) :
          existingInterview.startTime ? new Date(new Date(existingInterview.startTime).getTime() + 3600000).toISOString().slice(0, 16) : "",
        format: (existingInterview.format as "ONLINE" | "OFFLINE") || "ONLINE",
        location: existingInterview.location || "",
        meetingUrl: existingInterview.meetingUrl || "",
        meetingNumber: existingInterview.meetingNumber || "",
      });
    } else {
      setEditingInterviewId(null);
      setScheduleForm({ startTime: "", endTime: "", format: "ONLINE", location: "", meetingUrl: "", meetingNumber: "" });
    }
    setShowScheduleModal(true);
  };

  const openConfigModal = async (roundNumber: number) => {
    setConfigRound(roundNumber);
    const round = process?.rounds.find(r => r.roundNumber === roundNumber);
    setSelectedInterviewerId(round?.interviewerId || "");

    // Fetch interviewer list
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/users?role=INTERVIEWER", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInterviewerOptions(data.items || data || []);
      }
    } catch {
      // ignore
    }
    setShowConfigModal(true);
  };

  const getStatusBanner = (): { text: string; color: string; bg: string } | null => {
    if (!process) return null;
    const currentInterview = process.interviews.find(i => i.roundNumber === process.currentRound);

    switch (process.status) {
      case "IN_PROGRESS":
        if (!currentInterview) {
          return { text: `第${process.currentRound}轮等待安排面试时间`, color: "text-[#d48806]", bg: "bg-[#fffbe6] border-[#ffe58f]" };
        }
        if (currentInterview.status === "SCHEDULED") {
          return { text: `第${process.currentRound}轮面试已安排，等待面试官反馈`, color: "text-[#1890ff]", bg: "bg-[#e6f7ff] border-[#91d5ff]" };
        }
        return { text: `第${process.currentRound}轮面试进行中`, color: "text-[#1890ff]", bg: "bg-[#e6f7ff] border-[#91d5ff]" };
      case "WAITING_HR":
        return { text: `第${process.currentRound}轮已完成，请HR确认下一步`, color: "text-[#fa8c16]", bg: "bg-[#fff7e6] border-[#ffd591]" };
      case "COMPLETED":
        return { text: "面试流程已完成", color: "text-[#52c41a]", bg: "bg-[#f6ffed] border-[#b7eb8f]" };
      case "CANCELLED":
        return { text: "面试流程已取消", color: "text-[#ff4d4f]", bg: "bg-[#fff2f0] border-[#ffccc7]" };
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      IN_PROGRESS: "bg-[#e6f7ff] text-[#1890ff]",
      WAITING_HR: "bg-[#fff7e6] text-[#fa8c16]",
      COMPLETED: "bg-[#f6ffed] text-[#52c41a]",
      CANCELLED: "bg-[#fff2f0] text-[#ff4d4f]",
    };
    return map[status] || "bg-[#fafafa] text-[#00000073]";
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      IN_PROGRESS: "进行中",
      WAITING_HR: "等待HR确认",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
    };
    return map[status] || status;
  };

  const getRoundStatus = (roundNumber: number) => {
    if (!process) return "pending";
    const interview = process.interviews.find(i => i.roundNumber === roundNumber);
    if (!interview) return "pending";
    if (interview.status === "COMPLETED") return "completed";
    if (interview.status === "SCHEDULED") return "scheduled";
    return "pending";
  };

  // Permission check: can this user edit feedback result?
  const canEditFeedbackResult = (feedback: Feedback, interview: ProcessInterview): boolean => {
    if (!process || !user) return false;
    // HR 可以编辑任何反馈
    if (user.role === "HR") return true;
    // 面试官只能编辑自己的反馈
    if (feedback.interviewerId !== user.id) return false;
    return process.currentRound === interview.roundNumber && process.status === "IN_PROGRESS";
  };

  const canEditFeedbackNotes = (feedback: Feedback): boolean => {
    if (!user) return false;
    // HR 可以编辑任何反馈
    if (user.role === "HR") return true;
    return feedback.interviewerId === user.id;
  };

  // HR 可以为任何面试填写反馈
  const canCreateFeedback = (interview: ProcessInterview): boolean => {
    if (!user) return false;
    if (user.role === "HR") return true;
    if (user.role === "INTERVIEWER" && interview.interviewerId === user.id) return true;
    return false;
  };

  if (loading) {
    return (
      <MainLayout>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#f0f0f0] border-t-[#1890ff]" />
        </main>
      </MainLayout>
    );
  }

  if (!process) {
    return (
      <MainLayout>
        <main className="flex-1 p-8">
          <div className="text-center py-20">
            <p className="text-[#00000073] text-sm">流程不存在</p>
          </div>
        </main>
      </MainLayout>
    );
  }

  const banner = getStatusBanner();
  const isHR = user?.role === "HR";
  // 修复 Bug 10：WAITING_HR 状态也允许 HR 操作
  const isWaitingHR = process.status === "WAITING_HR" || process.status === "IN_PROGRESS";

  return (
    <MainLayout>
      <main className="flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-[#000000d9] tracking-tight">面试流程详情</h1>
              <p className="text-[13px] text-[#00000073] mt-0.5">{process.candidateName} · {process.positionTitle}</p>
            </div>
            <span className={`inline-flex px-2.5 py-0.5 rounded text-[12px] font-medium ${getStatusColor(process.status)}`}>
              {getStatusText(process.status)}
            </span>
          </div>

          {/* Status Banner */}
          {banner && (
            <div className={`rounded-lg border p-3 mb-4 ${banner.bg}`}>
              <p className={`text-[13px] font-medium ${banner.color}`}>{banner.text}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-[#fff2f0] border border-[#ffccc7] p-3 text-[#ff4d4f] text-[13px]">
              {error}
              <button onClick={() => setError("")} className="float-right text-[#ff4d4f] hover:text-[#ff7875]">×</button>
            </div>
          )}

          {/* HR Action Panel */}
          {isHR && isWaitingHR && (
            <div className="bg-white rounded-lg border border-[#f0f0f0] p-5 mb-4">
              <h3 className="text-sm font-semibold text-[#000000d9] mb-3">
                第{process.currentRound}轮面试已完成，请确认下一步
              </h3>
              <div className="flex gap-2">
                {process.currentRound < process.totalRounds ? (
                  <>
                    <button
                      onClick={() => handleCompleteRound("next")}
                      disabled={isCompletingRound}
                      className="bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded-md px-4 py-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      通过，安排下一轮
                    </button>
                    <button
                      onClick={() => handleCompleteRound("complete")}
                      disabled={isCompletingRound}
                      className="bg-[#52c41a] hover:bg-[#73d13d] text-white rounded-md px-4 py-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      直接录用
                    </button>
                    <button
                      onClick={() => handleCompleteRound("reject")}
                      disabled={isCompletingRound}
                      className="bg-[#fff2f0] text-[#ff4d4f] hover:bg-[#ffccc7] rounded-md px-4 py-2 text-[13px] font-medium border border-[#ffccc7] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      不通过
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleCompleteRound("complete")}
                      disabled={isCompletingRound}
                      className="bg-[#52c41a] hover:bg-[#73d13d] text-white rounded-md px-4 py-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      通过，录用候选人
                    </button>
                    <button
                      onClick={() => handleCompleteRound("reject")}
                      disabled={isCompletingRound}
                      className="bg-[#fff2f0] text-[#ff4d4f] hover:bg-[#ffccc7] rounded-md px-4 py-2 text-[13px] font-medium border border-[#ffccc7] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      不通过
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Candidate Info Card */}
          <div className="bg-white rounded-lg border border-[#f0f0f0] p-5 mb-4">
            <h2 className="text-sm font-semibold text-[#000000d9] mb-3">候选人信息</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
              <div>
                <span className="text-[12px] text-[#00000073]">姓名</span>
                <p className="text-[#000000d9] font-medium mt-0.5">{process.candidateName}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#00000073]">应聘职位</span>
                <p className="text-[#000000d9] mt-0.5">{process.positionTitle}</p>
              </div>
              <div>
                <span className="text-[12px] text-[#00000073]">当前轮次</span>
                <p className="text-[#000000d9] mt-0.5">第{process.currentRound}轮 / 共{process.totalRounds}轮</p>
              </div>
              <div>
                <span className="text-[12px] text-[#00000073]">创建时间</span>
                <p className="text-[#000000d9] mt-0.5">{new Date(process.createdAt).toLocaleDateString("zh-CN")}</p>
              </div>
            </div>
          </div>

          {/* Interview Process Timeline */}
          <div className="bg-white rounded-lg border border-[#f0f0f0] p-5">
            <h2 className="text-sm font-semibold text-[#000000d9] mb-5">面试流程时间线</h2>

            <div className="space-y-5">
              {process.rounds.map((round, index) => {
                const status = getRoundStatus(round.roundNumber);
                const interview = process.interviews.find(i => i.roundNumber === round.roundNumber);
                const isCurrentRound = process.currentRound === round.roundNumber;
                const isFuture = round.roundNumber > process.currentRound;

                return (
                  <div key={round.roundNumber} className="relative flex gap-3">
                    {/* Timeline connector */}
                    {index < process.rounds.length - 1 && (
                      <div className={`absolute left-[15px] top-9 bottom-0 w-0.5 ${
                        status === "completed" ? "bg-[#b7eb8f]" : "bg-[#f0f0f0]"
                      }`} />
                    )}

                    {/* Status dot */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold z-10 flex-shrink-0 ${
                      status === "completed" ? "bg-[#52c41a] text-white" :
                      status === "scheduled" ? "bg-[#1890ff] text-white" :
                      isCurrentRound ? "bg-[#1890ff] text-white" :
                      "bg-[#f0f0f0] text-[#00000073]"
                    }`}>
                      {status === "completed" ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : round.roundNumber}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-[13px] font-semibold text-[#000000d9]">
                            第{round.roundNumber}轮 · {round.isHRRound ? "HR面试" : round.roundType === "TECHNICAL" ? "复面" : round.roundType === "FINAL" ? "终面" : round.roundType}
                          </h3>
                          <p className="text-[12px] text-[#00000073] mt-0.5">
                            面试官：{round.interviewerName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* HR can change future round interviewer */}
                          {isHR && isFuture && process.status !== "COMPLETED" && process.status !== "CANCELLED" && (
                            <button
                              onClick={() => openConfigModal(round.roundNumber)}
                              className="text-[12px] text-[#1890ff] hover:text-[#40a9ff] font-medium"
                            >
                              更换面试官
                            </button>
                          )}
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                            status === "completed" ? "bg-[#f6ffed] text-[#52c41a]" :
                            status === "scheduled" ? "bg-[#e6f7ff] text-[#1890ff]" :
                            isCurrentRound ? "bg-[#e6f7ff] text-[#1890ff]" :
                            "bg-[#fafafa] text-[#00000073]"
                          }`}>
                            {status === "completed" ? "已完成" :
                             status === "scheduled" ? "已安排" :
                             isCurrentRound ? "进行中" : "待安排"}
                          </span>
                        </div>
                      </div>

                      {/* Interview details */}
                      {interview ? (
                        <div className="bg-[#fafafa] rounded-lg border border-[#f0f0f0] p-4">
                          {/* Time and format */}
                          <div className="grid grid-cols-2 gap-2 text-[12px] text-[#000000a6] mb-3">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-[#00000073]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatUTCToLocal(interview.startTime)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-[#00000073]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {interview.format === "ONLINE" ? "线上面试" : "线下面试"}
                              {interview.location && ` · ${interview.location}`}
                            </div>
                            {interview.meetingUrl && (
                              <div className="col-span-2">
                                <span className="text-[#00000073]">会议链接：</span>
                                <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer"
                                   className="text-[#1890ff] hover:text-[#40a9ff]">
                                  {interview.meetingUrl}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Feedbacks */}
                          {interview.feedbacks && interview.feedbacks.length > 0 && (
                            <div className="border-t border-[#f0f0f0] pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[12px] font-semibold text-[#000000d9]">面试反馈</h4>
                                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                                  interview.feedbackResult === "PASS" ? "bg-[#f6ffed] text-[#52c41a]" :
                                  interview.feedbackResult === "FAIL" ? "bg-[#fff2f0] text-[#ff4d4f]" :
                                  "bg-[#e6f7ff] text-[#1890ff]"
                                }`}>
                                  {interview.feedbackResult === "PASS" ? "通过" :
                                   interview.feedbackResult === "FAIL" ? "不通过" : "待定"}
                                </span>
                              </div>

                              {interview.feedbacks.map((fb) => {
                                const isEditing = editingFeedbackId === fb.id;
                                const canEditNotes = canEditFeedbackNotes(fb);
                                const canEditResult = canEditFeedbackResult(fb, interview);

                                return (
                                  <div key={fb.id} className="mb-3 last:mb-0">
                                    {/* Rating */}
                                    {fb.overallRating && (
                                      <div className="flex items-center gap-0.5 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <span key={star} className={`text-sm ${
                                            star <= (fb.overallRating ?? 0) ? "text-[#faad14]" : "text-[#f0f0f0]"
                                          }`}>★</span>
                                        ))}
                                        <span className="ml-1.5 text-[11px] text-[#00000073]">{fb.overallRating}分</span>
                                      </div>
                                    )}

                                    {/* Result tag (read-only for past rounds) */}
                                    {!canEditResult && fb.result && (
                                      <div className="mb-2">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                                          fb.result === "PASS" ? "bg-[#f6ffed] text-[#52c41a]" :
                                          fb.result === "FAIL" ? "bg-[#fff2f0] text-[#ff4d4f]" :
                                          "bg-[#fafafa] text-[#00000073]"
                                        }`}>
                                          结论：{fb.result === "PASS" ? "通过" : fb.result === "FAIL" ? "不通过" : "待定"}（不可修改）
                                        </span>
                                      </div>
                                    )}

                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <div>
                                          <label className="text-[11px] text-[#00000073]">优势</label>
                                          <textarea
                                            value={feedbackEditForm.strengths}
                                            onChange={(e) => setFeedbackEditForm(prev => ({ ...prev, strengths: e.target.value }))}
                                            className="w-full rounded border border-[#d9d9d9] px-2.5 py-1.5 text-[12px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none mt-0.5"
                                            rows={2}
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[11px] text-[#00000073]">待改进</label>
                                          <textarea
                                            value={feedbackEditForm.weaknesses}
                                            onChange={(e) => setFeedbackEditForm(prev => ({ ...prev, weaknesses: e.target.value }))}
                                            className="w-full rounded border border-[#d9d9d9] px-2.5 py-1.5 text-[12px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none mt-0.5"
                                            rows={2}
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[11px] text-[#00000073]">备注</label>
                                          <textarea
                                            value={feedbackEditForm.notes}
                                            onChange={(e) => setFeedbackEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full rounded border border-[#d9d9d9] px-2.5 py-1.5 text-[12px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none mt-0.5"
                                            rows={2}
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleUpdateFeedback(fb.id)}
                                            className="bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded px-3 py-1 text-[12px] font-medium"
                                          >
                                            保存
                                          </button>
                                          <button
                                            onClick={() => setEditingFeedbackId(null)}
                                            className="border border-[#d9d9d9] hover:border-[#1890ff] text-[#000000d9] rounded px-3 py-1 text-[12px]"
                                          >
                                            取消
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          {fb.strengths && (
                                            <div className="bg-[#f6ffed] rounded p-2.5">
                                              <p className="text-[#52c41a] font-medium text-[11px] mb-0.5">优势</p>
                                              <p className="text-[#000000a6] text-[12px]">{fb.strengths}</p>
                                            </div>
                                          )}
                                          {fb.weaknesses && (
                                            <div className="bg-[#fff2f0] rounded p-2.5">
                                              <p className="text-[#ff4d4f] font-medium text-[11px] mb-0.5">待改进</p>
                                              <p className="text-[#000000a6] text-[12px]">{fb.weaknesses}</p>
                                            </div>
                                          )}
                                        </div>
                                        {fb.notes && (
                                          <div className="mt-2 p-2.5 bg-[#fafafa] rounded">
                                            <p className="text-[#00000073] text-[11px] mb-0.5">备注</p>
                                            <p className="text-[#000000a6] text-[12px]">{fb.notes}</p>
                                          </div>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                          <p className="text-[11px] text-[#00000045]">
                                            {fb.interviewerName} · {new Date(fb.createdAt).toLocaleString("zh-CN")}
                                          </p>
                                          {canEditNotes && (
                                            <button
                                              onClick={() => {
                                                setEditingFeedbackId(fb.id);
                                                setFeedbackEditForm({
                                                  notes: fb.notes || "",
                                                  strengths: fb.strengths || "",
                                                  weaknesses: fb.weaknesses || "",
                                                });
                                              }}
                                              className="text-[11px] text-[#1890ff] hover:text-[#40a9ff] font-medium"
                                            >
                                              {canEditResult ? "编辑反馈" : "编辑评语"}
                                            </button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Action buttons */}
                          {isCurrentRound && isHR && (
                            <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex gap-2 flex-wrap">
                              <button
                                disabled={process.status === "COMPLETED" || process.status === "CANCELLED"}
                                onClick={() => openScheduleModal(round.roundNumber)}
                                className="border border-[#d9d9d9] hover:border-[#1890ff] hover:text-[#1890ff] text-[#000000d9] rounded px-3 py-1.5 text-[12px] font-medium transition-colors"
                              >
                                修改安排
                              </button>
                              {interview && !interview.hasFeedback && (
                                <button
                                  onClick={() => {
                                    setFeedbackInterviewId(interview.id);
                                    setShowFeedbackModal(true);
                                  }}
                                  className="bg-[#52c41a] hover:bg-[#73d13d] text-white rounded px-3 py-1.5 text-[12px] font-medium"
                                >
                                  代填写反馈
                                </button>
                              )}
                            </div>
                          )}

                          {isFuture && isHR && (
                            <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
                              <button
                                onClick={() => openScheduleModal(round.roundNumber)}
                                className="border border-[#d9d9d9] hover:border-[#1890ff] hover:text-[#1890ff] text-[#000000d9] rounded px-3 py-1.5 text-[12px] font-medium transition-colors"
                              >
                                {interview ? "修改" : "安排"}面试
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* No interview scheduled */
                        <div>
                          {isCurrentRound && isHR ? (
                            <button
                              onClick={() => openScheduleModal(round.roundNumber)}
                              className="bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded px-4 py-1.5 text-[12px] font-medium"
                            >
                              安排第{round.roundNumber}轮面试
                            </button>
                          ) : (
                            <p className="text-[#00000045] text-[12px] py-1">等待安排</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Modal */}
          {showScheduleModal && schedulingRound && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
                <div className="px-5 py-3.5 border-b border-[#f0f0f0]">
                  <h2 className="text-sm font-semibold text-[#000000d9]">
                    {editingInterviewId ? "修改" : "安排"}第{schedulingRound}轮面试
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[#000000d9] mb-1">开始时间 <span className="text-red-500">*</span></label>
                      <input
                        type="datetime-local"
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full rounded border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#000000d9] mb-1">结束时间 <span className="text-red-500">*</span></label>
                      <input
                        type="datetime-local"
                        value={scheduleForm.endTime}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full rounded border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#000000d9] mb-1">面试形式</label>
                    <select
                      value={scheduleForm.format}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full rounded border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none bg-white"
                    >
                      <option value="ONLINE">线上</option>
                      <option value="OFFLINE">线下</option>
                    </select>
                  </div>

                  {scheduleForm.format === "ONLINE" ? (
                    <>
                      <div>
                        <label className="block text-[12px] font-medium text-[#000000d9] mb-1">会议链接</label>
                        <input
                          type="text"
                          value={scheduleForm.meetingUrl}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingUrl: e.target.value }))}
                          className="w-full rounded border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none"
                          placeholder="腾讯会议/ZOOM 链接"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#000000d9] mb-1">会议号</label>
                        <input
                          type="text"
                          value={scheduleForm.meetingNumber}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingNumber: e.target.value }))}
                          className="w-full rounded border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none"
                          placeholder="会议号"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-[12px] font-medium text-[#000000d9] mb-1">面试地点</label>
                      <input
                        type="text"
                        value={scheduleForm.location}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full rounded border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none"
                        placeholder="具体地址"
                      />
                    </div>
                  )}

                  {/* ✅ 原则 1：移除自动发送，改为 HR 手动发送 */}
                  {/* 已移除"通知候选人"复选框，邮件由 HR 在面试详情页手动编辑发送 */}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setShowScheduleModal(false); setEditingInterviewId(null); }}
                      disabled={isSubmitting}
                      className="flex-1 border border-[#d9d9d9] hover:border-[#1890ff] text-[#000000d9] rounded px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleScheduleInterview}
                      disabled={isSubmitting}
                      className="flex-1 bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded px-4 py-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>提交中...</span>
                        </>
                      ) : (
                        "确认"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Round Config Modal */}
          {showConfigModal && configRound && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
                <div className="px-5 py-3.5 border-b border-[#f0f0f0]">
                  <h2 className="text-sm font-semibold text-[#000000d9]">
                    更换第{configRound}轮面试官
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#000000d9] mb-1">选择面试官</label>
                    <select
                      value={selectedInterviewerId}
                      onChange={(e) => setSelectedInterviewerId(e.target.value)}
                      className="w-full rounded border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none bg-white"
                    >
                      <option value="">请选择</option>
                      {interviewerOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} ({opt.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfigModal(false)}
                      className="flex-1 border border-[#d9d9d9] hover:border-[#1890ff] text-[#000000d9] rounded px-4 py-2 text-[13px] font-medium transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleUpdateRoundConfig}
                      disabled={!selectedInterviewerId}
                      className="flex-1 bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded px-4 py-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      确认更换
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HR 代填写反馈弹窗 */}
          {showFeedbackModal && feedbackInterviewId && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="px-5 py-3.5 border-b border-[#f0f0f0]">
                  <h2 className="text-sm font-semibold text-[#000000d9]">
                    代填写面试反馈
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* 面试结论 */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#000000d9] mb-1">面试结论 <span className="text-red-500">*</span></label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="result"
                          value="PASS"
                          checked={feedbackForm.result === "PASS"}
                          onChange={() => setFeedbackForm({ ...feedbackForm, result: "PASS" })}
                          className="w-4 h-4"
                        />
                        <span className="text-[13px]">通过</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="result"
                          value="FAIL"
                          checked={feedbackForm.result === "FAIL"}
                          onChange={() => setFeedbackForm({ ...feedbackForm, result: "FAIL" })}
                          className="w-4 h-4"
                        />
                        <span className="text-[13px]">不通过</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="result"
                          value="PENDING"
                          checked={feedbackForm.result === "PENDING"}
                          onChange={() => setFeedbackForm({ ...feedbackForm, result: "PENDING" })}
                          className="w-4 h-4"
                        />
                        <span className="text-[13px]">待定</span>
                      </label>
                    </div>
                  </div>

                  {/* 评分 */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#000000d9] mb-1">综合评分 <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFeedbackForm({ ...feedbackForm, overallRating: rating })}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                            feedbackForm.overallRating >= rating
                              ? "bg-[#1890ff] border-[#1890ff] text-white"
                              : "bg-white border-[#d9d9d9] text-[#000000d9] hover:border-[#1890ff]"
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#999] mt-1">1-5分，5分最高</p>
                  </div>

                  {/* 优点 */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#000000d9] mb-1">候选人优点</label>
                    <textarea
                      value={feedbackForm.strengths}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })}
                      placeholder="请输入候选人的优点..."
                      rows={3}
                      className="w-full border border-[#d9d9d9] rounded px-3 py-2 text-[13px] focus:border-[#1890ff] focus:outline-none"
                    />
                  </div>

                  {/* 不足 */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#000000d9] mb-1">待改进之处</label>
                    <textarea
                      value={feedbackForm.weaknesses}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, weaknesses: e.target.value })}
                      placeholder="请输入候选人需要改进的地方..."
                      rows={3}
                      className="w-full border border-[#d9d9d9] rounded px-3 py-2 text-[13px] focus:border-[#1890ff] focus:outline-none"
                    />
                  </div>

                  {/* 备注 */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#000000d9] mb-1">备注</label>
                    <textarea
                      value={feedbackForm.notes}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, notes: e.target.value })}
                      placeholder="其他补充说明..."
                      rows={3}
                      className="w-full border border-[#d9d9d9] rounded px-3 py-2 text-[13px] focus:border-[#1890ff] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="px-5 py-3.5 border-t border-[#f0f0f0] flex gap-2">
                  <button
                    onClick={() => {
                      setShowFeedbackModal(false);
                      setFeedbackInterviewId(null);
                      setFeedbackForm({ result: "PENDING", overallRating: 0, strengths: "", weaknesses: "", notes: "" });
                    }}
                    className="flex-1 border border-[#d9d9d9] hover:border-[#1890ff] text-[#000000d9] rounded px-4 py-2 text-[13px] font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmittingFeedback}
                    className="flex-1 bg-[#52c41a] hover:bg-[#73d13d] text-white rounded px-4 py-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    提交反馈
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </MainLayout>
  );
}
