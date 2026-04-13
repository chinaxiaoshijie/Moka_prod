"use client";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  resumeUrl: string | null;
  createdAt: string;
}

interface ResumeFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (candidateId) {
      fetchCandidate();
      fetchResumeFiles();
    }
  }, [candidateId]);

  const fetchCandidate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`/candidates/${candidateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCandidate(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeFiles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`/candidates/${candidateId}/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setResumeFiles(data.items || data);
      }
    } catch (err) {
      console.error("获取简历失败", err);
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "待处理",
      SCREENING: "筛选中",
      INTERVIEW_1: "初试",
      INTERVIEW_2: "复试",
      INTERVIEW_3: "终试",
      HIRED: "已录用",
      REJECTED: "已淘汰",
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-slate-100 text-slate-700",
      SCREENING: "bg-blue-50 text-blue-700",
      INTERVIEW_1: "bg-purple-50 text-purple-700",
      INTERVIEW_2: "bg-orange-50 text-orange-700",
      INTERVIEW_3: "bg-red-50 text-red-700",
      HIRED: "bg-green-50 text-green-700",
      REJECTED: "bg-gray-100 text-gray-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // 修复文件名乱码（双重 UTF-8 编码问题）
  const decodeFileName = (fileName: string) => {
    try {
      // 尝试解码双重 UTF-8 编码
      const decoded = decodeURIComponent(escape(fileName));
      return decoded;
    } catch (e) {
      // 如果解码失败，返回原始文件名
      return fileName;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4371FF]"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !candidate) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={() => router.push("/candidates")}
              className="text-sm text-[#666] hover:text-[#4371FF]"
            >
              ← 返回列表
            </button>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-600">
            {error || "候选人不存在"}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/candidates")}
            className="text-sm text-[#666] hover:text-[#4371FF]"
          >
            ← 返回列表
          </button>
        </div>

        {/* 基本信息 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4371FF] to-[#3461E6] flex items-center justify-center text-white text-2xl font-semibold">
                {candidate.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">
                  {candidate.name}
                </h1>
                <p className="text-sm text-[#666] mt-1">
                  {candidate.position?.title || "未分配职位"}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status)}`}
            >
              {getStatusText(candidate.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-[#666] mb-1">手机号码</p>
              <p className="text-base text-[#1A1A1A]">{candidate.phone}</p>
            </div>
            <div>
              <p className="text-sm text-[#666] mb-1">邮箱地址</p>
              <p className="text-base text-[#1A1A1A]">
                {candidate.email || "未填写"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#666] mb-1">应聘职位</p>
              <p className="text-base text-[#1A1A1A]">
                {candidate.position?.title || "未分配"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#666] mb-1">候选人来源</p>
              <p className="text-base text-[#1A1A1A]">
                {candidate.source || "未填写"}
              </p>
            </div>
          </div>
        </div>

        {/* 简历附件 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
            简历附件
          </h2>
          {resumeFiles.length === 0 ? (
            <div className="text-center py-8 text-[#666]">
              <svg
                className="mx-auto h-12 w-12 text-slate-300"
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
              <p className="mt-2 text-sm">暂无简历</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumeFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {decodeFileName(file.fileName)}
                      </p>
                      <p className="text-xs text-[#666] mt-0.5">
                        {formatFileSize(file.fileSize)} ·{" "}
                        {new Date(file.uploadedAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/candidates/public/resumes/${file.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm text-[#4371FF] hover:bg-[#4371FF]/10 rounded-lg transition-colors"
                    >
                      查看
                    </a>
                    <a
                      href={`/api/candidates/public/resumes/${file.id}`}
                      download={file.fileName}
                      className="px-4 py-2 text-sm bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg transition-colors"
                    >
                      下载
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
