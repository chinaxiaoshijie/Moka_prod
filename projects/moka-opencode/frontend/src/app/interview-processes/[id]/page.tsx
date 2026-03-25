"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

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

interface Process {
  id: string;
  candidateName: string;
  candidatePhone?: string;
  candidateEmail?: string;
  positionTitle: string;
  currentRound: number;
  totalRounds: number;
  status: string;
  hasHRRound: boolean;
  rounds: {
    roundNumber: number;
    interviewerId: string;
    interviewerName: string;
    interviewerEmail?: string;
    isHRRound: boolean;
    roundType: string;
  }[];
  interviews: {
    id: string;
    roundNumber: number;
    interviewerId: string;
    interviewerName: string;
    type: string;
    format: string;
    startTime: string;
    endTime?: string;
    status: string;
    location?: string;
    meetingUrl?: string;
    meetingNumber?: string;
    hasFeedback: boolean;
    feedbackResult?: string;
    feedbacks?: Feedback[];
  }[];
  createdAt: string;
}

export default function InterviewProcessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const processId = params.id as string;

  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingRound, setSchedulingRound] = useState<number | null>(null);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    startTime: "",
    endTime: "",
    format: "ONLINE" as "ONLINE" | "OFFLINE",
    location: "",
    meetingUrl: "",
    meetingNumber: "",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchProcess();
  }, [processId]);

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

    try {
      const token = localStorage.getItem("token");

      // Use PUT for editing, POST for creating
      const isEditing = editingInterviewId !== null;
      const url = isEditing
        ? `/interviews/${editingInterviewId}`
        : `/interview-processes/${processId}/rounds/${schedulingRound}/interview`;

      const response = await apiFetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(scheduleForm),
      });

      if (!response.ok) throw new Error(isEditing ? "更新面试安排失败" : "安排面试失败");

      setShowScheduleModal(false);
      setEditingInterviewId(null);
      fetchProcess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCompleteRound = async (action: "next" | "complete" | "reject") => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interview-processes/${processId}/complete-round`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) throw new Error("操作失败");
      fetchProcess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openScheduleModal = (roundNumber: number) => {
    setSchedulingRound(roundNumber);

    // Check if there's an existing interview for this round
    const existingInterview = process?.interviews.find(i => i.roundNumber === roundNumber);

    if (existingInterview) {
      // Edit existing interview - pre-fill form with existing data
      setEditingInterviewId(existingInterview.id);
      setScheduleForm({
        startTime: existingInterview.startTime ? new Date(existingInterview.startTime).toISOString().slice(0, 16) : "",
        endTime: existingInterview.startTime ? new Date(new Date(existingInterview.startTime).getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : "",
        format: (existingInterview.format as "ONLINE" | "OFFLINE") || "ONLINE",
        location: existingInterview.location || "",
        meetingUrl: existingInterview.meetingUrl || "",
        meetingNumber: existingInterview.meetingNumber || "",
      });
    } else {
      // New interview - reset form
      setEditingInterviewId(null);
      setScheduleForm({
        startTime: "",
        endTime: "",
        format: "ONLINE",
        location: "",
        meetingUrl: "",
        meetingNumber: "",
      });
    }
    setShowScheduleModal(true);
  };

  const getRoundStatus = (roundNumber: number) => {
    if (!process) return "pending";
    const interview = process.interviews.find(i => i.roundNumber === roundNumber);
    if (!interview) return "pending";
    if (interview.status === "COMPLETED") return "completed";
    if (interview.status === "SCHEDULED") return "scheduled";
    return "pending";
  };

  const getStatusText = (status: string) => {
    const map: { [key: string]: string } = {
      IN_PROGRESS: "进行中",
      WAITING_HR: "等待HR确认",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: { [key: string]: string } = {
      IN_PROGRESS: "bg-amber-100 text-amber-700",
      WAITING_HR: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-emerald-100 text-emerald-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-60 p-6 lg:p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-amber-600" />
        </main>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-60 p-6 lg:p-8">
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">流程不存在</p>
          </div>
        </main>
      </div>
    );
  }

  const currentInterview = process.interviews.find(i => i.roundNumber === process.currentRound);
  const isWaitingHR = process.status === "WAITING_HR";

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-60 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">面试流程详情</h1>
                <p className="text-slate-500 text-sm">{process.candidateName} · {process.positionTitle}</p>
              </div>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}>
                {getStatusText(process.status)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* HR Action Panel */}
          {user?.role === "HR" && isWaitingHR && currentInterview && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-5">
              <h3 className="text-base font-semibold text-slate-900 mb-4">
                第{process.currentRound}轮面试已完成，请确认
              </h3>
              <div className="flex gap-3">
                {process.currentRound < process.totalRounds ? (
                  <>
                    <button
                      onClick={() => handleCompleteRound("next")}
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
                    >
                      通过，安排下一轮
                    </button>
                    <button
                      onClick={() => handleCompleteRound("reject")}
                      className="bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-4 py-2.5 text-sm font-medium"
                    >
                      不通过，结束流程
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleCompleteRound("complete")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
                    >
                      通过，录用候选人
                    </button>
                    <button
                      onClick={() => handleCompleteRound("reject")}
                      className="bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-4 py-2.5 text-sm font-medium"
                    >
                      不通过，结束流程
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Candidate Info Card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">候选人信息</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500 text-xs">姓名</span>
                <p className="text-slate-900 font-medium mt-0.5">{process.candidateName}</p>
              </div>
              {process.candidatePhone && (
                <div>
                  <span className="text-slate-500 text-xs">电话</span>
                  <p className="text-slate-900 mt-0.5">{process.candidatePhone}</p>
                </div>
              )}
              {process.candidateEmail && (
                <div>
                  <span className="text-slate-500 text-xs">邮箱</span>
                  <p className="text-slate-900 mt-0.5">{process.candidateEmail}</p>
                </div>
              )}
              <div>
                <span className="text-slate-500 text-xs">应聘职位</span>
                <p className="text-slate-900 mt-0.5">{process.positionTitle}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">流程状态</span>
                <p className="mt-0.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}>
                    {getStatusText(process.status)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Interview Process Timeline */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-6">面试流程时间线</h2>

            <div className="space-y-6">
              {process.rounds.map((round, index) => {
                const status = getRoundStatus(round.roundNumber);
                const interview = process.interviews.find(i => i.roundNumber === round.roundNumber);
                const isCurrentRound = process.currentRound === round.roundNumber;
                const isPast = round.roundNumber < process.currentRound;
                const isFuture = round.roundNumber > process.currentRound;

                return (
                  <div key={round.roundNumber} className="relative flex gap-4">
                    {/* Timeline connector line */}
                    {index < process.rounds.length - 1 && (
                      <div className={`absolute left-4 top-10 bottom-0 w-0.5 ${
                        status === "completed" ? "bg-emerald-200" : "bg-slate-200"
                      }`} />
                    )}

                    {/* Status indicator */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold z-10 flex-shrink-0 ${
                      status === "completed" ? "bg-emerald-500 text-white" :
                      status === "scheduled" ? "bg-amber-500 text-white" :
                      isCurrentRound ? "bg-blue-500 text-white" :
                      "bg-slate-200 text-slate-500"
                    }`}>
                      {status === "completed" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : round.roundNumber}
                    </div>

                    {/* Round details */}
                    <div className="flex-1 pb-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">
                            第{round.roundNumber}轮 · {round.isHRRound ? "HR初面" : round.roundType === "TECHNICAL" ? "技术面试" : "终面"}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            面试官：{round.interviewerName}
                            {round.interviewerEmail && <span className="ml-1.5">({round.interviewerEmail})</span>}
                          </p>
                        </div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === "completed" ? "bg-emerald-100 text-emerald-700" :
                          status === "scheduled" ? "bg-amber-100 text-amber-700" :
                          isCurrentRound ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {status === "completed" ? "已完成" :
                           status === "scheduled" ? "已安排" :
                           isCurrentRound ? "进行中" : "待安排"}
                        </span>
                      </div>

                      {/* Interview details */}
                      {interview ? (
                        <div className="bg-slate-50/80 rounded-lg border border-slate-100 p-4 space-y-3">
                          {/* Time and format */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-700">
                              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs">
                                {new Date(interview.startTime).toLocaleString("zh-CN")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700">
                              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {interview.format === "ONLINE" ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                )}
                              </svg>
                              <span className="text-xs">
                                {interview.format === "ONLINE" ? "线上面试" : "线下面试"}
                                {interview.location && ` · ${interview.location}`}
                              </span>
                            </div>
                            {interview.meetingUrl && (
                              <div className="col-span-2 text-xs">
                                <span className="text-slate-500">会议链接：</span>
                                <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer"
                                   className="text-blue-600 hover:underline ml-1">
                                  {interview.meetingUrl}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Feedback section */}
                          {interview.feedbacks && interview.feedbacks.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-slate-900 text-sm">面试反馈</h4>
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  interview.feedbackResult === "PASS" ? "bg-emerald-100 text-emerald-700" :
                                  interview.feedbackResult === "FAIL" ? "bg-red-100 text-red-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {interview.feedbackResult === "PASS" ? "通过" :
                                   interview.feedbackResult === "FAIL" ? "不通过" : "待定"}
                                </span>
                              </div>

                              {/* Rating stars */}
                              {interview.feedbacks && interview.feedbacks[0]?.overallRating && (
                                <div className="flex items-center gap-0.5 mb-3">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={`text-base ${
                                      star <= (interview.feedbacks?.[0]?.overallRating ?? 0) ? "text-amber-400" : "text-slate-200"
                                    }`}>★</span>
                                  ))}
                                  <span className="ml-2 text-xs text-slate-500">
                                    {interview.feedbacks[0].overallRating}分
                                  </span>
                                </div>
                              )}

                              {/* Feedback details */}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {interview.feedbacks[0].strengths && (
                                  <div className="bg-emerald-50 rounded-lg p-3">
                                    <p className="text-emerald-700 font-medium text-xs mb-1">优势</p>
                                    <p className="text-slate-700 text-xs">{interview.feedbacks[0].strengths}</p>
                                  </div>
                                )}
                                {interview.feedbacks[0].weaknesses && (
                                  <div className="bg-red-50 rounded-lg p-3">
                                    <p className="text-red-700 font-medium text-xs mb-1">待改进</p>
                                    <p className="text-slate-700 text-xs">{interview.feedbacks[0].weaknesses}</p>
                                  </div>
                                )}
                              </div>

                              {interview.feedbacks[0].notes && (
                                <div className="mt-2 p-3 bg-slate-100 rounded-lg">
                                  <p className="text-slate-500 text-xs mb-1">备注</p>
                                  <p className="text-slate-700 text-xs">{interview.feedbacks[0].notes}</p>
                                </div>
                              )}

                              <p className="text-xs text-slate-400 mt-2">
                                反馈人：{interview.feedbacks[0].interviewer?.name || round.interviewerName} ·{" "}
                                {new Date(interview.feedbacks[0].createdAt).toLocaleString("zh-CN")}
                              </p>
                            </div>
                          )}

                          {/* Action buttons for HR on current round */}
                          {isCurrentRound && user?.role === "HR" && (
                            <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                              <button
                                onClick={() => openScheduleModal(round.roundNumber)}
                                className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium"
                              >
                                修改安排
                              </button>
                              <button
                                onClick={() => router.push(`/interviews/${interview.id}`)}
                                className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium"
                              >
                                查看详情
                              </button>
                            </div>
                          )}

                          {/* Future rounds can be edited */}
                          {isFuture && user?.role === "HR" && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <button
                                onClick={() => openScheduleModal(round.roundNumber)}
                                className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium"
                              >
                                {interview ? "修改" : "安排"}面试
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* No interview scheduled */
                        <div className="text-sm">
                          {isCurrentRound && user?.role === "HR" ? (
                            <button
                              onClick={() => openScheduleModal(round.roundNumber)}
                              className="mt-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2 text-xs font-medium shadow-sm"
                            >
                              安排第{round.roundNumber}轮面试
                            </button>
                          ) : (
                            <p className="text-slate-400 text-xs py-2">等待安排</p>
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editingInterviewId ? "修改" : "安排"}第{schedulingRound}轮面试
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">开始时间</label>
                      <input
                        type="datetime-local"
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">结束时间</label>
                      <input
                        type="datetime-local"
                        value={scheduleForm.endTime}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">面试形式</label>
                    <select
                      value={scheduleForm.format}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                    >
                      <option value="ONLINE">线上</option>
                      <option value="OFFLINE">线下</option>
                    </select>
                  </div>

                  {scheduleForm.format === "ONLINE" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">会议链接</label>
                        <input
                          type="text"
                          value={scheduleForm.meetingUrl}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingUrl: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                          placeholder="腾讯会议链接"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">会议号</label>
                        <input
                          type="text"
                          value={scheduleForm.meetingNumber}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingNumber: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                          placeholder="会议号"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">面试地点</label>
                      <input
                        type="text"
                        value={scheduleForm.location}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                        placeholder="具体地址"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleScheduleInterview}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
                    >
                      确认安排
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
