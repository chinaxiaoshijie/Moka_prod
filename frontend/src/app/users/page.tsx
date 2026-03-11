"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "HR" | "INTERVIEWER";
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "INTERVIEWER" as "HR" | "INTERVIEWER",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== "HR") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取用户列表失败");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "创建用户失败");
      }

      setShowForm(false);
      setFormData({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "INTERVIEWER",
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("确定要删除这个用户吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "删除用户失败");
      }

      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">用户管理</h1>
              <p className="text-slate-600 mt-1">管理系统内部面试官账户</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all"
            >
              <span className="text-xl">+</span>
              <span>添加用户</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600">
              {error}
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">加载中...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-500">暂无用户</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-slate-700">
                      姓名
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-700">
                      用户名
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-700">
                      邮箱
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-700">
                      角色
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-slate-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">{user.name}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {user.email || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            user.role === "HR"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {user.role === "HR" ? "HR" : "面试官"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.role !== "HR" && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add User Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-fade-in">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">添加用户</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    用户名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="请输入用户名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    密码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="请输入密码"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="请输入姓名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="请输入邮箱（选填）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    角色 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "HR" | "INTERVIEWER",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  >
                    <option value="INTERVIEWER">面试官</option>
                    <option value="HR">HR</option>
                  </select>
                </div>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg"
                  >
                    添加用户
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
