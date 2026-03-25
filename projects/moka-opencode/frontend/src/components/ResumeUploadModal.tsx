"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import FileUpload from "./FileUpload";

interface ResumeUploadModalProps {
  candidateId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResumeUploadModal({
  candidateId,
  candidateName,
  isOpen,
  onClose,
  onSuccess,
}: ResumeUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("请先选择文件");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await apiFetch(
        `/candidates/${candidateId}/resumes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "上传失败");
      }

      onSuccess();
      onClose();
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || "上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            上传简历 - {candidateName}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="mb-6">
          <FileUpload
            onUpload={handleFileSelect}
            accept={{
              "application/pdf": [".pdf"],
              "application/msword": [".doc"],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                [".docx"],
              "image/jpeg": [".jpg", ".jpeg"],
              "image/png": [".png"],
            }}
            maxSize={10 * 1024 * 1024}
            label="点击或拖拽上传简历"
            description="支持 PDF、Word(DOC/DOCX)、图片(JPG/PNG) 格式，最大 10MB"
          />
        </div>

        {selectedFile && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-sm text-slate-600">
              已选择: <span className="font-medium text-slate-800">{selectedFile.name}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              大小: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {uploading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-amber-600" />
                上传中...
              </>
            ) : (
              "上传"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
