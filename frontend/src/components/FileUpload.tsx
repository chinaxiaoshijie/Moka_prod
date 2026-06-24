"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: { [key: string]: string[] };
  maxSize?: number;
  label?: string;
  description?: string;
}

export default function FileUpload({
  onUpload,
  accept = { "application/pdf": [".pdf"] },
  maxSize = 5 * 1024 * 1024, // 5MB
  label = "点击或拖拽上传文件",
  description = "支持 PDF 格式，最大 5MB",
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      maxFiles: 1,
    });

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.name} className="text-red-500 text-sm mt-2">
      {file.name}: {errors.map((e) => e.message).join(", ")}
    </li>
  ));

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-[#4371FF] bg-[#EFF3FF]"
            : "border-slate-200 hover:border-[#4371FF] hover:bg-slate-50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 bg-[#EFF3FF] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-[#4371FF]"
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
        </div>
        <p className="text-slate-700 font-medium text-sm">{label}</p>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>

      {fileRejectionItems.length > 0 && (
        <ul className="mt-4">{fileRejectionItems}</ul>
      )}
    </div>
  );
}
