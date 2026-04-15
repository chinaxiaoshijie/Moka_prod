"use client";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface AIDiagnosis {
  matchScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
  roundNumber: number;
  analyzedAt: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface ShareDiagnosisModalProps {
  interviewerOptions: UserOption[];
  candidateName: string;
  positionTitle: string;
  diagnosis: AIDiagnosis | null;
  onSend: (recipientId: string) => Promise<void>;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* ShareDiagnosisModal                                                 */
/* ------------------------------------------------------------------ */

export default function ShareDiagnosisModal({
  interviewerOptions,
  candidateName,
  positionTitle,
  diagnosis,
  onSend,
  onClose,
}: ShareDiagnosisModalProps) {
  const [selectedId, setSelectedId] = useState("");
  const [sending, setSending] = useState(false);
  const [emailSubject] = useState(
    `AI诊断报告 - ${candidateName} - ${positionTitle}`
  );
  const [emailBody] = useState(() => {
    const lines: string[] = [];
    lines.push(`尊敬的面试官，您好！`);
    lines.push("");
    lines.push(
      `以下是候选人 ${candidateName}（应聘职位：${positionTitle}）的 AI 诊断分析报告，请您参考。`
    );
    lines.push("");

    if (diagnosis) {
      lines.push(`--- AI 诊断摘要 ---`);
      lines.push(`匹配度：${diagnosis.matchScore}%`);
      lines.push(`分析轮次：第${diagnosis.roundNumber}轮`);
      lines.push("");
      lines.push(`综合评价：${diagnosis.summary}`);
      lines.push("");

      if (diagnosis.strengths.length > 0) {
        lines.push("【优势】");
        diagnosis.strengths.forEach((s, i) => {
          lines.push(`  ${i + 1}. ${s}`);
        });
        lines.push("");
      }

      if (diagnosis.weaknesses.length > 0) {
        lines.push("【不足】");
        diagnosis.weaknesses.forEach((w, i) => {
          lines.push(`  ${i + 1}. ${w}`);
        });
        lines.push("");
      }

      if (diagnosis.suggestions.length > 0) {
        lines.push("【建议】");
        diagnosis.suggestions.forEach((s, i) => {
          lines.push(`  ${i + 1}. ${s}`);
        });
        lines.push("");
      }

      lines.push(`分析时间：${new Date(diagnosis.analyzedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`);
      lines.push("");
    }

    lines.push(`此邮件由 Moka 招聘管理系统自动生成。`);
    lines.push(`如需查看完整报告，请登录系统查看。`);
    lines.push("");
    lines.push(`--- Moka 招聘管理系统 ---`);

    return lines.join("\n");
  });

  const handleSend = async () => {
    if (!selectedId) return;
    setSending(true);
    try {
      await onSend(selectedId);
    } finally {
      setSending(false);
    }
  };

  const selectedRecipient = interviewerOptions.find((o) => o.id === selectedId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#000000d9]">
            分享 AI 诊断报告
          </h2>
          <button
            onClick={onClose}
            className="text-[#00000073] hover:text-[#000000d9] text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Recipient selection */}
          <div>
            <label className="block text-[12px] font-medium text-[#000000d9] mb-1">
              选择收件人 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none bg-white"
            >
              <option value="">请选择面试官</option>
              {interviewerOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} ({opt.email})
                </option>
              ))}
            </select>
          </div>

          {/* Email preview */}
          <div>
            <label className="block text-[12px] font-medium text-[#000000d9] mb-1">
              邮件预览
            </label>
            <div className="rounded border border-[#d9d9d9] bg-[#fafafa] p-3 max-h-64 overflow-y-auto">
              {/* Subject */}
              <div className="mb-2 pb-2 border-b border-[#f0f0f0]">
                <p className="text-[11px] text-[#00000073] mb-0.5">主题</p>
                <p className="text-[13px] text-[#000000d9] font-medium">
                  {emailSubject}
                </p>
              </div>
              {selectedRecipient && (
                <div className="mb-2 pb-2 border-b border-[#f0f0f0]">
                  <p className="text-[11px] text-[#00000073] mb-0.5">收件人</p>
                  <p className="text-[13px] text-[#000000d9]">
                    {selectedRecipient.name} &lt;{selectedRecipient.email}&gt;
                  </p>
                </div>
              )}
              {/* Body */}
              <div>
                <p className="text-[11px] text-[#00000073] mb-1">正文</p>
                <pre className="text-[12px] text-[#000000a6] whitespace-pre-wrap font-sans leading-relaxed">
                  {emailBody}
                </pre>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="bg-[#e6f7ff] border border-[#91d5ff] rounded p-2.5">
            <p className="text-[12px] text-[#1890ff] leading-relaxed">
              系统将根据诊断报告自动生成邮件内容发送给面试官，面试官可直接在系统中查看完整报告。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#f0f0f0] flex gap-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 border border-[#d9d9d9] hover:border-[#1890ff] text-[#000000d9] rounded px-4 py-2 text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedId || sending}
            className="flex-1 bg-[#1890ff] hover:bg-[#40a9ff] text-white rounded px-4 py-2 text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>发送中...</span>
              </>
            ) : (
              "发送"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
