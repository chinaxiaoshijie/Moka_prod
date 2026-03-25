"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

interface Candidate {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface Position {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface InterviewProcess {
  id: string;
  candidateId: string;
  positionId: string;
  currentRound: number;
  totalRounds: number;
  rounds: {
    roundNumber: number;
    interviewerId: string;
    isHRRound: boolean;
    roundType: string;
  }[];
}

function CreateInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processId = searchParams.get("processId");
  const roundNumber = searchParams.get("round");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [processes, setProcesses] = useState<InterviewProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    candidateId: "",
    positionId: "",
    interviewerId: "",
    type: "INTERVIEW_1" as "INTERVIEW_1" | "INTERVIEW_2" | "INTERVIEW_3",
    format: "ONLINE" as "ONLINE" | "OFFLINE",
    startTime: "",
    endTime: "",
    location: "",
    meetingUrl: "",
    meetingNumber: "",
    processId: processId || "",
    roundNumber: roundNumber ? parseInt(roundNumber) : 1,
  });

  useEffect(() => {
    fetchCandidates();
    fetchPositions();
    fetchInterviewers();
    fetchProcesses();
  }, []);

  useEffect(() => {
    if (processId && processes.length > 0) {
      const process = processes.find((p) => p.id === processId);
      if (process) {
        setFormData((prev) => ({
          ...prev,
          candidateId: process.candidateId,
          positionId: process.positionId,
          processId: process.id,
          roundNumber: roundNumber
            ? parseInt(roundNumber)
            : process.currentRound,
          type: getInterviewType(process.currentRound),
        }));
      }
    }
  }, [processId, processes, roundNumber]);

  const getInterviewType = (
    round: number,
  ): "INTERVIEW_1" | "INTERVIEW_2" | "INTERVIEW_3" => {
    if (round === 1) return "INTERVIEW_1";
    if (round === 2) return "INTERVIEW_2";
    return "INTERVIEW_3";
  };

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/candidates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.items || []);
      }
    } catch (err) {
      console.error("获取候选人失败", err);
    }
  };

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/positions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPositions(data.items || []);
      }
    } catch (err) {
      console.error("获取职位失败", err);
    }
  };

  const fetchInterviewers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInterviewers(data || []);
      }
    } catch (err) {
      console.error("获取面试官失败", err);
    }
  };

  const fetchProcesses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        "/interview-processes",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setProcesses(data.items || []);
      }
    } catch (err) {
      console.error("获取面试流程失败", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !formData.candidateId ||
      !formData.positionId ||
      !formData.interviewerId ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setError("请填写所有必填字段");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateId: formData.candidateId,
          positionId: formData.positionId,
          interviewerId: formData.interviewerId,
          type: formData.type,
          format: formData.format,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          location: formData.location || undefined,
          meetingUrl: formData.meetingUrl || undefined,
          meetingNumber: formData.meetingNumber || undefined,
          processId: formData.processId || undefined,
          roundNumber: formData.roundNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "创建面试失败");
      }

      const newInterview = await response.json();
      router.push(`/interviews/${newInterview.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const selectedCandidate = candidates.find(
    (c) => c.id === formData.candidateId,
  );
  const selectedProcess = processes.find((p) => p.id === formData.processId);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-60 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push("/interviews")}
              className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回面试列表
            </button>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">安排面试</h1>
            <p className="text-sm text-slate-500 mt-0.5">为候选人安排面试时间和面试官</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 面试流程选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  面试流程（可选）
                </label>
                <select
                  value={formData.processId}
                  onChange={(e) => {
                    const processId = e.target.value;
                    if (processId) {
                      const process = processes.find((p) => p.id === processId);
                      if (process) {
                        setFormData((prev) => ({
                          ...prev,
                          processId: process.id,
                          candidateId: process.candidateId,
                          positionId: process.positionId,
                          roundNumber: process.currentRound,
                          type: getInterviewType(process.currentRound),
                        }));
                      }
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        processId: "",
                      }));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                >
                  <option value="">不关联流程（直接创建）</option>
                  {processes.map((process) => {
                    const candidate = candidates.find(
                      (c) => c.id === process.candidateId,
                    );
                    const position = positions.find(
                      (p) => p.id === process.positionId,
                    );
                    return (
                      <option key={process.id} value={process.id}>
                        {candidate?.name} - {position?.title}（第
                        {process.currentRound}轮）
                      </option>
                    );
                  })}
                </select>
                {selectedProcess && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    已关联面试流程，自动填充候选人和职位信息
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* 候选人 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    候选人 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.candidateId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        candidateId: e.target.value,
                      }))
                    }
                    disabled={!!selectedProcess}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  >
                    <option value="">请选择候选人</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name} ({candidate.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 职位 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    应聘职位 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.positionId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        positionId: e.target.value,
                      }))
                    }
                    disabled={!!selectedProcess}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  >
                    <option value="">请选择职位</option>
                    {positions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* 面试类型 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    面试类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                    required
                  >
                    <option value="INTERVIEW_1">初试</option>
                    <option value="INTERVIEW_2">复试</option>
                    <option value="INTERVIEW_3">终试</option>
                  </select>
                </div>

                {/* 面试形式 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    面试形式 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-5 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="ONLINE"
                        checked={formData.format === "ONLINE"}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, format: "ONLINE" }))
                        }
                        className="w-4 h-4 text-amber-500"
                      />
                      <span className="text-sm text-slate-700">线上</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="OFFLINE"
                        checked={formData.format === "OFFLINE"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            format: "OFFLINE",
                          }))
                        }
                        className="w-4 h-4 text-amber-500"
                      />
                      <span className="text-sm text-slate-700">线下</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 面试官 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  面试官 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.interviewerId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      interviewerId: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                  required
                >
                  <option value="">请选择面试官</option>
                  {interviewers.map((interviewer) => (
                    <option key={interviewer.id} value={interviewer.id}>
                      {interviewer.name} (
                      {interviewer.role === "HR" ? "HR" : "面试官"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* 开始时间 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    开始时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                    required
                  />
                </div>

                {/* 结束时间 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    结束时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                    required
                  />
                </div>
              </div>

              {/* 线下地址或线上链接 */}
              {formData.format === "OFFLINE" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    面试地点
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="例如：公司A座3楼会议室"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      会议链接
                    </label>
                    <input
                      type="url"
                      value={formData.meetingUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          meetingUrl: e.target.value,
                        }))
                      }
                      placeholder="例如：https://meeting.tencent.com/..."
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      会议号
                    </label>
                    <input
                      type="text"
                      value={formData.meetingNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          meetingNumber: e.target.value,
                        }))
                      }
                      placeholder="例如：123 456 789"
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/interviews")}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      创建中...
                    </span>
                  ) : (
                    "创建面试"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#f8fafc]">
          <Sidebar />
          <main className="flex-1 lg:ml-60 p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-amber-600" />
          </main>
        </div>
      }
    >
      <CreateInterviewContent />
    </Suspense>
  );
}
