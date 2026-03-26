"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MentionButtonProps {
  candidateId: string;
  candidateName: string;
  positionTitle?: string;
  onMentionSuccess?: () => void;
}

export default function MentionButton({
  candidateId,
  candidateName,
  positionTitle,
  onMentionSuccess,
}: MentionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<User | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInterviewers = async () => {
      const token = localStorage.getItem("token");
      const res = await apiFetch(`/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInterviewers(data.filter((u: User) => u.role === "INTERVIEWER"));
    };

    if (isOpen) {
      fetchInterviewers();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMention = async () => {
    if (!selectedInterviewer) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await apiFetch(
        `/candidates/${candidateId}/mentions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            interviewerId: selectedInterviewer.id,
            message: message || undefined,
          }),
        },
      );

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          setSelectedInterviewer(null);
          setMessage("");
          onMentionSuccess?.();
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to mention:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
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
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
        </svg>
        面试官
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-100 shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              通知面试官查看简历
            </h3>

            {success ? (
              <div className="text-center py-4">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-5 h-5 text-green-500"
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
                <p className="text-sm text-green-600 font-medium">通知已发送</p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    候选人
                  </label>
                  <div className="text-sm font-medium text-slate-900">
                    {candidateName}
                    {positionTitle && (
                      <span className="text-slate-500 font-normal ml-2">
                        - {positionTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    选择面试官 *
                  </label>
                  <select
                    value={selectedInterviewer?.id || ""}
                    onChange={(e) => {
                      const interviewer = interviewers.find(
                        (i) => i.id === e.target.value,
                      );
                      setSelectedInterviewer(interviewer || null);
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none transition-colors"
                  >
                    <option value="">请选择面试官</option>
                    {interviewers.map((interviewer) => (
                      <option key={interviewer.id} value={interviewer.id}>
                        {interviewer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    留言（可选）
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="请输入想对面试官说的话..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#4371FF] focus:ring-2 focus:ring-[#4371FF]/10 outline-none resize-none transition-colors"
                  />
                </div>

                <button
                  onClick={handleMention}
                  disabled={!selectedInterviewer || loading}
                  className="w-full bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-[#4371FF]" />
                      发送中...
                    </>
                  ) : (
                    "发送通知"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
