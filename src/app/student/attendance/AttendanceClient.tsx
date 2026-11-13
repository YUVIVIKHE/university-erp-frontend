"use client";

import { useEffect, useState } from "react";
import { api, StudentData } from "@/lib/api";

interface SubjectSummary {
  subjectCode: string;
  subjectName: string;
  total: number;
  present: number;
  absent: number;
}

interface AttendanceRecord {
  id: number;
  subjectCode: string;
  subjectName: string;
  date: string;
  timeSlot: string;
  status: string;
  remarks: string | null;
}

function classesNeeded(s: SubjectSummary) {
  if (s.total === 0 || s.present / s.total >= 0.75) return 0;
  return Math.ceil((0.75 * s.total - s.present) / 0.25);
}

function canMiss(s: SubjectSummary) {
  return Math.max(0, Math.floor(s.present - 0.75 * s.total));
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AttendanceClient() {
  const [profile, setProfile]   = useState<StudentData | null>(null);
  const [summary, setSummary]   = useState<SubjectSummary[]>([]);
  const [detail, setDetail]     = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView]         = useState<"summary" | "log">("summary");

  useEffect(() => {
    Promise.all([
      api.studentPortal.me(),
      api.studentPortal.attendance(),
      api.studentPortal.attendanceDetail(),
    ]).then(([p, s, d]) => {
      setProfile(p);
      setSummary(s);
      setDetail(d);
    }).catch((err) => {
      setError((err as { message?: string })?.message ?? "Failed to load attendance.");
    }).finally(() => setLoading(false));
  }, []);

  const totalPresent = summary.reduce((s, r) => s + r.present, 0);
  const totalClasses = summary.reduce((s, r) => s + r.total, 0);
  const overall      = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : null;
  const lowCount     = summary.filter((s) => s.total > 0 && Math.round((s.present / s.total) * 100) < 75).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="p-8 text-red-500 text-sm">{error}</div>;

  return (
    <div className="p-5 md:p-7 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
        <p className="text-slate-400 text-sm mt-1">
          {profile?.program} &nbsp;·&nbsp; Semester {profile?.semester} &nbsp;·&nbsp; {summary.length} subjects
        </p>
      </div>

      {/* Overall card */}
      {overall !== null && (
        <div className={`rounded-2xl p-5 border ${overall >= 75 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${overall >= 75 ? "text-green-600" : "text-red-600"}`}>Overall Attendance</p>
              <p className={`text-5xl font-black ${overall >= 75 ? "text-green-700" : "text-red-700"}`}>{overall}<span className="text-2xl">%</span></p>
              <p className={`text-sm mt-1 ${overall >= 75 ? "text-green-600" : "text-red-600"}`}>{totalPresent} present &nbsp;/&nbsp; {totalClasses} total</p>
            </div>
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={overall >= 75 ? "#dcfce7" : "#fee2e2"} strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={overall >= 75 ? "#16a34a" : "#dc2626"}
                  strokeWidth="3"
                  strokeDasharray={`${overall} ${100 - overall}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${overall >= 75 ? "text-green-700" : "text-red-700"}`}>{overall}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/60 rounded-xl p-3">
              <p className="text-lg font-bold text-green-700">{totalPresent}</p>
              <p className="text-xs text-green-600">Present</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3">
              <p className="text-lg font-bold text-red-600">{totalClasses - totalPresent}</p>
              <p className="text-xs text-red-500">Absent</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3">
              <p className={`text-lg font-bold ${lowCount > 0 ? "text-red-600" : "text-green-700"}`}>{lowCount}</p>
              <p className="text-xs text-slate-500">Below 75%</p>
            </div>
          </div>

          {overall < 75 && (
            <div className="mt-4 bg-red-100 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
              ⚠ You are {75 - overall}% below the 75% minimum. Attend more classes to stay eligible for exams.
            </div>
          )}
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2">
        {(["summary", "log"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === v ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            {v === "summary" ? "Subject Summary" : "Session Log"}
          </button>
        ))}
      </div>

      {/* Summary view */}
      {view === "summary" && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject-wise Breakdown</h2>
          {summary.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">No attendance records yet.</div>
          ) : summary.map((s) => {
            const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
            const low = pct < 75;
            const needed = classesNeeded(s);
            const miss   = canMiss(s);
            const isExp  = expanded === s.subjectCode;

            return (
              <div key={s.subjectCode} className={`bg-white rounded-xl border transition-all ${low ? "border-red-200" : "border-slate-200"}`}>
                <button onClick={() => setExpanded(isExp ? null : s.subjectCode)} className="w-full px-5 py-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={low ? "#fee2e2" : "#dcfce7"} strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.9" fill="none"
                          stroke={low ? "#ef4444" : "#22c55e"} strokeWidth="3.5"
                          strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round"
                        />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${low ? "text-red-600" : "text-green-700"}`}>{pct}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{s.subjectName}</p>
                        {low && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Low</span>}
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{s.subjectCode}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-700">{s.present}<span className="text-slate-400 font-normal">/{s.total}</span></p>
                      <p className="text-xs text-slate-400">classes</p>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isExp ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${low ? "bg-red-400" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </button>

                {isExp && (
                  <div className={`px-5 pb-4 pt-1 border-t ${low ? "border-red-100 bg-red-50/40" : "border-slate-100 bg-slate-50/40"}`}>
                    <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                      <div><p className="text-lg font-bold text-green-600">{s.present}</p><p className="text-xs text-slate-500">Present</p></div>
                      <div><p className="text-lg font-bold text-red-500">{s.absent}</p><p className="text-xs text-slate-500">Absent</p></div>
                      <div><p className="text-lg font-bold text-slate-600">{s.total}</p><p className="text-xs text-slate-500">Total</p></div>
                    </div>

                    {low && needed > 0 && (
                      <div className="bg-red-100 rounded-lg px-3 py-2.5 text-xs text-red-700 mb-2">
                        <span className="font-semibold">Attend {needed} more consecutive class{needed > 1 ? "es" : ""}</span> in this subject to reach 75%.
                      </div>
                    )}
                    {!low && miss > 0 && (
                      <div className="bg-green-100 rounded-lg px-3 py-2.5 text-xs text-green-700 mb-2">
                        You can miss up to <span className="font-semibold">{miss}</span> more class{miss !== 1 ? "es" : ""} and stay above 75%.
                      </div>
                    )}

                    {/* Mini session log for this subject */}
                    {(() => {
                      const recs = detail.filter((r) => r.subjectCode === s.subjectCode).slice(0, 8);
                      if (recs.length === 0) return null;
                      return (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3 mb-2">Recent sessions</p>
                          <div className="space-y-1.5">
                            {recs.map((r) => (
                              <div key={r.id} className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">{fmt(r.date)} &nbsp;·&nbsp; <span className="text-slate-400">{r.timeSlot}</span></span>
                                <span className={`font-semibold px-2 py-0.5 rounded-full ${r.status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                  {r.status === "PRESENT" ? "P" : "A"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Log view */}
      {view === "log" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">All Sessions</span>
            <span className="text-xs text-slate-400">{detail.length} records</span>
          </div>
          {detail.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No session records yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {detail.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{r.subjectName}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{fmt(r.date)}</span>
                      <span>·</span>
                      <span>{r.timeSlot}</span>
                      <span className="font-mono text-slate-300">{r.subjectCode}</span>
                    </div>
                    {r.remarks && <p className="text-xs text-slate-400 italic mt-0.5">{r.remarks}</p>}
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${r.status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {r.status === "PRESENT" ? "Present" : "Absent"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
