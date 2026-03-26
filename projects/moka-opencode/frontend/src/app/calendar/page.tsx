"use client";
import { apiFetch } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import MainLayout from "@/components/MainLayout";

// 设置中文本地化
const localizer = momentLocalizer(moment);
moment.locale("zh-cn");

interface Interview {
  id: string;
  candidate: { name: string; phone: string };
  position: { title: string };
  interviewer: { name: string };
  type: string;
  format: string;
  startTime: string;
  endTime: string;
  status: string;
  location: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource?: Interview;
}

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"month" | "week" | "day">("week");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiFetch("/interviews", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("获取面试列表失败");
      }

      const data = await response.json();
      const interviews: Interview[] = data.items || [];

      // 转换为日历事件
      const calendarEvents: CalendarEvent[] = interviews.map((interview) => ({
        id: interview.id,
        title: `${interview.candidate.name} - ${interview.position.title}`,
        start: new Date(interview.startTime),
        end: new Date(interview.endTime),
        allDay: false,
        resource: interview,
      }));

      setEvents(calendarEvents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: any) => {
    router.push(`/interviews/${event.id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      SCHEDULED: "#3b82f6",
      COMPLETED: "#10b981",
      CANCELLED: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  return (
    <MainLayout>
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                面试日历
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">以日历形式查看和管理面试安排</p>
            </div>
            <div className="flex items-center gap-3">
              {/* 视图切换 */}
              <div className="flex bg-white rounded-lg border border-[#E8EBF0] p-1">
                <button
                  onClick={() => setView("month")}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                    view === "month"
                      ? "bg-[#4371FF] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  月
                </button>
                <button
                  onClick={() => setView("week")}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                    view === "week"
                      ? "bg-[#4371FF] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  周
                </button>
                <button
                  onClick={() => setView("day")}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                    view === "day"
                      ? "bg-[#4371FF] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  日
                </button>
              </div>

              <button
                onClick={() => router.push("/interviews/new")}
                className="bg-[#4371FF] hover:bg-[#3461E6] text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                安排面试
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-[#4371FF]" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E8EBF0] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 h-[calc(100%-5.5rem)]">
              {/* 图例 */}
              <div className="flex items-center gap-5 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-500">已安排</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-slate-500">已完成</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="text-xs text-slate-500">已取消</span>
                </div>
              </div>

              {/* 日历组件 */}
              <div className="h-[calc(100%-2.5rem)] rbc-calendar-wrapper">
                {/* @ts-ignore */}
                <Calendar
                  localizer={localizer}
                  events={events}
                  view={view}
                  onView={(newView) => setView(newView as any)}
                  onSelectEvent={handleEventClick}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "100%" }}
                  messages={{
                    today: "今天",
                    previous: "<",
                    next: ">",
                    month: "月",
                    week: "周",
                    day: "日",
                    agenda: "议程",
                    date: "日期",
                    time: "时间",
                    event: "事件",
                  }}
                  eventPropGetter={(event: any) => {
                    const status = event.resource?.status || "SCHEDULED";
                    return {
                      style: {
                        backgroundColor: getStatusColor(status),
                        color: "white",
                        borderRadius: "4px",
                        border: "none",
                      },
                    };
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </MainLayout>
  );
}
