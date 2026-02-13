"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "HR" | "INTERVIEWER";
  avatarUrl: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Moka 面试系统
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            欢迎回来，{user.name}！
          </h2>
          <div className="space-y-2 text-zinc-600 dark:text-zinc-400">
            <p>用户名：{user.username}</p>
            <p>邮箱：{user.email || "未设置"}</p>
            <p>角色：{user.role === "HR" ? "HR" : "面试官"}</p>
          </div>

          <div className="mt-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              快速导航
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {user.role === "HR" && (
                <>
                  <button className="rounded-lg border border-zinc-300 p-4 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                      职位管理
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      管理招聘职位
                    </div>
                  </button>
                  <button className="rounded-lg border border-zinc-300 p-4 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                      候选人管理
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      查看候选人信息
                    </div>
                  </button>
                  <button className="rounded-lg border border-zinc-300 p-4 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                      面试安排
                    </div>
                    <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      安排面试日程
                    </div>
                  </button>
                </>
              )}
              {user.role === "INTERVIEWER" && (
                <button className="rounded-lg border border-zinc-300 p-4 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    我的面试
                  </div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    查看待面试的候选人
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
