"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/MainLayout";
import FeishuBindModal from "@/components/FeishuBindModal";
import { apiFetch } from "@/lib/api";

const FEISHU_BIND_DISMISSED_KEY = "moka_feishu_bind_dismissed";

interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: "HR" | "INTERVIEWER";
  feishuOuId?: string | null;
}

interface CandidateItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
  position?: { title: string } | null;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "待筛选", color: "text-[#d48806]", bg: "bg-[#fffbe6]" },
  SCREENING: { label: "筛选中", color: "text-[#1890ff]", bg: "bg-[#e6f7ff]" },
  INTERVIEW: { label: "面试中", color: "text-[#722ed1]", bg: "bg-[#f9f0ff]" },
  OFFER: { label: "已发Offer", color: "text-[#52c41a]", bg: "bg-[#f6ffed]" },
  HIRED: { label: "已入职", color: "text-[#389e0d]", bg: "bg-[#f6ffed]" },
  REJECTED: { label: "已淘汰", color: "text-[#ff4d4f]", bg: "bg-[#fff2f0]" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    positions: 0,
    candidates: 0,
    interviews: 0,
    pending: 0,
  });
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);

  // 飞书绑定引导
  const [showFeishuBind, setShowFeishuBind] = useState(false);

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!userData || !token) {
        window.location.href = "/login";
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // 检查是否需要弹出飞书绑定引导
        const hasFeishuOuId = parsedUser?.feishuOuId;
        const dismissed = localStorage.getItem(FEISHU_BIND_DISMISSED_KEY);
        if (!hasFeishuOuId && !dismissed) {
          setShowFeishuBind(true);
        }
      } catch {
        window.location.href = "/login";
        return;
      }

      try {
        const [posRes, candRes, intRes] = await Promise.all([
          apiFetch("/positions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch("/candidates", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiFetch("/interviews", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [posData, candData, intData] = await Promise.all([
          posRes.json(),
          candRes.json(),
          intRes.json(),
        ]);

        const pendingCount =
          candData.items?.filter(
            (c: CandidateItem) => c.status === "PENDING"
          ).length || 0;

        setStats({
          positions: posData.total || 0,
          candidates: candData.total || 0,
          interviews: intData.total || 0,
          pending: pendingCount,
        });

        setCandidates(candData.items?.slice(0, 10) || []);
      } catch (error) {
        console.error("加载统计数据失败", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleFeishuBindClose = (bound?: boolean) => {
    setShowFeishuBind(false);
    if (bound) {
      // 绑定成功后刷新用户信息
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#E8EBF0] border-t-[#1890ff]" />
      </div>
    );
  }

  const statCards = [
    {
      label: "在招职位",
      value: stats.positions,
      icon: (
        <svg width="24" height="24" fill="none" stroke="#1890ff" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
      iconBg: "#e6f7ff",
      valueColor: "#1890ff",
    },
    {
      label: "总候选人",
      value: stats.candidates,
      icon: (
        <svg width="24" height="24" fill="none" stroke="#52c41a" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        </svg>
      ),
      iconBg: "#f6ffed",
      valueColor: "#52c41a",
    },
    {
      label: "面试安排",
      value: stats.interviews,
      icon: (
        <svg width="24" height="24" fill="none" stroke="#722ed1" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: "#f9f0ff",
      valueColor: "#722ed1",
    },
    {
      label: "待处理",
      value: stats.pending,
      icon: (
        <svg width="24" height="24" fill="none" stroke="#fa8c16" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      ),
      iconBg: "#fff7e6",
      valueColor: "#fa8c16",
    },
  ];

  const hrModules = [
    {
      title: "职位管理",
      desc: "创建和管理招聘职位",
      path: "/positions",
      iconBg: "#e6f7ff",
      iconColor: "#1890ff",
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
    },
    {
      title: "候选人管理",
      desc: "筛选和跟踪候选人",
      path: "/candidates",
      iconBg: "#f6ffed",
      iconColor: "#52c41a",
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      title: "面试安排",
      desc: "管理面试日程",
      path: "/interviews",
      iconBg: "#f9f0ff",
      iconColor: "#722ed1",
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const interviewerModules = [
    {
      title: "我的面试",
      desc: "查看待完成的面试任务",
      path: "/my-interviews",
      iconBg: "#e6f7ff",
      iconColor: "#1890ff",
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const modules = user?.role === "HR" ? hrModules : interviewerModules;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#1A1A1A] tracking-tight mb-0.5">
            欢迎回来，{user?.name}
          </h1>
          <p className="text-[13px] text-[#00000073]">
            {user?.role === "HR" ? "HR 管理员" : "面试官"} · {new Date().toLocaleDateString("zh-CN", {
              timeZone: "Asia/Shanghai",
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* === AntD Statistic Cards === */}
        {user?.role === "HR" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-lg border border-[#f0f0f0] p-5 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-[#00000073]">{card.label}</span>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: card.iconBg }}
                  >
                    {card.icon}
                  </div>
                </div>
                <div
                  className="text-[30px] font-semibold leading-none font-mono"
                  style={{ color: card.valueColor }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modules */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">
            功能模块
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m) => (
              <button
                key={m.path}
                onClick={() => router.push(m.path)}
                className="group bg-white rounded-lg border border-[#f0f0f0] p-5 text-left hover:shadow-md transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: m.iconBg, color: m.iconColor }}
                >
                  {m.icon}
                </div>
                <h3 className="text-sm font-medium text-[#1A1A1A] mb-1">
                  {m.title}
                </h3>
                <p className="text-xs text-[#00000073]">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* === AntD Table: Recent Candidates === */}
        {user?.role === "HR" && candidates.length > 0 && (
          <div className="bg-white rounded-lg border border-[#f0f0f0]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f0f0]">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">最近候选人</h2>
              <button
                onClick={() => router.push("/candidates")}
                className="text-[13px] text-[#1890ff] hover:text-[#40a9ff] font-medium"
              >
                查看全部
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                    <th className="px-4 py-2.5 text-xs font-semibold text-[#00000073] uppercase tracking-wide">
                      姓名
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-[#00000073] uppercase tracking-wide">
                      电话
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-[#00000073] uppercase tracking-wide hidden sm:table-cell">
                      邮箱
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-[#00000073] uppercase tracking-wide">
                      状态
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-[#00000073] uppercase tracking-wide hidden md:table-cell">
                      创建时间
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, idx) => {
                    const status = statusMap[c.status] || {
                      label: c.status,
                      color: "text-[#000000d9]",
                      bg: "bg-[#fafafa]",
                    };
                    return (
                      <tr
                        key={c.id}
                        onClick={() => router.push("/candidates")}
                        className={`border-b border-[#f0f0f0] last:border-b-0 cursor-pointer hover:bg-[#e6f7ff] transition-colors ${
                          idx % 2 === 1 ? "bg-[#fafafa]" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-2 text-[13px] font-medium text-[#000000d9]">
                          {c.name}
                        </td>
                        <td className="px-4 py-2 text-[13px] text-[#000000a6]">
                          {c.phone}
                        </td>
                        <td className="px-4 py-2 text-[13px] text-[#000000a6] hidden sm:table-cell">
                          {c.email || "-"}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[12px] font-medium ${status.color} ${status.bg}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[13px] text-[#00000073] hidden md:table-cell">
                          {new Date(c.createdAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 飞书绑定引导弹窗 */}
      <FeishuBindModal open={showFeishuBind} onClose={handleFeishuBindClose} />
    </MainLayout>
  );
}
