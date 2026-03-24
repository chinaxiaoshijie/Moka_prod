"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Sidebar from "@/components/Sidebar";

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
      const response = await fetch("http://localhost:3001/interviews", {
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                面试日历
              </h1>
              <p className="text-slate-500">以日历形式查看和管理面试安排</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 视图切换 */}
              <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setView("month")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === "month"
                      ? "bg-amber-500 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  月
                </button>
                <button
                  onClick={() => setView("week")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === "week"
                      ? "bg-amber-500 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  周
                </button>
                <button
                  onClick={() => setView("day")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === "day"
                      ? "bg-amber-500 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  日
                </button>
              </div>

              <button
                onClick={() => router.push("/interviews/new")}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <svg
                  className="w-5 h-5"
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
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-[calc(100%-6rem)]">
              {/* 图例 */}
              <div className="flex items-center gap-6 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-slate-600">已安排</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-600">已完成</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-slate-600">已取消</span>
                </div>
              </div>

              {/* 日历组件 */}
              <div className="h-[calc(100%-3rem)] rbc-calendar-wrapper">
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
    </div>
  );
}
