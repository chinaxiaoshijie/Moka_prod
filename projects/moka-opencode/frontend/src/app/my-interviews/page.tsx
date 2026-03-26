"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";

interface Interview {
  id: string;
  candidateId: string;
  candidate: { name: string; phone: string };
  position: { title: string };
  interviewer: { name: string };
  type: string;
  format: string;
  startTime: string;
  endTime: string;
  status: string;
  location: string | null;
  meetingUrl: string | null;
  processId: string | null;
  roundNumber: number | null;
  process: {
    id: string;
    status: string;
    totalRounds: number;
    currentRound: number;
  } | null;
}

interface CandidateGroup {
  candidateId: string;
  candidateName: string;
  positionTitle: string;
  processId: string | null;
  processStatus: string | null;
  interviews: Interview[];
}

const typeMap: Record<string, string> = {
  INTERVIEW_1: "初试",
  INTERVIEW_2: "复试",
  INTERVIEW_3: "终试",
};

function getTypeText(type: string): string {
  return typeMap[type] || type;
}

function getTypeStatusText(type: string, status: string): string {
  const typeName = typeMap[type] || type;
  if (status === "COMPLETED") return `${typeName}完成`;
  if (status === "CANCELLED") return `${typeName}取消`;
  if (status === "SCHEDULED") return `${typeName}待面试`;
  return `${typeName}${status}`;
}

function getStepColor(status: string): string {
  if (status === "COMPLETED") return "bg-emerald-500 text-white border-emerald-500";
  if (status === "CANCELLED") return "bg-red-100 text-red-600 border-red-300";
  if (status === "SCHEDULED") return "bg-blue-500 text-white border-blue-500";
  return "bg-slate-100 text-slate-400 border-slate-200";
}

function getStepLineColor(status: string): string {
  if (status === "COMPLETED") return "bg-emerald-400";
  if (status === "SCHEDULED") return "bg-blue-300";
  return "bg-slate-200";
}

