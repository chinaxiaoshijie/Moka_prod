"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

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
      const response = await fetch(`http://localhost:3001/interview-processes/${processId}`, {
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
        ? `http://localhost:3001/interviews/${editingInterviewId}`
        : `http://localhost:3001/interview-processes/${processId}/rounds/${schedulingRound}/interview`;
      
      const response = await fetch(url, {
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
      const response = await fetch(
        `http://localhost:3001/interview-processes/${processId}/complete-round`,
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
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </main>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="text-center py-20">
            <p className="text-slate-500">流程不存在</p>
          </div>
        </main>
      </div>
    );
  }

  const currentInterview = process.interviews.find(i => i.roundNumber === process.currentRound);
  const isWaitingHR = process.status === "WAITING_HR";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">面试流程详情</h1>
                <p className="text-slate-500">{process.candidateName} · {process.positionTitle}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(process.status)}`}>
                {getStatusText(process.status)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">
              ⚠️ {error}
            </div>
          )}

          {user?.role === "HR" && isWaitingHR && currentInterview && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                第{process.currentRound}轮面试已完成，请确认
              </h3>
              <div className="flex gap-3">
                {process.currentRound < process.totalRounds ? (
                  <>
                    <button
                      onClick={() => handleCompleteRound("next")}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium"
                    >
                      通过，安排下一轮
                    </button>
                    <button
                      onClick={() => handleCompleteRound("reject")}
                      className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200"
                    >
                      不通过，结束流程
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleCompleteRound("complete")}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium"
                    >
                      通过，录用候选人
                    </button>
                    <button
                      onClick={() => handleCompleteRound("reject")}
                      className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200"
                    >
                      不通过，结束流程
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 候选人信息卡片 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">候选人信息</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">姓名：</span>
                <span className="text-slate-900 font-medium">{process.candidateName}</span>
              </div>
              {process.candidatePhone && (
                <div>
                  <span className="text-slate-500">电话：</span>
                  <span className="text-slate-900">{process.candidatePhone}</span>
                </div>
              )}
              {process.candidateEmail && (
                <div>
                  <span className="text-slate-500">邮箱：</span>
                  <span className="text-slate-900">{process.candidateEmail}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">应聘职位：</span>
                <span className="text-slate-900">{process.positionTitle}</span>
              </div>
              <div>
                <span className="text-slate-500">流程状态：</span>
                <span className={`font-medium ${getStatusColor(process.status)}`}>
                  {getStatusText(process.status)}
                </span>
              </div>
            </div>
          </div>

          {/* 面试流程时间线 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">面试流程时间线</h2>
            
            <div className="space-y-6">
              {process.rounds.map((round, index) => {
                const status = getRoundStatus(round.roundNumber);
                const interview = process.interviews.find(i => i.roundNumber === round.roundNumber);
                const isCurrentRound = process.currentRound === round.roundNumber;
                const isPast = round.roundNumber < process.currentRound;
                const isFuture = round.roundNumber > process.currentRound;
                
                return (
                  <div key={round.roundNumber} className="relative flex gap-4">
                    {/* Timeline line */}
                    {index < process.rounds.length - 1 && (
                      <div className={`absolute left-4 top-10 bottom-0 w-0.5 ${
                        status === "completed" ? "bg-emerald-300" : "bg-slate-200"
                      }`} />
                    )}
                    
                    {/* Status indicator */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                      status === "completed" ? "bg-emerald-500 text-white" :
                      status === "scheduled" ? "bg-amber-500 text-white" :
                      isCurrentRound ? "bg-blue-500 text-white" :
                      "bg-slate-200 text-slate-500"
                    }`}>
                      {status === "completed" ? "✓" : round.roundNumber}
                    </div>
                    
                    {/* Round details */}
                    <div className="flex-1 pb-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">
                            第{round.roundNumber}轮 · {round.isHRRound ? "HR初面" : round.roundType === "TECHNICAL" ? "技术面试" : "终面"}
                          </h3>
                          <p className="text-sm text-slate-500">
                            面试官：{round.interviewerName}
                            {round.interviewerEmail && <span className="ml-2">({round.interviewerEmail})</span>}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                          {/* Time and format */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">📅</span>
                              <span className="text-slate-900">
                                {new Date(interview.startTime).toLocaleString("zh-CN")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">{interview.format === "ONLINE" ? "💻" : "🏢"}</span>
                              <span className="text-slate-900">
                                {interview.format === "ONLINE" ? "线上面试" : "线下面试"}
                                {interview.location && ` · ${interview.location}`}
                              </span>
                            </div>
                            {interview.meetingUrl && (
                              <div className="col-span-2">
                                <span className="text-slate-500">会议链接：</span>
                                <a href={interview.meetingUrl} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 hover:underline ml-2">
                                  {interview.meetingUrl}
                                </a>
                              </div>
                            )}
                          </div>
                          
                          {/* Feedback section */}
                          {interview.feedbacks && interview.feedbacks.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-slate-900">面试反馈</h4>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  interview.feedbackResult === "PASS" ? "bg-emerald-100 text-emerald-700" :
                                  interview.feedbackResult === "FAIL" ? "bg-red-100 text-red-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {interview.feedbackResult === "PASS" ? "✅ 通过" :
                                   interview.feedbackResult === "FAIL" ? "❌ 不通过" : "⏳ 待定"}
                                </span>
                              </div>
                              
                              {/* Rating stars */}
                              {interview.feedbacks && interview.feedbacks[0]?.overallRating && (
                                <div className="flex items-center gap-1 mb-3">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={`text-lg ${
                                      star <= (interview.feedbacks?.[0]?.overallRating ?? 0) ? "text-amber-400" : "text-slate-200"
                                    }`}>★</span>
                                  ))}
                                  <span className="ml-2 text-sm text-slate-600">
                                    {interview.feedbacks[0].overallRating}分
                                  </span>
                                </div>
                              )}
                              
                              {/* Feedback details */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {interview.feedbacks[0].strengths && (
                                  <div className="bg-emerald-50 rounded-lg p-3">
                                    <p className="text-emerald-700 font-medium mb-1">✅ 优势</p>
                                    <p className="text-slate-700">{interview.feedbacks[0].strengths}</p>
                                  </div>
                                )}
                                {interview.feedbacks[0].weaknesses && (
                                  <div className="bg-red-50 rounded-lg p-3">
                                    <p className="text-red-700 font-medium mb-1">⚠️ 待改进</p>
                                    <p className="text-slate-700">{interview.feedbacks[0].weaknesses}</p>
                                  </div>
                                )}
                              </div>
                              
                              {interview.feedbacks[0].notes && (
                                <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                                  <p className="text-slate-500 text-xs mb-1">备注</p>
                                  <p className="text-slate-700">{interview.feedbacks[0].notes}</p>
                                </div>
                              )}
                              
                              <p className="text-xs text-slate-400 mt-3">
                                反馈人：{interview.feedbacks[0].interviewer?.name || round.interviewerName} · 
                                {new Date(interview.feedbacks[0].createdAt).toLocaleString("zh-CN")}
                              </p>
                            </div>
                          )}
                          
                          {/* Action buttons for HR */}
                          {isCurrentRound && user?.role === "HR" && (
                            <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                              <button
                                onClick={() => openScheduleModal(round.roundNumber)}
                                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200"
                              >
                                📝 修改安排
                              </button>
                              <button
                                onClick={() => router.push(`/interviews/${interview.id}`)}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                              >
                                👁️ 查看详情
                              </button>
                            </div>
                          )}
                          
                          {/* Future rounds can be edited */}
                          {isFuture && user?.role === "HR" && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <button
                                onClick={() => openScheduleModal(round.roundNumber)}
                                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200"
                              >
                                📅 {interview ? "修改" : "安排"}面试
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
                              className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                            >
                              ➕ 安排第{round.roundNumber}轮面试
                            </button>
                          ) : (
                            <p className="text-slate-400 py-2">⏳ 等待安排</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {showScheduleModal && schedulingRound && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">{editingInterviewId ? "修改" : "安排"}第{schedulingRound}轮面试</h2>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">开始时间</label>
                      <input
                        type="datetime-local"
                        value={scheduleForm.startTime}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">结束时间</label>
                      <input
                        type="datetime-local"
                        value={scheduleForm.endTime}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">面试形式</label>
                    <select
                      value={scheduleForm.format}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <option value="ONLINE">线上</option>
                      <option value="OFFLINE">线下</option>
                    </select>
                  </div>

                  {scheduleForm.format === "ONLINE" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">会议链接</label>
                        <input
                          type="text"
                          value={scheduleForm.meetingUrl}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingUrl: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="腾讯会议链接"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">会议号</label>
                        <input
                          type="text"
                          value={scheduleForm.meetingNumber}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingNumber: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3"
                          placeholder="会议号"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">面试地点</label>
                      <input
                        type="text"
                        value={scheduleForm.location}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3"
                        placeholder="具体地址"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleScheduleInterview}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl"
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
