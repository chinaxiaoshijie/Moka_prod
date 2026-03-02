"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

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
      const response = await fetch("http://localhost:3001/candidates", {
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
      const response = await fetch("http://localhost:3001/positions", {
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
      const response = await fetch("http://localhost:3001/auth/users", {
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
      const response = await fetch(
        "http://localhost:3001/interview-processes",
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
      const response = await fetch("http://localhost:3001/interviews", {
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push("/interviews")}
              className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
            >
              <span>←</span> 返回面试列表
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">安排面试</h1>
            <p className="text-slate-500">为候选人安排面试时间和面试官</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 面试流程选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
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
                  <p className="mt-2 text-sm text-amber-600">
                    已关联面试流程，自动填充候选人和职位信息
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 候选人 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
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

              <div className="grid grid-cols-2 gap-6">
                {/* 面试类型 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    required
                  >
                    <option value="INTERVIEW_1">初试</option>
                    <option value="INTERVIEW_2">复试</option>
                    <option value="INTERVIEW_3">终试</option>
                  </select>
                </div>

                {/* 面试形式 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    面试形式 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
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
                      <span>线上</span>
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
                      <span>线下</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 面试官 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
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

              <div className="grid grid-cols-2 gap-6">
                {/* 开始时间 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>

                {/* 结束时间 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    required
                  />
                </div>
              </div>

              {/* 线下地址或线上链接 */}
              {formData.format === "OFFLINE" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push("/interviews")}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </main>
        </div>
      }
    >
      <CreateInterviewContent />
    </Suspense>
  );
}
