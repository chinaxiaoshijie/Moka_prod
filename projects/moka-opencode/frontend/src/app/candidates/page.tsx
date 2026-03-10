"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface Candidate {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  position: { title: string; id: string } | null;
  positionId: string | null;
  status: string;
  source: string | null;
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

interface InterviewRound {
  roundNumber: number;
  interviewerId: string;
  isHRRound: boolean;
  roundType: string;
}

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    email: "",
    positionId: "",
  });
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  );
  const [processConfig, setProcessConfig] = useState({
    positionId: "",
    hasHRRound: true,
    rounds: [
      {
        roundNumber: 1,
        interviewerId: "",
        isHRRound: true,
        roundType: "HR_SCREENING",
      },
      {
        roundNumber: 2,
        interviewerId: "",
        isHRRound: false,
        roundType: "TECHNICAL",
      },
      {
        roundNumber: 3,
        interviewerId: "",
        isHRRound: false,
        roundType: "FINAL",
      },
    ] as InterviewRound[],
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchCandidates();
    fetchPositions();
    fetchInterviewers();
  }, []);

  const fetchInterviewers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const interviewers = data.filter((u: User) => u.role === "INTERVIEWER");
        setInterviewers(interviewers || []);
      }
    } catch (err) {
      console.error("获取面试官列表失败", err);
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
      console.error("获取职位列表失败", err);
    }
  };

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (positionFilter) params.append("positionId", positionFilter);

      const response = await fetch(
        `http://localhost:3001/candidates?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) throw new Error("获取候选人列表失败");
      const data = await response.json();
      setCandidates(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProcess = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setProcessConfig({
      positionId: candidate.positionId || "",
      hasHRRound: true,
      rounds: [
        {
          roundNumber: 1,
          interviewerId: user?.id || "",
          isHRRound: true,
          roundType: "HR_SCREENING",
        },
        {
          roundNumber: 2,
          interviewerId: "",
          isHRRound: false,
          roundType: "TECHNICAL",
        },
        {
          roundNumber: 3,
          interviewerId: "",
          isHRRound: false,
          roundType: "FINAL",
        },
      ],
    });
    setShowProcessModal(true);
  };

  const handleCreateProcess = async () => {
    if (!selectedCandidate) return;

    const validRounds = processConfig.rounds.filter((r) => r.interviewerId);
    if (validRounds.length === 0) {
      setError("请至少配置一轮面试官");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3001/interview-processes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            candidateId: selectedCandidate.id,
            positionId: processConfig.positionId,
            hasHRRound: processConfig.hasHRRound,
            totalRounds: validRounds.length,
            rounds: validRounds,
          }),
        },
      );

      if (!response.ok) throw new Error("创建面试流程失败");

      const process = await response.json();
      router.push(`/interview-processes/${process.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateRoundInterviewer = (
    roundNumber: number,
    interviewerId: string,
  ) => {
    setProcessConfig((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.roundNumber === roundNumber ? { ...r, interviewerId } : r,
      ),
    }));
  };

  const removeRound = (roundNumber: number) => {
    setProcessConfig((prev) => ({
      ...prev,
      rounds: prev.rounds
        .filter((r) => r.roundNumber !== roundNumber)
        .map((r, idx) => ({
          ...r,
          roundNumber: idx + 1,
        })),
    }));
  };

  const addRound = () => {
    if (processConfig.rounds.length >= 5) {
      setError("最多5轮面试");
      return;
    }
    setProcessConfig((prev) => ({
      ...prev,
      rounds: [
        ...prev.rounds,
        {
          roundNumber: prev.rounds.length + 1,
          interviewerId: "",
          isHRRound: false,
          roundType: "TECHNICAL",
        },
      ],
    }));
  };

  const getStatusText = (status: string) => {
    const map: { [key: string]: string } = {
      PENDING: "待处理",
      SCREENING: "筛选中",
      INTERVIEW_1: "初试",
      INTERVIEW_2: "复试",
      INTERVIEW_3: "终试",
      HIRED: "已录用",
      REJECTED: "已拒绝",
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: { [key: string]: string } = {
      PENDING: "bg-slate-100 text-slate-700",
      SCREENING: "bg-blue-100 text-blue-700",
      INTERVIEW_1: "bg-violet-100 text-violet-700",
      INTERVIEW_2: "bg-violet-100 text-violet-700",
      INTERVIEW_3: "bg-violet-100 text-violet-700",
      HIRED: "bg-emerald-100 text-emerald-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
  };

  const canStartProcess = (status: string) =>
    ["PENDING", "SCREENING"].includes(status);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setImportFile(file);
      parseResume(file);
    } else {
      setError("请选择PDF文件");
    }
  };

  const parseResume = async (file: File) => {
    setImportLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://localhost:3001/candidates/parse-resume",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!response.ok) throw new Error("解析简历失败");
      const data = await response.json();
      setImportPreview(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCandidate = async () => {
    if (!importPreview) return;
    setImportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: importPreview.name,
          phone: importPreview.phone,
          email: importPreview.email,
          source: "BOSS",
        }),
      });

      if (!response.ok) throw new Error("导入候选人失败");

      setShowImportModal(false);
      setImportFile(null);
      setImportPreview(null);
      fetchCandidates();
      alert("候选人导入成功！");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!addForm.name || !addForm.phone) {
      setError("请填写姓名和电话");
      return;
    }
    setImportLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: addForm.name,
          phone: addForm.phone,
          email: addForm.email || undefined,
          positionId: addForm.positionId || undefined,
          source: "BOSS",
        }),
      });

      if (!response.ok) throw new Error("添加候选人失败");

      const newCandidate = await response.json();
      setShowAddModal(false);
      setAddForm({ name: "", phone: "", email: "", positionId: "" });
      fetchCandidates();

      handleStartProcess(newCandidate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                候选人管理
              </h1>
              <p className="text-slate-500">管理候选人信息和应聘进度</p>
            </div>
            {user?.role === "HR" && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
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
                  添加候选人
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  导入候选人
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">
              ⚠️ {error}
            </div>
          )}

          {showImportModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">
                    导入候选人
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    从Boss直聘PDF简历导入候选人信息
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {!importPreview ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-amber-500 transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="cursor-pointer block"
                      >
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-slate-700 font-medium mb-2">
                          点击上传PDF简历
                        </p>
                        <p className="text-slate-400 text-sm">
                          支持从Boss直聘下载的PDF格式简历
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-emerald-800 font-medium">
                            简历解析成功
                          </p>
                          <p className="text-emerald-600 text-sm">
                            {importFile?.name}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            姓名 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={importPreview.name || ""}
                            onChange={(e) =>
                              setImportPreview({
                                ...importPreview,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            placeholder="请输入姓名"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            电话 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={importPreview.phone || ""}
                            onChange={(e) =>
                              setImportPreview({
                                ...importPreview,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            placeholder="请输入电话"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            邮箱
                          </label>
                          <input
                            type="email"
                            value={importPreview.email || ""}
                            onChange={(e) =>
                              setImportPreview({
                                ...importPreview,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            placeholder="请输入邮箱"
                          />
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 text-center">
                        请检查并编辑信息后导入
                      </p>
                    </div>
                  )}

                  {importLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                        setImportPreview(null);
                      }}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
                    >
                      取消
                    </button>
                    {importPreview && (
                      <button
                        onClick={handleImportCandidate}
                        disabled={importLoading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50"
                      >
                        确认导入
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">
                    添加候选人
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    手动添加候选人信息并启动面试流程
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-emerald-500"
                      placeholder="候选人姓名"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      电话 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={addForm.phone}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-emerald-500"
                      placeholder="手机号码"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-emerald-500"
                      placeholder="邮箱地址（选填）"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      应聘职位
                    </label>
                    <select
                      value={addForm.positionId}
                      onChange={(e) =>
                        setAddForm((prev) => ({
                          ...prev,
                          positionId: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-emerald-500"
                    >
                      <option value="">请选择职位（选填）</option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {importLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setAddForm({
                          name: "",
                          phone: "",
                          email: "",
                          positionId: "",
                        });
                      }}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddCandidate}
                      disabled={importLoading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50"
                    >
                      添加并启动流程
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showProcessModal && selectedCandidate && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">
                    启动面试流程
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    为 {selectedCandidate.name} 配置面试流程（默认3轮）
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      应聘职位
                    </label>
                    <select
                      value={processConfig.positionId}
                      onChange={(e) =>
                        setProcessConfig((prev) => ({
                          ...prev,
                          positionId: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500"
                    >
                      <option value="">请选择职位</option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-slate-700">
                        面试轮次配置
                      </label>
                      <button
                        onClick={addRound}
                        disabled={processConfig.rounds.length >= 5}
                        className="text-sm text-amber-600 hover:text-amber-700 disabled:text-slate-400"
                      >
                        + 添加轮次
                      </button>
                    </div>

                    <div className="space-y-3">
                      {processConfig.rounds.map((round, index) => (
                        <div
                          key={round.roundNumber}
                          className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl"
                        >
                          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
                            {round.roundNumber}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-700">
                              {round.isHRRound
                                ? "HR初面"
                                : round.roundType === "TECHNICAL"
                                  ? "技术面试"
                                  : "终面"}
                            </div>
                            <select
                              value={round.interviewerId}
                              onChange={(e) =>
                                updateRoundInterviewer(
                                  round.roundNumber,
                                  e.target.value,
                                )
                              }
                              className="w-full mt-1 text-sm rounded-lg border border-slate-200 px-3 py-2"
                            >
                              <option value="">选择面试官</option>
                              {round.isHRRound ? (
                                <option value={user?.id}>
                                  {user?.name} (HR)
                                </option>
                              ) : (
                                interviewers.map((i) => (
                                  <option key={i.id} value={i.id}>
                                    {i.name}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                          {index > 0 && (
                            <button
                              onClick={() => removeRound(round.roundNumber)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowProcessModal(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCreateProcess}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg"
                    >
                      启动流程
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  搜索
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="姓名、电话"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  状态
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                >
                  <option value="">全部状态</option>
                  <option value="PENDING">待处理</option>
                  <option value="SCREENING">筛选中</option>
                  <option value="INTERVIEW_1">初试</option>
                  <option value="INTERVIEW_2">复试</option>
                  <option value="INTERVIEW_3">终试</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  职位
                </label>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                >
                  <option value="">全部职位</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={fetchCandidates}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl"
                >
                  搜索
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      候选人
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      联系方式
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      应聘职位
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      状态
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-medium">
                            {candidate.name.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-900">
                            {candidate.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-slate-900">{candidate.phone}</p>
                          {candidate.email && (
                            <p className="text-slate-500 text-xs">
                              {candidate.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {candidate.position?.title || (
                          <span className="text-slate-400">未分配</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}
                        >
                          {getStatusText(candidate.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {user?.role === "HR" &&
                            (canStartProcess(candidate.status) ? (
                              <button
                                onClick={() => handleStartProcess(candidate)}
                                className="px-4 py-2 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
                              >
                                启动面试流程
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-4 py-2 text-sm bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                                title="该候选人已有进行中的面试流程"
                              >
                                流程进行中
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {candidates.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                    👥
                  </div>
                  <p className="text-slate-500">暂无候选人</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
