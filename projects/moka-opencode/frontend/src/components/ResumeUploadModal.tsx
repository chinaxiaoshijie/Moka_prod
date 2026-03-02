"use client";

import { useState } from "react";
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/candidates/${candidateId}/resumes`,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">
            上传简历 - {candidateName}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
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
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              已选择: <span className="font-medium">{selectedFile.name}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              大小: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
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
