"use client";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface AIDiagnosis {
  matchScore: number;
  matchLevel?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  questions: string[];
  summary: string;
  roundNumber: number;
  analyzedAt: string;
}

interface FullReportModalProps {
  diagnosis: AIDiagnosis | null;
  candidateName: string;
  positionTitle: string;
  isHRRound: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* FullReportModal                                                     */
/* ------------------------------------------------------------------ */

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

export default function FullReportModal({
  diagnosis,
  candidateName,
  positionTitle,
  isHRRound,
  onClose,
}: FullReportModalProps) {
  if (!diagnosis) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-[#000000d9]">
              AI 诊断完整报告
            </h2>
            <p className="text-[12px] text-[#00000073] mt-0.5">
              {candidateName} · {positionTitle} · 第{diagnosis.roundNumber}轮
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#00000073] hover:text-[#000000d9] text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Match Score (HR round) */}
          {isHRRound && diagnosis.matchScore !== undefined && diagnosis.matchScore !== null && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <svg width="80" height="80" className="transform -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e8e8e8" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={getScoreColor(diagnosis.matchScore)}
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 34}
                      strokeDashoffset={2 * Math.PI * 34 - (diagnosis.matchScore / 100) * 2 * Math.PI * 34}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold" style={{ color: getScoreColor(diagnosis.matchScore) }}>
                      {diagnosis.matchScore}
                    </span>
                    <span className="text-[10px] text-[#00000073]">匹配度</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[#000000d9]">
                    {getScoreLabel(diagnosis.matchScore)}
                  </p>
                  <p className="text-[13px] text-[#000000a6] leading-relaxed mt-1">
                    {diagnosis.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Non-HR round summary */}
          {!isHRRound && diagnosis.summary && (
            <div className="bg-[#f0f7ff] rounded-xl p-4 border border-blue-100">
              <h3 className="text-[13px] font-semibold text-[#1a73e8] mb-2">📋 诊断摘要</h3>
              <p className="text-[13px] text-[#000000a6] leading-relaxed">{diagnosis.summary}</p>
            </div>
          )}

          {/* Strengths */}
          {diagnosis.strengths.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-[#000000d9] mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#52c41a]" />
                候选人优势
              </h3>
              <div className="space-y-2">
                {diagnosis.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2.5 items-start bg-[#f6ffed] rounded-lg p-3 border border-[#b7eb8f]">
                    <span className="text-[#52c41a] mt-0.5 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-[13px] text-[#000000a6] leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {diagnosis.weaknesses.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-[#000000d9] mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#ff4d4f]" />
                不足 / 风险点
              </h3>
              <div className="space-y-2">
                {diagnosis.weaknesses.map((w, i) => (
                  <div key={i} className="flex gap-2.5 items-start bg-[#fff2f0] rounded-lg p-3 border border-[#ffccc7]">
                    <span className="text-[#ff4d4f] mt-0.5 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </span>
                    <p className="text-[13px] text-[#000000a6] leading-relaxed">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {diagnosis.suggestions.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-[#000000d9] mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#1890ff]" />
                面试建议
              </h3>
              <div className="space-y-2">
                {diagnosis.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2.5 items-start bg-[#f0f7ff] rounded-lg p-3 border border-[#bae0ff]">
                    <span className="text-[#1890ff] mt-0.5 flex-shrink-0 font-medium text-[13px]">
                      {i + 1}.
                    </span>
                    <p className="text-[13px] text-[#000000a6] leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          {diagnosis.questions && diagnosis.questions.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-[#000000d9] mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#722ed1]" />
                建议面试问题
              </h3>
              <div className="space-y-2">
                {diagnosis.questions.map((q, i) => (
                  <div key={i} className="flex gap-2.5 items-start bg-[#f9f0ff] rounded-lg p-3 border border-[#d3adf7]">
                    <span className="text-[#722ed1] mt-0.5 flex-shrink-0 font-medium text-[13px]">
                      Q{i + 1}.
                    </span>
                    <p className="text-[13px] text-[#000000a6] leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#f0f0f0] flex items-center justify-between">
          <p className="text-[11px] text-[#00000045]">
            分析时间：{new Date(diagnosis.analyzedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
          </p>
          <button
            onClick={onClose}
            className="bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded px-5 py-2 text-[13px] font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
