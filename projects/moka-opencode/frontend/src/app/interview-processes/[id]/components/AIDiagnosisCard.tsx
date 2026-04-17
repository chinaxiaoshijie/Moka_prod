"use client";
import { apiFetch } from "@/lib/api";
import { useState, useCallback } from "react";
import ShareDiagnosisModal from "./ShareDiagnosisModal";
import FullReportModal from "./FullReportModal";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface AIDiagnosis {
  matchScore: number;          // 0-100
  matchLevel?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  questions: string[];
  summary: string;
  roundNumber: number;
  analyzedAt: string;
}

interface ProcessRound {
  roundNumber: number;
  interviewerName: string;
  isHRRound: boolean;
  roundType: string;
}

interface Feedback {
  id: string;
  interviewerName: string;
  strengths: string | null;
  weaknesses: string | null;
  overallRating: number | null;
  result: string;
}

interface ProcessInterview {
  id: string;
  roundNumber: number;
  feedbacks: Feedback[];
}

interface Process {
  id: string;
  candidateName: string;
  positionTitle: string;
  currentRound: number;
  totalRounds: number;
  status: string;
  rounds: ProcessRound[];
  interviews: ProcessInterview[];
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

/* ------------------------------------------------------------------ */
/* AIDiagnosisCard                                                     */
/* ------------------------------------------------------------------ */

interface AIDiagnosisCardProps {
  process: Process;
  user: User | null;
  /** 该卡片所属的目标轮次，用于正确路由 fetch/re-analyze/share */
  targetRound: number;
}

/** Score → colour helper matching Ant Design palette */
function getScoreColor(score: number): string {
  if (score >= 80) return "#52c41a";
  if (score >= 60) return "#1890ff";
  if (score >= 40) return "#faad14";
  return "#ff4d4f";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "极度匹配";
  if (score >= 80) return "高度匹配";
  if (score >= 70) return "良好匹配";
  if (score >= 60) return "基本匹配";
  if (score >= 40) return "部分匹配";
  return "不匹配";
}

/** Ring progress SVG (no external dependency) */
function RingProgress({
  score,
  size = 120,
  strokeWidth = 10,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f0f0f0"
        strokeWidth={strokeWidth}
      />
      {/* Foreground ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export default function AIDiagnosisCard({ process, user, targetRound }: AIDiagnosisCardProps) {
  /* ---- State ---- */
  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [interviewerOptions, setInterviewerOptions] = useState<UserOption[]>([]);

  /* ---- Fetch diagnosis ---- */
  const fetchDiagnosis = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const roundNum = targetRound;
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interview-processes/${process.id}/rounds/${roundNum}/ai-diagnosis`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // 处理空响应（尚无诊断结果）
      if (response.status === 204) {
        setDiagnosis(null);
        return;
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "获取 AI 诊断失败");
      }
      const data = await response.json();
      // 200 但无数据
      if (!data) {
        setDiagnosis(null);
        return;
      }
      if (data) setDiagnosis(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [process.id, targetRound]);

  /* ---- Re-analyze ---- */
  const handleReAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const roundNum = targetRound;
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interview-processes/${process.id}/rounds/${roundNum}/ai-diagnosis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "重新分析失败");
      }
      const data = await response.json();
      setDiagnosis(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  /* ---- Open share modal (load interviewers) ---- */
  const handleOpenShare = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/users?role=INTERVIEWER", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInterviewerOptions(data.items || data || []);
      }
    } catch {
      // ignore
    }
    setShowShareModal(true);
  };

  /* ---- Send shared diagnosis ---- */
  const handleSendShare = async (recipientId: string) => {
    try {
      const roundNum = targetRound;
      const token = localStorage.getItem("token");
      const response = await apiFetch(
        `/interview-processes/${process.id}/rounds/${roundNum}/ai-diagnosis/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ interviewerId: recipientId }),
        }
      );
      if (!response.ok) throw new Error("分享失败");
      setShowShareModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  /* ---- Auto-load on mount ---- */
  const [mounted, setMounted] = useState(false);
  if (!mounted) {
    setMounted(true);
    fetchDiagnosis();
  }

  /* ---- Previous round feedback summary ---- */
  const getPreviousRoundFeedbacks = (): { round: ProcessRound; interview: ProcessInterview }[] => {
    const currentRound = diagnosis?.roundNumber ?? process.currentRound;
    return process.rounds
      .filter((r) => r.roundNumber < currentRound)
      .map((r) => ({
        round: r,
        interview: process.interviews.find((i) => i.roundNumber === r.roundNumber)!,
      }))
      .filter((x) => x.interview && x.interview.feedbacks.length > 0);
  };

  const isHR = user?.role === "HR";
  const currentRound = targetRound;
  const currentRoundInfo = process.rounds.find((r) => r.roundNumber === currentRound);
  const isHRRound = currentRoundInfo?.isHRRound ?? false;

  /* ---- Render ---- */
  return (
    <div className="bg-white rounded-lg border border-[#f0f0f0] mb-4">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1890ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-sm font-semibold text-[#000000d9]">AI 诊断分析</h2>
          {diagnosis && (
            <span className="text-[11px] text-[#00000045]">
              第{diagnosis.roundNumber}轮 · {new Date(diagnosis.analyzedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReAnalyze}
            disabled={analyzing}
            className="border border-[#d9d9d9] hover:border-[#1890ff] hover:text-[#1890ff] text-[#000000a6] rounded px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 border border-[#1890ff] border-t-transparent rounded-full animate-spin" />
                分析中
              </span>
            ) : (
              "重新分析"
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#f0f0f0] border-t-[#1890ff] rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-[#00000073]">AI 正在分析候选人数据...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-lg bg-[#fff2f0] border border-[#ffccc7] p-3 text-[#ff4d4f] text-[13px] mb-4">
            {error}
            <button
              onClick={() => setError("")}
              className="float-right text-[#ff4d4f] hover:text-[#ff7875] font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Diagnosis Content */}
        {diagnosis && !loading && (
          <div className="space-y-5">
            {/* ---- Match Score Ring (HR round) ---- */}
            {isHRRound && (
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <RingProgress score={diagnosis.matchScore} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: getScoreColor(diagnosis.matchScore) }}
                    >
                      {diagnosis.matchScore}
                    </span>
                    <span className="text-[11px] text-[#00000073]">匹配度</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-[#000000d9] font-medium mb-1">
                    {getScoreLabel(diagnosis.matchScore)}
                  </p>
                  <p className="text-[12px] text-[#00000073] leading-relaxed">
                    {diagnosis.summary}
                  </p>
                </div>
              </div>
            )}

            {/* ---- Non-HR round: previous round feedback summary ---- */}
            {!isHRRound && (
              <>
                {/* Score bar for non-HR rounds */}
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[12px] text-[#00000073]">匹配度</span>
                  <div className="flex-1 bg-[#f0f0f0] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${diagnosis.matchScore}%`,
                        backgroundColor: getScoreColor(diagnosis.matchScore),
                      }}
                    />
                  </div>
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: getScoreColor(diagnosis.matchScore) }}
                  >
                    {diagnosis.matchScore}%
                  </span>
                </div>

                {/* Previous round feedback summary */}
                {getPreviousRoundFeedbacks().length > 0 && (
                  <div>
                    <h3 className="text-[12px] font-semibold text-[#000000d9] mb-2">前轮反馈摘要</h3>
                    <div className="space-y-2">
                      {getPreviousRoundFeedbacks().map(({ round, interview }) => (
                        <div
                          key={round.roundNumber}
                          className="bg-[#fafafa] rounded-lg border border-[#f0f0f0] p-3"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12px] font-medium text-[#000000d9]">
                              第{round.roundNumber}轮 · {round.isHRRound ? "HR面试" : round.roundType === "TECHNICAL" ? "复面" : round.roundType === "FINAL" ? "终面" : round.roundType}
                            </span>
                            <span className="text-[11px] text-[#00000073]">{interview.feedbacks[0]?.interviewerName}</span>
                          </div>
                          {interview.feedbacks[0]?.overallRating && (
                            <div className="flex items-center gap-0.5 mb-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-xs ${
                                    star <= (interview.feedbacks[0]?.overallRating ?? 0)
                                      ? "text-[#faad14]"
                                      : "text-[#f0f0f0]"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                              <span className="ml-1 text-[11px] text-[#00000073]">
                                {interview.feedbacks[0]?.overallRating}分
                              </span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {interview.feedbacks[0]?.strengths && (
                              <div className="bg-[#f6ffed] rounded p-2">
                                <p className="text-[#52c41a] font-medium text-[11px] mb-0.5">优势</p>
                                <p className="text-[#000000a6] text-[12px] line-clamp-3">
                                  {interview.feedbacks[0].strengths}
                                </p>
                              </div>
                            )}
                            {interview.feedbacks[0]?.weaknesses && (
                              <div className="bg-[#fff2f0] rounded p-2">
                                <p className="text-[#ff4d4f] font-medium text-[11px] mb-0.5">待改进</p>
                                <p className="text-[#000000a6] text-[12px] line-clamp-3">
                                  {interview.feedbacks[0].weaknesses}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---- Strengths ---- */}
            {diagnosis.strengths.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold text-[#000000d9] mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#52c41a]" />
                  优势
                </h3>
                <div className="space-y-1.5">
                  {diagnosis.strengths.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-[#52c41a] mt-0.5 flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <p className="text-[12px] text-[#000000a6] leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- Weaknesses ---- */}
            {diagnosis.weaknesses.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold text-[#000000d9] mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff4d4f]" />
                  不足
                </h3>
                <div className="space-y-1.5">
                  {diagnosis.weaknesses.map((w, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-[#ff4d4f] mt-0.5 flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </span>
                      <p className="text-[12px] text-[#000000a6] leading-relaxed">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- Suggestions ---- */}
            {diagnosis.suggestions.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold text-[#000000d9] mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1890ff]" />
                  建议
                </h3>
                <div className="space-y-1.5">
                  {diagnosis.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-[#1890ff] mt-0.5 flex-shrink-0 font-medium text-[12px]">
                        {i + 1}.
                      </span>
                      <p className="text-[12px] text-[#000000a6] leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- Action buttons ---- */}
            <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
              <button
                onClick={() => setShowFullReport(true)}
                className="border border-[#d9d9d9] hover:border-[#1890ff] hover:text-[#1890ff] text-[#000000a6] rounded px-3 py-1.5 text-[12px] font-medium transition-colors"
              >
                查看完整报告
              </button>
              {isHR && (
                <button
                  onClick={handleOpenShare}
                  className="bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded px-3 py-1.5 text-[12px] font-medium transition-colors"
                >
                  分享给面试官
                </button>
              )}
            </div>
          </div>
        )}

        {/* No diagnosis yet */}
        {!diagnosis && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-8">
            <svg className="w-10 h-10 text-[#d9d9d9] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-[13px] text-[#00000073] mb-3">暂无 AI 诊断结果</p>
            <button
              onClick={handleReAnalyze}
              disabled={analyzing}
              className="bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded px-4 py-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  分析中...
                </>
              ) : (
                "开始分析"
              )}
            </button>
          </div>
        )}
      </div>

      {/* ---- Share Modal ---- */}
      {showShareModal && (
        <ShareDiagnosisModal
          interviewerOptions={interviewerOptions}
          candidateName={process.candidateName}
          positionTitle={process.positionTitle}
          diagnosis={diagnosis}
          onSend={handleSendShare}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* ---- Full Report Modal ---- */}
      {showFullReport && (
        <FullReportModal
          diagnosis={diagnosis}
          candidateName={process.candidateName}
          positionTitle={process.positionTitle}
          isHRRound={isHRRound}
          onClose={() => setShowFullReport(false)}
        />
      )}
    </div>
  );
}
