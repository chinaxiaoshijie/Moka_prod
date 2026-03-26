"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";

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
      const response = await apiFetch("/auth/users", {
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
      const response = await apiFetch("/positions", {
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

      const response = await apiFetch(
        `/candidates?${params.toString()}`,
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
      const response = await apiFetch(
        "/interview-processes",
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

      const response = await apiFetch(
        "/candidates/parse-resume",
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
      const response = await apiFetch("/candidates", {
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
      const response = await apiFetch("/candidates", {
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
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
              候选人管理
            </h1>
            <p className="text-[#666] text-sm mt-1">管理候选人信息和应聘进度</p>
          </div>
          {user?.role === "HR" && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
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
                添加候选人
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="border border-[#E8EBF0] hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2"
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                导入候选人
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="p-6 border-b border-[#E8EBF0]">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  导入候选人
                </h2>
                <p className="text-[#666] text-sm mt-1">
                  从Boss直聘PDF简历导入候选人信息
                </p>
              </div>

              <div className="p-6 space-y-5">
                {!importPreview ? (
                  <div className="border-2 border-dashed border-[#E8EBF0] rounded-xl p-8 text-center hover:border-[#4371FF] transition-colors">
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
                      <div className="w-14 h-14 bg-[#EFF3FF] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-7 h-7 text-[#4371FF]"
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
                      <p className="text-slate-700 font-medium text-sm mb-1">
                        点击上传PDF简历
                      </p>
                      <p className="text-slate-400 text-xs">
                        支持从Boss直聘下载的PDF格式简历
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-emerald-600"
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
                        <p className="text-emerald-800 font-medium text-sm">
                          简历解析成功
                        </p>
                        <p className="text-emerald-600 text-xs">
                          {importFile?.name}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
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
                          className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                          placeholder="请输入姓名"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
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
                          className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                          placeholder="请输入电话"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
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
                          className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                          placeholder="请输入邮箱"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                      请检查并编辑信息后导入
                    </p>
                  </div>
                )}

                {importLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#E8EBF0] border-t-[#4371FF]" />
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportPreview(null);
                    }}
                    className="flex-1 border border-[#E8EBF0] hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                  >
                    取消
                  </button>
                  {importPreview && (
                    <button
                      onClick={handleImportCandidate}
                      disabled={importLoading}
                      className="flex-1 bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
                    >
                      确认导入
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Candidate Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
              <div className="p-6 border-b border-[#E8EBF0]">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  添加候选人
                </h2>
                <p className="text-[#666] text-sm mt-1">
                  手动添加候选人信息并启动面试流程
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                    className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    placeholder="候选人姓名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                    className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    placeholder="手机号码"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                    className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
                    placeholder="邮箱地址（选填）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                    className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
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
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#E8EBF0] border-t-[#4371FF]" />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
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
                    className="flex-1 border border-[#E8EBF0] hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddCandidate}
                    disabled={importLoading}
                    className="flex-1 bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    添加并启动流程
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Process Modal */}
        {showProcessModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#E8EBF0]">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  启动面试流程
                </h2>
                <p className="text-[#666] text-sm mt-1">
                  为 {selectedCandidate.name} 配置面试流程（默认3轮）
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
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
                    className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
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
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      面试轮次配置
                    </label>
                    <button
                      onClick={addRound}
                      disabled={processConfig.rounds.length >= 5}
                      className="text-sm text-[#4371FF] hover:text-[#3461E6] disabled:text-slate-400 font-medium"
                    >
                      + 添加轮次
                    </button>
                  </div>

                  <div className="space-y-3">
                    {processConfig.rounds.map((round, index) => (
                      <div
                        key={round.roundNumber}
                        className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-[#E8EBF0]"
                      >
                        <div className="w-8 h-8 bg-[#EFF3FF] rounded-full flex items-center justify-center text-[#4371FF] font-semibold text-sm flex-shrink-0">
                          {round.roundNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700 mb-1">
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
                            className="w-full text-sm rounded-lg border border-[#E8EBF0] px-3 py-2 focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
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
                            className="text-slate-400 hover:text-red-500 flex-shrink-0 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowProcessModal(false)}
                    className="flex-1 border border-[#E8EBF0] hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateProcess}
                    className="flex-1 bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
                  >
                    启动流程
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                搜索
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="姓名、电话"
                className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                状态
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
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
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                职位
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="w-full rounded-lg border border-[#E8EBF0] px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none"
              >
                <option value="">全部职位</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchCandidates}
                className="w-full bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
              >
                搜索
              </button>
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#E8EBF0] border-t-[#4371FF]" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    候选人
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    联系方式
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    应聘职位
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    状态
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                          {candidate.name.charAt(0)}
                        </div>
                        <span className="font-medium text-[#1A1A1A] text-sm">
                          {candidate.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-[#1A1A1A]">{candidate.phone}</p>
                        {candidate.email && (
                          <p className="text-xs text-[#666] mt-0.5">
                            {candidate.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {candidate.position?.title || (
                        <span className="text-slate-400">未分配</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}
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
                              className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2 text-xs font-medium shadow-sm"
                            >
                              启动面试流程
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2 text-xs bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed font-medium"
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
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">暂无候选人</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
