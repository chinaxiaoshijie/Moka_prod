"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Process {
  id: string;
  candidateName: string;
  positionTitle: string;
  currentRound: number;
  totalRounds: number;
  status: string;
  hasHRRound: boolean;
  rounds: {
    roundNumber: number;
    interviewerId: string;
    interviewerName: string;
    isHRRound: boolean;
    roundType: string;
  }[];
  interviews: {
    id: string;
    roundNumber: number;
    interviewerName: string;
    type: string;
    format: string;
    startTime: string;
    status: string;
    hasFeedback: boolean;
    feedbackResult?: string;
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
      const response = await fetch(
        `http://localhost:3001/interview-processes/${processId}/rounds/${schedulingRound}/interview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(scheduleForm),
        }
      );

      if (!response.ok) throw new Error("安排面试失败");
      
      setShowScheduleModal(false);
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
    setScheduleForm({
      startTime: "",
      endTime: "",
      format: "ONLINE",
      location: "",
      meetingUrl: "",
      meetingNumber: "",
    });
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">面试进度</h2>
            
            <div className="space-y-6">
              {process.rounds.map((round, index) => {
                const status = getRoundStatus(round.roundNumber);
                const interview = process.interviews.find(i => i.roundNumber === round.roundNumber);
                const isCurrentRound = process.currentRound === round.roundNumber;
                
                return (
                  <div key={round.roundNumber} className="relative flex gap-4">
                    {index < process.rounds.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-200" />
                    )}
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold z-10 ${
                      status === "completed" ? "bg-emerald-500 text-white" :
                      status === "scheduled" ? "bg-amber-500 text-white" :
                      isCurrentRound ? "bg-blue-500 text-white" :
                      "bg-slate-200 text-slate-500"
                    }`}>
                      {status === "completed" ? "✓" : round.roundNumber}
                    </div>
                    
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">
                          第{round.roundNumber}轮：
                          {round.isHRRound ? "HR初面" : round.roundType === "TECHNICAL" ? "技术面试" : "终面"}
                        </h3>
                        <span className="text-sm text-slate-500">面试官：{round.interviewerName}</span>
                      </div>
                      
                      {interview ? (
                        <div className="bg-slate-50 rounded-xl p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">时间：</span>
                              <span className="text-slate-900">
                                {new Date(interview.startTime).toLocaleString("zh-CN")}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">形式：</span>
                              <span className="text-slate-900">
                                {interview.format === "ONLINE" ? "线上" : "线下"}
                              </span>
                            </div>
                          </div>
                          
                          {interview.hasFeedback && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <span className="text-slate-500">面试结果：</span>
                              <span className={`font-medium ${
                                interview.feedbackResult === "PASS" ? "text-emerald-600" :
                                interview.feedbackResult === "FAIL" ? "text-red-600" :
                                "text-amber-600"
                              }`}>
                                {interview.feedbackResult === "PASS" ? "通过" :
                                 interview.feedbackResult === "FAIL" ? "不通过" : "待定"}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : isCurrentRound && user?.role === "HR" ? (
                        <button
                          onClick={() => openScheduleModal(round.roundNumber)}
                          className="mt-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200"
                        >
                          {interview ? "修改面试" : "安排面试"}
                        </button>
                      ) : (
                        <p className="text-sm text-slate-400">待安排</p>
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
