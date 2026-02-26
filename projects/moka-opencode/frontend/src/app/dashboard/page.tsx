"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Dashboard mounting...");
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    console.log("Token:", token);
    console.log("User data:", userData);

    if (!token || !userData) {
      console.log("No auth, redirecting...");
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log("Parsed user:", parsedUser);
      setUser(parsedUser);
      setLoading(false);
    } catch (error) {
      console.error("Parse error:", error);
      console.log("Redirecting to login due to error");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    console.log("Logout clicked");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Moka 面试系统
            </h1>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              退出
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            欢迎回来，{user?.name || "用户"}！
          </h1>
          <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
            <p>用户名：{user?.username || "-"}</p>
            <p>邮箱：{user?.email || "未设置"}</p>
            <p>角色：{user?.role || "-"}</p>
          </div>

          <div className="mt-8 rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              快速导航
            </h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <button className="w-full rounded-lg border border-zinc-300 p-6 text-left hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    职位管理
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    管理招聘职位
                  </div>
                </button>
              </button>
              <button className="w-full rounded-lg border border-zinc-300 p-6 text-left hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    候选人管理
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    查看候选人信息
                  </div>
                </button>
              </button>
              <button className="w-full rounded-lg border-zinc-300 p-6 text-left hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    面试安排
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    安排面试日程
                  </div>
                </button>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