function getProcessStatusBadge(group: CandidateGroup): { text: string; color: string } {
  if (!group.processId) {
    const iv = group.interviews[0];
    return {
      text: getTypeStatusText(iv.type, iv.status),
      color: iv.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
             iv.status === "CANCELLED" ? "bg-red-100 text-red-700 border-red-200" :
             "bg-[#EFF3FF] text-[#4371FF] border-[#4371FF]/30",
    };
  }
  const ps = group.processStatus;
  if (ps === "COMPLETED") return { text: "流程完成", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (ps === "CANCELLED") return { text: "流程取消", color: "bg-red-100 text-red-700 border-red-200" };
  if (ps === "WAITING_HR") return { text: "待HR确认", color: "bg-amber-100 text-amber-700 border-amber-200" };
  return { text: "进行中", color: "bg-[#EFF3FF] text-[#4371FF] border-[#4371FF]/30" };
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFormatText(format: string): string {
  const formatMap: Record<string, string> = { ONLINE: "线上", OFFLINE: "线下" };
  return formatMap[format] || format;
}

function groupInterviews(interviews: Interview[]): CandidateGroup[] {
  const groupMap = new Map<string, CandidateGroup>();

  for (const iv of interviews) {
    const key = iv.processId || `standalone-${iv.id}`;
    const existing = groupMap.get(key);
    if (existing) {
      existing.interviews.push(iv);
    } else {
      groupMap.set(key, {
        candidateId: iv.candidateId,
        candidateName: iv.candidate.name,
        positionTitle: iv.position.title,
        processId: iv.processId,
        processStatus: iv.process?.status || null,
        interviews: [iv],
      });
    }
  }

  for (const group of groupMap.values()) {
    group.interviews.sort((a, b) => {
      if (a.roundNumber !== null && b.roundNumber !== null) {
        return a.roundNumber - b.roundNumber;
      }
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }

  const groups = Array.from(groupMap.values());
  groups.sort((a, b) => {
    const aActive = a.processStatus !== "COMPLETED" && a.processStatus !== "CANCELLED";
    const bActive = b.processStatus !== "COMPLETED" && b.processStatus !== "CANCELLED";
    if (aActive !== bActive) return aActive ? -1 : 1;
    const aTime = new Date(a.interviews[a.interviews.length - 1].startTime).getTime();
    const bTime = new Date(b.interviews[b.interviews.length - 1].startTime).getTime();
    return bTime - aTime;
  });

  return groups;
}

export default function MyInterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/interviews?pageSize=200", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取面试列表失败");
      }

      const data = await response.json();
      setInterviews(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scheduledCount = interviews.filter((i) => i.status === "SCHEDULED").length;
  const completedCount = interviews.filter((i) => i.status === "COMPLETED").length;
  const groups = groupInterviews(interviews);

  return (
    <MainLayout>
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">我的面试</h1>
            <p className="text-slate-500 mt-1">查看待面试和已完成的面试</p>
          </div>

          <div className="grid grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#EFF3FF] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#4371FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">待面试</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{scheduledCount}</p>
              <p className="text-sm text-slate-500 mt-1">场待进行</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">已完成</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{completedCount}</p>
              <p className="text-sm text-slate-500 mt-1">场已完成</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">总计</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{interviews.length}</p>
              <p className="text-sm text-slate-500 mt-1">场面试</p>
            </div>
          </div>

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
          ) : (
            <div className="space-y-4">
              {groups.map((group) => {
                const badge = getProcessStatusBadge(group);
                return (
                  <div
                    key={group.processId || group.interviews[0].id}
                    className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-slate-900">
                          {group.candidateName}
                        </h3>
                        <span className="text-slate-300">·</span>
                        <span className="text-sm text-slate-600">
                          {group.positionTitle}
                        </span>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      {group.processId && (
                        <button
                          onClick={() => router.push(`/interview-processes/${group.processId}`)}
                          className="text-sm text-[#4371FF] hover:text-[#3461E6] font-medium"
                        >
                          查看流程
                        </button>
                      )}
                    </div>

                    {/* Timeline Steps */}
                    <div className="flex items-start gap-0 mb-4">
                      {group.interviews.map((iv, idx) => (
                        <div key={iv.id} className="flex items-start">
                          <div
                            className="flex flex-col items-center cursor-pointer group"
                            onClick={() => router.push(`/interviews/${iv.id}`)}
                          >
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getStepColor(iv.status)}`}>
                              {iv.roundNumber || idx + 1}
                            </div>
                            <div className="mt-2 text-center min-w-[80px]">
                              <p className="text-xs font-medium text-[#1A1A1A] group-hover:text-[#4371FF] transition-colors">
                                {getTypeStatusText(iv.type, iv.status)}
                              </p>
                              <p className="text-[11px] text-[#999] mt-0.5">
                                {iv.interviewer.name}
                              </p>
                              <p className="text-[11px] text-[#999]">
                                {formatDateTime(iv.startTime)}
                              </p>
                            </div>
                          </div>

                          {idx < group.interviews.length - 1 && (
                            <div className="flex items-center pt-3.5 px-1">
                              <div className={`w-8 h-0.5 ${getStepLineColor(iv.status)}`} />
                              <svg className="w-2.5 h-2.5 text-slate-300 -ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 4l8 8-8 8" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Future rounds placeholder */}
                      {group.processId && group.interviews[0]?.process && (() => {
                        const total = group.interviews[0].process!.totalRounds;
                        const existing = group.interviews.length;
                        const remaining = total - existing;
                        if (remaining <= 0) return null;
                        return Array.from({ length: remaining }, (_, i) => {
                          const roundNum = existing + i + 1;
                          const roundType = roundNum === 1 ? "INTERVIEW_1" : roundNum === 2 ? "INTERVIEW_2" : "INTERVIEW_3";
                          return (
                            <div key={`future-${roundNum}`} className="flex items-start">
                              <div className="flex items-center pt-3.5 px-1">
                                <div className="w-8 h-0.5 bg-slate-200" />
                                <svg className="w-2.5 h-2.5 text-slate-300 -ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 4l8 8-8 8" />
                                </svg>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-xs font-bold text-slate-400">
                                  {roundNum}
                                </div>
                                <div className="mt-2 text-center min-w-[80px]">
                                  <p className="text-xs font-medium text-slate-400">
                                    {getTypeText(roundType)}待安排
                                  </p>
                                  <p className="text-[11px] text-[#ccc] mt-0.5">未安排</p>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Action buttons for the latest interview */}
                    {(() => {
                      const latestIv = group.interviews[group.interviews.length - 1];
                      return (
                        <div className="flex gap-2 pt-3 border-t border-[#E8EBF0]">
                          <div className="flex-1 text-sm text-slate-500">
                            {getTypeText(latestIv.type)} · {getFormatText(latestIv.format)}
                            {latestIv.location && ` · ${latestIv.location}`}
                          </div>
                          {latestIv.status === "SCHEDULED" && (
                            <button
                              onClick={() => router.push(`/feedback?interviewId=${latestIv.id}`)}
                              className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2 text-sm font-medium shadow-sm"
                            >
                              开始面试
                            </button>
                          )}
                          {latestIv.status === "COMPLETED" && (
                            <button
                              onClick={() => router.push(`/feedback?interviewId=${latestIv.id}`)}
                              className="border border-[#E8EBF0] hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2 text-sm font-medium"
                            >
                              查看反馈
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}

              {groups.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-slate-900 mb-1">
                    暂无面试安排
                  </h3>
                  <p className="text-sm text-slate-500">HR安排面试后将显示在这里</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </MainLayout>
  );
}
