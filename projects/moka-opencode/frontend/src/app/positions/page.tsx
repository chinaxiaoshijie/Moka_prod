"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

interface Position {
  id: string;
  title: string;
  description: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  headcount: number;
  hiredCount: number;
  inProgressCount: number;
  status: "OPEN" | "PAUSED" | "CLOSED";
  location: string | null;
}

export default function PositionsPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    salaryMin: "",
    salaryMax: "",
    headcount: "1",
    location: "",
    status: "OPEN" as "OPEN" | "PAUSED" | "CLOSED",
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/positions", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取职位列表失败");
      }

      const data = await response.json();
      setPositions(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const url = editingId
        ? `/positions/${editingId}`
        : "/positions";
      const method = editingId ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          salaryMin: formData.salaryMin
            ? Number(formData.salaryMin)
            : undefined,
          salaryMax: formData.salaryMax
            ? Number(formData.salaryMax)
            : undefined,
          headcount: Number(formData.headcount) || 1,
          location: formData.location || undefined,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        throw new Error(editingId ? "更新职位失败" : "创建职位失败");
      }

      await fetchPositions();
      closeForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (position: Position) => {
    setEditingId(position.id);
    setFormData({
      title: position.title,
      description: position.description || "",
      salaryMin: position.salaryMin?.toString() || "",
      salaryMax: position.salaryMax?.toString() || "",
      headcount: position.headcount.toString(),
      location: position.location || "",
      status: position.status,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      description: "",
      salaryMin: "",
      salaryMax: "",
      headcount: "1",
      location: "",
      status: "OPEN",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个职位吗？")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`/positions/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("删除职位失败");
      }

      await fetchPositions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OPEN":
        return "招聘中";
      case "PAUSED":
        return "暂停";
      case "CLOSED":
        return "已关闭";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-50 text-emerald-700";
      case "PAUSED":
        return "bg-amber-50 text-amber-700";
      case "CLOSED":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-60 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                职位管理
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">管理公司招聘职位信息</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加职位
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-lg w-full shadow-xl">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">
                    {editingId ? "编辑职位" : "添加职位"}
                  </h2>
                  <button
                    onClick={closeForm}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      职位名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                      placeholder="例如：高级前端工程师"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      职位描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                      rows={3}
                      placeholder="描述职位职责和要求..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        最低薪资
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.salaryMin}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salaryMin: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none pr-12"
                          placeholder="20000"
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 text-xs">
                          元/月
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        最高薪资
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.salaryMax}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salaryMax: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none pr-12"
                          placeholder="35000"
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 text-xs">
                          元/月
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        招聘人数 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.headcount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            headcount: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        工作地点
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                        placeholder="例如：北京"
                      />
                    </div>
                  </div>

                  {editingId && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        状态
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as
                              | "OPEN"
                              | "PAUSED"
                              | "CLOSED",
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none"
                      >
                        <option value="OPEN">招聘中</option>
                        <option value="PAUSED">暂停</option>
                        <option value="CLOSED">已关闭</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
                    >
                      {editingId ? "保存修改" : "创建职位"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-amber-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {position.title}
                        </h3>
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(position.status)}`}
                        >
                          {getStatusText(position.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                        {position.description || "暂无描述"}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        {position.salaryMin && position.salaryMax && (
                          <span className="font-medium text-slate-700">
                            {position.salaryMin}–{position.salaryMax} 元/月
                          </span>
                        )}
                        <span>招聘 {position.headcount} 人</span>
                        {(position.hiredCount > 0 ||
                          position.inProgressCount > 0) && (
                          <span>
                            已录用 {position.hiredCount} / 进行中{" "}
                            {position.inProgressCount}
                          </span>
                        )}
                        {position.location && (
                          <span>{position.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-6 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(position)}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(position.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-4 py-2.5 text-sm font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {positions.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 mb-1">
                    暂无职位
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    点击上方按钮添加第一个职位
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
                  >
                    添加职位
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
