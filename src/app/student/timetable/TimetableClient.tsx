"use client";

import { useEffect, useState } from "react";
import { api, TimetableData, TimetableSlot } from "@/lib/api";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat",
};

const TYPE_COLORS: Record<string, string> = {
  CLASS:    "bg-indigo-50 border-indigo-200 text-indigo-700",
  LAB:      "bg-purple-50 border-purple-200 text-purple-700",
  BREAK:    "bg-amber-50 border-amber-100 text-amber-500",
  FREE:     "bg-slate-50 border-slate-100 text-slate-400",
};

const TYPE_DOT: Record<string, string> = {
  CLASS: "bg-indigo-500", LAB: "bg-purple-500", BREAK: "bg-amber-400", FREE: "bg-slate-300",
};

function todayDay() {
  return ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][new Date().getDay()];
}

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function TimetableClient() {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(todayDay());

  useEffect(() => {
    api.studentPortal.timetable()
      .then(setTimetable)
      .catch((err) => setError((err as { message?: string })?.message ?? "Failed to load timetable."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return <div className="p-8 text-red-500 text-sm">{error}</div>;

  if (!timetable || timetable.slots.length === 0) return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Timetable</h1>
        <p className="text-slate-400 text-sm mt-1">Your weekly class schedule</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-14 text-center">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-slate-500 font-medium">No timetable published yet</p>
        <p className="text-slate-400 text-sm mt-1">Your faculty will publish the schedule soon.</p>
      </div>
    </div>
  );

  const slotsByDay: Record<string, TimetableSlot[]> = {};
  for (const day of DAYS) {
    slotsByDay[day] = timetable.slots
      .filter((s) => s.day === day)
      .sort((a, b) => (a.slotOrder ?? 0) - (b.slotOrder ?? 0));
  }

  const activeDaySlots = slotsByDay[activeDay] ?? [];
  const isToday = activeDay === todayDay();

  // Find "now" slot for today
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  function slotMinutes(t: string) {
    const [h, m] = t.split(":").map(Number); return h * 60 + m;
  }
  const currentSlotIdx = isToday
    ? activeDaySlots.findIndex((s) =>
        slotMinutes(s.startTime) <= nowMinutes && nowMinutes < slotMinutes(s.endTime))
    : -1;

  const activeDays = DAYS.filter((d) => (slotsByDay[d] ?? []).length > 0);

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Timetable</h1>
          <p className="text-slate-400 text-sm mt-1">
            {timetable.program} &nbsp;·&nbsp; Semester {timetable.semester} &nbsp;·&nbsp; {timetable.academicYear}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
          timetable.status === "PUBLISHED"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          {timetable.status}
        </span>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 flex-wrap">
        {activeDays.map((day) => {
          const isActive = activeDay === day;
          const isT = day === todayDay();
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {DAY_SHORT[day]}
              {isT && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600"}`}>
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slots */}
      {activeDaySlots.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
          No classes on {activeDay.charAt(0) + activeDay.slice(1).toLowerCase()}
        </div>
      ) : (
        <div className="space-y-2.5">
          {activeDaySlots.map((slot, idx) => {
            const isCurrent = idx === currentSlotIdx;
            const colorCls = TYPE_COLORS[slot.type] ?? TYPE_COLORS.CLASS;
            const dotCls   = TYPE_DOT[slot.type]   ?? TYPE_DOT.CLASS;
            const isClass  = slot.type === "CLASS" || slot.type === "LAB";

            return (
              <div
                key={slot.id ?? idx}
                className={`rounded-xl border p-4 flex gap-4 items-start transition-all ${colorCls} ${isCurrent ? "ring-2 ring-indigo-400 ring-offset-1 shadow-md" : ""}`}
              >
                {/* Time column */}
                <div className="flex-shrink-0 w-24 text-right">
                  <p className="text-xs font-semibold text-slate-700">{fmt(slot.startTime)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmt(slot.endTime)}</p>
                </div>

                {/* Divider */}
                <div className="flex flex-col items-center pt-1 flex-shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${dotCls}`} />
                  <div className="w-px flex-1 bg-slate-200 mt-1" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {isClass && slot.subjectName && (
                      <p className="font-semibold text-sm text-slate-800 leading-tight">{slot.subjectName}</p>
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      slot.type === "CLASS" ? "bg-indigo-100 text-indigo-700" :
                      slot.type === "LAB"   ? "bg-purple-100 text-purple-700" :
                      slot.type === "BREAK" ? "bg-amber-100 text-amber-600"  :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {slot.type}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full animate-pulse">
                        Live now
                      </span>
                    )}
                  </div>

                  {isClass && (
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                      {slot.subjectCode && (
                        <span className="font-mono">{slot.subjectCode}</span>
                      )}
                      {slot.facultyName && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {slot.facultyName}
                        </span>
                      )}
                      {slot.room && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Room {slot.room}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500">
        {Object.entries(TYPE_DOT).map(([type, dot]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
