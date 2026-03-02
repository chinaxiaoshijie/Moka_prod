"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface DataImportProps {
  onImport: (data: any[]) => void;
  templateFields: { key: string; label: string; required?: boolean }[];
  entityName: string;
}

export default function DataImport({
  onImport,
  templateFields,
  entityName,
}: DataImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file: File) => {
    setLoading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setError("Excel文件为空");
          setPreview([]);
        } else {
          // 验证必填字段
          const firstRow = jsonData[0] as any;
          const missingFields = templateFields
            .filter((f) => f.required)
            .filter((f) => !(f.label in firstRow) && !(f.key in firstRow));

          if (missingFields.length > 0) {
            setError(
              `缺少必填字段: ${missingFields.map((f) => f.label).join(", ")}`,
            );
          } else {
            setPreview(jsonData.slice(0, 5)); // 只显示前5条预览
          }
        }
      } catch (err) {
        setError("解析Excel文件失败，请检查文件格式");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        onImport(jsonData);
      };
      reader.readAsBinaryString(file);
    }
  };

  const downloadTemplate = () => {
    const template = templateFields.reduce((acc, field) => {
      acc[field.label] = field.required
        ? `必填：${field.label}`
        : `选填：${field.label}`;
      return acc;
    }, {} as any);

    const worksheet = XLSX.utils.json_to_sheet([template]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${entityName}导入模板`);
    XLSX.writeFile(workbook, `${entityName}导入模板.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={downloadTemplate}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          下载导入模板
        </button>
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-amber-500 transition-colors">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className="cursor-pointer block">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">点击上传Excel文件</p>
          <p className="text-slate-400 text-sm mt-1">支持 .xlsx 格式</p>
        </label>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-slate-900 mb-2">数据预览（前5条）</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {Object.keys(preview[0]).map((key) => (
                    <th
                      key={key}
                      className="px-3 py-2 text-left text-slate-600"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    {Object.values(row).map((value: any, i) => (
                      <td key={i} className="px-3 py-2 text-slate-700">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50"
          >
            {loading ? "导入中..." : `确认导入 (${preview.length}+ 条数据)`}
          </button>
        </div>
      )}
    </div>
  );
}

// 导出数据到Excel
export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
