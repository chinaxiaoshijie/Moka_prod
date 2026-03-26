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
import MainLayout from "@/components/MainLayout";
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
  "#1890ff",
  "#52c41a",
  "#722ed1",
  "#fa8c16",
  "#eb2f96",
  "#13c2c2",
  "#2f54eb",
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
      <MainLayout>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#f0f0f0] border-t-[#1890ff]" />
        </main>
      </MainLayout>
    );
  }

  const statCards = dashboardStats
    ? [
        {
          label: "总候选人",
          value: dashboardStats.totalCandidates,
          color: "#1890ff",
          icon: (
            <svg width="22" height="22" fill="none" stroke="#1890ff" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          ),
          bg: "#e6f7ff",
        },
        {
          label: "待处理",
          value: dashboardStats.pendingCandidates,
          color: "#fa8c16",
          icon: (
            <svg width="22" height="22" fill="none" stroke="#fa8c16" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          ),
          bg: "#fff7e6",
        },
        {
          label: "本月录用",
          value: dashboardStats.hiredThisMonth,
          color: "#52c41a",
          icon: (
            <svg width="22" height="22" fill="none" stroke="#52c41a" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
            </svg>
          ),
          bg: "#f6ffed",
        },
        {
          label: "总面试数",
          value: dashboardStats.totalInterviews,
          color: "#722ed1",
          icon: (
            <svg width="22" height="22" fill="none" stroke="#722ed1" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          bg: "#f9f0ff",
        },
        {
          label: "即将面试",
          value: dashboardStats.upcomingInterviews,
          color: "#13c2c2",
          icon: (
            <svg width="22" height="22" fill="none" stroke="#13c2c2" strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
          ),
          bg: "#e6fffb",
        },
      ]
    : [];

  return (
    <MainLayout>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[#000000d9] tracking-tight">
                数据分析
              </h1>
              <p className="text-[13px] text-[#00000073] mt-0.5">招聘数据可视化分析报表</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="rounded-md border border-[#d9d9d9] px-3 py-1.5 text-[13px] focus:border-[#1890ff] focus:ring-1 focus:ring-[#1890ff]/20 outline-none bg-white text-[#000000d9]"
              >
                <option value={7}>最近 7 天</option>
                <option value={30}>最近 30 天</option>
                <option value={90}>最近 90 天</option>
              </select>
              <button
                onClick={exportData}
                className="border border-[#d9d9d9] hover:border-[#1890ff] hover:text-[#1890ff] text-[#000000d9] rounded-md px-3 py-1.5 text-[13px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
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

          {/* Statistic Cards — AntD Style */}
          {statCards.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-lg border border-[#f0f0f0] p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#00000073]">{card.label}</span>
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ backgroundColor: card.bg }}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <div
                    className="text-[26px] font-semibold leading-none font-mono"
                    style={{ color: card.color }}
                  >
                    {card.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts Row 1: Trend + Source */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* 招聘趋势 — Line Chart (2/3 width) */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-[#f0f0f0] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#000000d9]">
                  招聘趋势
                </h3>
                <span className="text-[12px] text-[#00000073]">最近 {timeRange} 天</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => value.slice(5)}
                      tick={{ fontSize: 11, fill: "#00000073" }}
                      axisLine={{ stroke: "#f0f0f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#00000073" }}
                      axisLine={{ stroke: "#f0f0f0" }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 4,
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="new"
                      name="新增候选人"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hired"
                      name="录用"
                      stroke="#52c41a"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 候选人来源 — Pie Chart (1/3 width) */}
            <div className="bg-white rounded-lg border border-[#f0f0f0] p-5">
              <h3 className="text-sm font-semibold text-[#000000d9] mb-4">
                来源分布
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: "#d9d9d9" }}
                    >
                      {sourceData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 4,
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Funnel + Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* 招聘漏斗 */}
            <div className="bg-white rounded-lg border border-[#f0f0f0] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#000000d9]">
                  招聘漏斗
                </h3>
                <span className="text-[12px] text-[#00000073]">
                  转化率
                  <span className="text-[#1890ff] font-semibold ml-1">
                    {funnelData?.conversionRate}%
                  </span>
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 4,
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        fontSize: 12,
                      }}
                    />
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
                        style={{ fontSize: 12 }}
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

            {/* 面试官工作量 — Bar Chart */}
            <div className="bg-white rounded-lg border border-[#f0f0f0] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#000000d9]">
                  面试官工作量
                </h3>
                <button
                  onClick={exportData}
                  className="text-[12px] text-[#1890ff] hover:text-[#40a9ff] font-medium"
                >
                  导出
                </button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={interviewerStats} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#00000073" }}
                      axisLine={{ stroke: "#f0f0f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#00000073" }}
                      axisLine={{ stroke: "#f0f0f0" }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 4,
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="completedInterviews"
                      name="已完成"
                      fill="#52c41a"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="pendingInterviews"
                      name="待面试"
                      fill="#1890ff"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interviewer Table — AntD Table style with zebra stripes */}
          {interviewerStats.length > 0 && (
            <div className="bg-white rounded-lg border border-[#f0f0f0]">
              <div className="px-5 py-3.5 border-b border-[#f0f0f0]">
                <h3 className="text-sm font-semibold text-[#000000d9]">面试官详细数据</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                      <th className="px-4 py-2.5 text-[12px] font-semibold text-[#00000073]">面试官</th>
                      <th className="px-4 py-2.5 text-[12px] font-semibold text-[#00000073] text-right">总面试</th>
                      <th className="px-4 py-2.5 text-[12px] font-semibold text-[#00000073] text-right">已完成</th>
                      <th className="px-4 py-2.5 text-[12px] font-semibold text-[#00000073] text-right">待面试</th>
                      <th className="px-4 py-2.5 text-[12px] font-semibold text-[#00000073] text-right">通过</th>
                      <th className="px-4 py-2.5 text-[12px] font-semibold text-[#00000073] text-right">通过率</th>
                      <th className="px-4 py-2.5 text-[12px] font-semibold text-[#00000073] text-right">平均评分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviewerStats.map((s, idx) => (
                      <tr
                        key={s.interviewerId}
                        className={`border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#e6f7ff] transition-colors ${
                          idx % 2 === 1 ? "bg-[#fafafa]" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-2 text-[13px] font-medium text-[#000000d9]">{s.name}</td>
                        <td className="px-4 py-2 text-[13px] text-[#000000a6] text-right">{s.totalInterviews}</td>
                        <td className="px-4 py-2 text-[13px] text-[#000000a6] text-right">{s.completedInterviews}</td>
                        <td className="px-4 py-2 text-[13px] text-[#000000a6] text-right">{s.pendingInterviews}</td>
                        <td className="px-4 py-2 text-[13px] text-[#000000a6] text-right">{s.passCount}</td>
                        <td className="px-4 py-2 text-[13px] text-right">
                          <span className="text-[#52c41a] font-medium">{s.passRate}%</span>
                        </td>
                        <td className="px-4 py-2 text-[13px] text-right">
                          <span className="text-[#fa8c16] font-medium">{s.averageRating}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </MainLayout>
  );
}
