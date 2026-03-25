"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { exportToExcel } from "@/components/DataImport";

interface FunnelData {
  stages: { name: string; count: number }[];
  conversionRate: string | number;
}

interface InterviewerStats {
  interviewerId: string;
  name: string;
  totalInterviews: number;
  completedInterviews: number;
  pendingInterviews: number;
  passCount: number;
  failCount: number;
  passRate: string | number;
  averageRating: string | number;
}

interface SourceData {
  source: string;
  count: number;
}

interface TimelineData {
  date: string;
  new: number;
  hired: number;
}

interface DashboardStats {
  totalCandidates: number;
  pendingCandidates: number;
  hiredThisMonth: number;
  totalInterviews: number;
  upcomingInterviews: number;
}

const COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [interviewerStats, setInterviewerStats] = useState<InterviewerStats[]>(
    [],
  );
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [funnel, interviewers, sources, timeline, dashboard] =
        await Promise.all([
          apiFetch("/analytics/funnel", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          apiFetch("/analytics/interviewers", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          apiFetch("/analytics/sources", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          apiFetch(`/analytics/timeline?days=${timeRange}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          apiFetch("/analytics/dashboard", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        ]);

      setFunnelData(funnel);
      setInterviewerStats(interviewers);
      setSourceData(sources);
      setTimelineData(timeline);
      setDashboardStats(dashboard);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (interviewerStats.length > 0) {
      exportToExcel(
        interviewerStats.map((s) => ({
          面试官: s.name,
          总面试数: s.totalInterviews,
          已完成: s.completedInterviews,
          待面试: s.pendingInterviews,
          通过数: s.passCount,
          不通过数: s.failCount,
          通过率: `${s.passRate}%`,
          平均评分: s.averageRating,
        })),
        "面试官工作量统计",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-60 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-amber-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-60 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                数据分析
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">招聘数据可视化分析报表</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none bg-white"
              >
                <option value={7}>最近 7 天</option>
                <option value={30}>最近 30 天</option>
                <option value={90}>最近 90 天</option>
              </select>
              <button
                onClick={exportData}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                导出报表
              </button>
            </div>
          </div>

          {/* 关键指标卡片 */}
          {dashboardStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">总候选人</p>
                <p className="text-2xl font-bold text-slate-900">
                  {dashboardStats.totalCandidates}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">待处理</p>
                <p className="text-2xl font-bold text-amber-600">
                  {dashboardStats.pendingCandidates}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">本月录用</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {dashboardStats.hiredThisMonth}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">总面试数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardStats.totalInterviews}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">即将面试</p>
                <p className="text-2xl font-bold text-violet-600">
                  {dashboardStats.upcomingInterviews}
                </p>
              </div>
            </div>
          )}

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* 招聘漏斗 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-1">
                招聘漏斗
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                总体转化率：
                <span className="text-amber-600 font-semibold ml-1">
                  {funnelData?.conversionRate}%
                </span>
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="count"
                      data={funnelData?.stages || []}
                      isAnimationActive
                    >
                      <LabelList
                        position="inside"
                        fill="#fff"
                        stroke="none"
                        dataKey="name"
                      />
                      {funnelData?.stages.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 候选人来源 */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                候选人来源分布
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {sourceData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 面试官工作量 */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 mb-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              面试官工作量统计
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interviewerStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="completedInterviews"
                    name="已完成"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="pendingInterviews"
                    name="待面试"
                    fill="#f59e0b"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 招聘趋势 */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              招聘趋势（最近 {timeRange} 天）
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.slice(5)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="new"
                    name="新增候选人"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="hired"
                    name="录用"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
