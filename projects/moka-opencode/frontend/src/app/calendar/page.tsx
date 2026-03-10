"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
import Sidebar from "@/components/Sidebar";

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
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    interview: Interview;
  };
}

export default function CalendarPage() {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("timeGridWeek");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
        start: interview.startTime,
        end: interview.endTime,
        backgroundColor: getStatusColor(interview.status),
        borderColor: getStatusColor(interview.status),
        textColor: "#ffffff",
        extendedProps: {
          interview,
        },
      }));

      setEvents(calendarEvents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      SCHEDULED: "#3b82f6", // blue-500
      COMPLETED: "#10b981", // emerald-500
      CANCELLED: "#ef4444", // red-500
    };
    return colors[status] || "#6b7280";
  };

  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      INTERVIEW_1: "初试",
      INTERVIEW_2: "复试",
      INTERVIEW_3: "终试",
    };
    return typeMap[type] || type;
  };

  const getFormatText = (format: string) => {
    const formatMap: { [key: string]: string } = {
      ONLINE: "线上",
      OFFLINE: "线下",
    };
    return formatMap[format] || format;
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const interviewId = clickInfo.event.id;
    router.push(`/interviews/${interviewId}`);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    // 可以在这里添加快速创建面试的功能
  };

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView);
    }
  };

  const goToToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  const goToPrev = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
    }
  };

  const goToNext = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
    }
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
                  onClick={() => handleViewChange("dayGridMonth")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === "dayGridMonth"
                      ? "bg-amber-500 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  月
                </button>
                <button
                  onClick={() => handleViewChange("timeGridWeek")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === "timeGridWeek"
                      ? "bg-amber-500 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  周
                </button>
                <button
                  onClick={() => handleViewChange("timeGridDay")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === "timeGridDay"
                      ? "bg-amber-500 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  日
                </button>
              </div>

              {/* 导航按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrev}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  今天
                </button>
                <button
                  onClick={goToNext}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
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
              <div className="h-[calc(100%-3rem)]">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={view}
                  headerToolbar={false}
                  events={events}
                  eventClick={handleEventClick}
                  selectable={true}
                  select={handleDateSelect}
                  locale="zh-cn"
                  slotMinTime="08:00:00"
                  slotMaxTime="20:00:00"
                  allDaySlot={false}
                  slotDuration="00:30:00"
                  snapDuration="00:15:00"
                  height="100%"
                  eventContent={(eventInfo) => {
                    const interview = eventInfo.event.extendedProps.interview;
                    return (
                      <div className="p-1 text-xs">
                        <div className="font-semibold truncate">
                          {interview.candidate.name}
                        </div>
                        <div className="opacity-90 truncate">
                          {interview.position.title}
                        </div>
                        <div className="opacity-75 truncate">
                          {getTypeText(interview.type)} ·{" "}
                          {interview.interviewer.name}
                        </div>
                      </div>
                    );
                  }}
                  eventTimeFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    meridiem: false,
                    hour12: false,
                  }}
                  slotLabelFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }}
                  dayHeaderFormat={{
                    weekday: "short",
                    month: "numeric",
                    day: "numeric",
                  }}
                  buttonText={{
                    today: "今天",
                    month: "月",
                    week: "周",
                    day: "日",
                  }}
                  noEventsContent={() => (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        📅
                      </div>
                      <p className="text-slate-500">暂无面试安排</p>
                      <button
                        onClick={() => router.push("/interviews/new")}
                        className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                      >
                        安排面试
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
