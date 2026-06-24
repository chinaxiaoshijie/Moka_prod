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

const statusMap: Record<string, string> = {
  SCHEDULED: "待面试",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

function getTypeText(type: string): string {
  return typeMap[type] || type;
}

function getTypeStatusText(type: string, status: string): string {
  const typeName = typeMap[type] || type;
  if (status === "COMPLETED") return `${typeName}完成`;
  if (status === "CANCELLED") return `${typeName}取消`;
  if (status === "SCHEDULED") return `${typeName}待面试`;
  return `${typeName}${statusMap[status] || status}`;
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
    // standalone interview
    const iv = group.interviews[0];
    return {
      text: getTypeStatusText(iv.type, iv.status),
      color: iv.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
             iv.status === "CANCELLED" ? "bg-red-50 text-red-600" :
             "bg-blue-50 text-blue-700",
    };
  }
  const ps = group.processStatus;
  if (ps === "COMPLETED") return { text: "流程完成", color: "bg-emerald-50 text-emerald-700" };
  if (ps === "CANCELLED") return { text: "流程取消", color: "bg-red-50 text-red-600" };
  if (ps === "WAITING_HR") return { text: "待HR确认", color: "bg-amber-50 text-amber-700" };
  return { text: "进行中", color: "bg-blue-50 text-blue-700" };
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupInterviews(interviews: Interview[]): CandidateGroup[] {
  const groupMap = new Map<string, CandidateGroup>();

  for (const iv of interviews) {
    // Group key: processId if exists, otherwise candidateId+positionTitle
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

  // Sort interviews within each group by roundNumber then startTime
  for (const group of groupMap.values()) {
    group.interviews.sort((a, b) => {
      if (a.roundNumber !== null && b.roundNumber !== null) {
        return a.roundNumber - b.roundNumber;
      }
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }

  // Sort groups: active first, then by latest interview time
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

export default function InterviewsPage() {
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

  const groups = groupInterviews(interviews);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
              面试安排
            </h1>
            <p className="text-sm text-[#666] mt-0.5">查看和管理面试日程</p>
          </div>
          <button
            onClick={() => router.push("/interviews/new")}
            className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            安排面试
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#E8EBF0] border-t-[#4371FF]" />
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const badge = getProcessStatusBadge(group);
              return (
                <div
                  key={group.processId || group.interviews[0].id}
                  className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 p-5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-[#1A1A1A]">
                        {group.candidateName}
                      </h3>
                      <span className="text-slate-300">|</span>
                      <span className="text-sm text-[#666]">
                        {group.positionTitle}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
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

                  {/* Interview Steps Timeline */}
                  <div className="flex items-start gap-0">
                    {group.interviews.map((iv, idx) => (
                      <div key={iv.id} className="flex items-start">
                        {/* Step */}
                        <div
                          className="flex flex-col items-center cursor-pointer group"
                          onClick={() => router.push(`/interviews/${iv.id}`)}
                        >
                          {/* Circle with round number */}
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getStepColor(iv.status)}`}>
                            {iv.roundNumber || idx + 1}
                          </div>
                          {/* Labels */}
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

                        {/* Connecting line */}
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

                    {/* Future rounds placeholder (from process config) */}
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
                            {/* Connecting line from last existing */}
                            <div className="flex items-center pt-3.5 px-1">
                              <div className="w-8 h-0.5 bg-slate-200" />
                              <svg className="w-2.5 h-2.5 text-slate-300 -ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 4l8 8-8 8" />
                              </svg>
                            </div>
                            {/* Future step */}
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-xs font-bold text-slate-400">
                                {roundNum}
                              </div>
                              <div className="mt-2 text-center min-w-[80px]">
                                <p className="text-xs font-medium text-slate-400">
                                  {getTypeText(roundType)}待安排
                                </p>
                                <p className="text-[11px] text-[#ccc] mt-0.5">
                                  未安排
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })}

            {groups.length === 0 && (
              <div className="text-center py-20">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-[#1A1A1A] mb-1">
                  暂无面试安排
                </h3>
                <p className="text-sm text-[#666]">
                  候选人接受面试邀请后将显示在这里
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
