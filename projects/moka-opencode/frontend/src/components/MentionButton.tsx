"use client";

import { useState, useEffect, useRef } from "react";

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`, {
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/${candidateId}/mentions`,
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
        className="inline-flex items-center px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
      >
        <svg
          className="w-4 h-4 mr-1"
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
        @面试官
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              @面试官查看简历
            </h3>

            {success ? (
              <div className="text-center py-4">
                <div className="text-green-500 text-4xl mb-2">✓</div>
                <p className="text-sm text-green-600">通知已发送</p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    候选人
                  </label>
                  <div className="text-sm font-medium text-gray-900">
                    {candidateName}
                    {positionTitle && (
                      <span className="text-gray-500 font-normal ml-2">
                        - {positionTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  <label className="block text-xs text-gray-500 mb-1">
                    留言（可选）
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="请输入想对面试官说的话..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleMention}
                  disabled={!selectedInterviewer || loading}
                  className="w-full bg-amber-600 text-white py-2 rounded-md text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "发送中..." : "发送通知"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
