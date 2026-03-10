"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

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
      const response = await fetch("http://localhost:3001/positions", {
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
        ? `http://localhost:3001/positions/${editingId}`
        : "http://localhost:3001/positions";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
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
      const response = await fetch(`http://localhost:3001/positions/${id}`, {
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
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "PAUSED":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "CLOSED":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                职位管理
              </h1>
              <p className="text-slate-500">管理公司招聘职位信息</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>添加职位</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-fade-in">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingId ? "编辑职位" : "添加职位"}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      职位名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      placeholder="例如：高级前端工程师"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      rows={3}
                      placeholder="描述职位职责和要求..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
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
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          placeholder="20000"
                        />
                        <span className="absolute right-4 top-3 text-slate-400 text-sm">
                          元/月
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
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
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          placeholder="35000"
                        />
                        <span className="absolute right-4 top-3 text-slate-400 text-sm">
                          元/月
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
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
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        工作地点
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        placeholder="例如：北京"
                      />
                    </div>
                  </div>

                  {editingId && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
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
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      >
                        <option value="OPEN">招聘中</option>
                        <option value="PAUSED">暂停</option>
                        <option value="CLOSED">已关闭</option>
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all font-medium"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position, index) => (
                <div
                  key={position.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-900">
                          {position.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(position.status)}`}
                        >
                          {getStatusText(position.status)}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-4 line-clamp-2">
                        {position.description || "暂无描述"}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        {position.salaryMin && position.salaryMax && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="text-amber-500">💰</span>
                            <span className="font-medium">
                              {position.salaryMin}-{position.salaryMax} 元/月
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="text-blue-500">👥</span>
                          <span>招聘 {position.headcount} 人</span>
                        </div>
                        {(position.hiredCount > 0 ||
                          position.inProgressCount > 0) && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="text-emerald-500">✓</span>
                            <span>
                              已录用 {position.hiredCount} / 进行中{" "}
                              {position.inProgressCount}
                            </span>
                          </div>
                        )}
                        {position.location && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="text-violet-500">📍</span>
                            <span>{position.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-6">
                      <button
                        onClick={() => handleEdit(position)}
                        className="px-4 py-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors font-medium"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(position.id)}
                        className="px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {positions.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                    💼
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    暂无职位
                  </h3>
                  <p className="text-slate-500 mb-6">
                    点击上方按钮添加第一个职位
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
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
