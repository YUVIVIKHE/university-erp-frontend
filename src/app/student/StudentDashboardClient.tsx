"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, StudentData, ExamResultData, FeeData, TimetableData } from "@/lib/api";

const GRADE_POINTS: Record<string, number> = {
  "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C+": 5, "C": 5, "D": 4, "F": 0,
};

function calcGPA(results: ExamResultData[]): number | null {
  const graded = results.filter((r) => !r.isAbsent && r.grade && r.grade in GRADE_POINTS);
  if (graded.length === 0) return null;
  const total = graded.reduce((s, r) => s + GRADE_POINTS[r.grade!], 0);
  return Math.round((total / graded.length) * 100) / 100;
}

function todayName() {
  return ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][new Date().getDay()];
}

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function StudentDashboardClient() {
  const [profile, setProfile]       = useState<StudentData | null>(null);
  const [results, setResults]       = useState<ExamResultData[]>([]);
  const [attendance, setAttendance] = useState<{ subjectCode: string; subjectName: string; total: number; present: number; absent: number }[]>([]);
  const [fees, setFees]             = useState<FeeData[]>([]);
  const [timetable, setTimetable]   = useState<TimetableData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    api.studentPortal.me().then((p) => {
      setProfile(p);
      return Promise.all([
        api.studentPortal.results().catch(() => [] as ExamResultData[]),
        api.studentPortal.attendance().catch(() => [] as typeof attendance),
        api.studentPortal.fees().catch(() => [] as FeeData[]),
        api.studentPortal.timetable().catch(() => null),
      ]);
    }).then(([r, a, f, t]) => {
      setResults(r); setAttendance(a); setFees(f); setTimetable(t);
    }).catch((err) => {
      setError((err as { message?: string })?.message ?? "Failed to load your profile.");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading your dashboard…</p>
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="p-8 max-w-md mx-auto mt-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-semibold text-sm mb-1">Could not load your profile</p>
        <p className="text-red-500 text-xs">{error ?? "No student record found."}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700">Retry</button>
      </div>
    </div>
  );

  const passedCount   = results.filter((r) => r.isPass === true).length;
  const gpa           = calcGPA(results);
  const pendingFees   = fees.filter((f) => ["PENDING","PARTIAL","OVERDUE"].includes(f.status));
  const totalDue      = pendingFees.reduce((s, f) => s + f.balance, 0);
  const totalClasses  = attendance.reduce((s, a) => s + a.total, 0);
  const presentCount  = attendance.reduce((s, a) => s + a.present, 0);
  const overallPct    = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : null;
  const lowAttendance = attendance.filter((a) => a.total > 0 && Math.round((a.present / a.total) * 100) < 75);

  // Today's timetable slots
  const todaySlots = (timetable?.slots ?? [])
    .filter((s) => s.day === todayName() && s.type !== "BREAK" && s.type !== "FREE")
    .sort((a, b) => (a.slotOrder ?? 0) - (b.slotOrder ?? 0));

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  function slotMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
  const currentSlot = todaySlots.find((s) => slotMin(s.startTime) <= nowMin && nowMin < slotMin(s.endTime));

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto space-y-6">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 right-20 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold mb-0.5">{profile.fullName}</h1>
          <p className="text-indigo-200 text-sm">{profile.program} &nbsp;·&nbsp; Semester {profile.semester} &nbsp;·&nbsp; Batch {profile.batchYear}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bg-white/20 text-white text-xs font-mono font-semibold px-3 py-1.5 rounded-lg">{profile.rollNumber}</span>
            <span className="bg-white/10 text-indigo-100 text-xs px-3 py-1.5 rounded-lg">{profile.email}</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Attendance" value={overallPct !== null ? `${overallPct}%` : "—"} sub={`${presentCount}/${totalClasses} classes`} color={overallPct !== null && overallPct < 75 ? "red" : "green"} icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
        } />
        <StatCard label="GPA" value={gpa !== null ? String(gpa) : "—"} sub={`${passedCount}/${results.length} passed`} color="indigo" icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0121 13.5c0 3.314-4.029 6-9 6s-9-2.686-9-6c0-.538.091-1.06.255-1.554L12 14z" /></svg>
        } />
        <StatCard label="Fee Due" value={totalDue > 0 ? `₹${totalDue.toLocaleString()}` : "Clear"} sub={totalDue > 0 ? `${pendingFees.length} pending` : "All paid"} color={totalDue > 0 ? "amber" : "green"} icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        } />
        <StatCard label="Subjects" value={String(attendance.length)} sub={`Sem ${profile.semester}`} color="slate" icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        } />
      </div>

      {/* Alerts */}
      {lowAttendance.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <div>
            <p className="text-sm font-semibold text-red-700">Low attendance in {lowAttendance.length} subject{lowAttendance.length > 1 ? "s" : ""}</p>
            <p className="text-xs text-red-600 mt-0.5">{lowAttendance.map((a) => a.subjectName).join(", ")}</p>
            <Link href="/student/attendance" className="text-xs text-red-700 underline mt-1 inline-block font-medium">View attendance →</Link>
          </div>
        </div>
      )}

      {pendingFees.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <div>
            <p className="text-sm font-semibold text-amber-700">Fee payment pending — ₹{totalDue.toLocaleString()}</p>
            <p className="text-xs text-amber-600 mt-0.5">{pendingFees.length} record{pendingFees.length > 1 ? "s" : ""} due</p>
            <Link href="/student/fees" className="text-xs text-amber-700 underline mt-1 inline-block font-medium">View fees →</Link>
          </div>
        </div>
      )}

      {/* Two-column section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Today's schedule */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Today&apos;s Schedule</h2>
            <Link href="/student/timetable" className="text-xs text-indigo-600 hover:underline">Full timetable →</Link>
          </div>
          {!timetable ? (
            <p className="p-5 text-xs text-slate-400">No timetable published yet.</p>
          ) : todaySlots.length === 0 ? (
            <p className="p-5 text-xs text-slate-400">No classes today.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {todaySlots.map((slot, i) => {
                const isCurr = slot === currentSlot;
                return (
                  <div key={slot.id ?? i} className={`px-5 py-3 flex items-start gap-3 ${isCurr ? "bg-indigo-50" : ""}`}>
                    <div className="text-right flex-shrink-0 w-16">
                      <p className="text-xs font-semibold text-slate-700">{fmtTime(slot.startTime)}</p>
                      <p className="text-xs text-slate-400">{fmtTime(slot.endTime)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-slate-800 truncate">{slot.subjectName ?? slot.type}</p>
                        {isCurr && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">Now</span>}
                      </div>
                      <div className="flex gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        {slot.facultyName && <span>{slot.facultyName}</span>}
                        {slot.room && <span>· Room {slot.room}</span>}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg ${slot.type === "LAB" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {slot.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Attendance Snapshot</h2>
            <Link href="/student/attendance" className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          {attendance.length === 0 ? (
            <p className="p-5 text-xs text-slate-400">No attendance data yet.</p>
          ) : (
            <div className="p-4 space-y-3">
              {attendance.slice(0, 5).map((s) => {
                const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
                const low = pct < 75;
                return (
                  <div key={s.subjectCode}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-slate-700 truncate max-w-[70%]">{s.subjectName}</p>
                      <span className={`text-xs font-bold ${low ? "text-red-600" : "text-green-600"}`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${low ? "bg-red-400" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent results */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Recent Results</h2>
          <Link href="/student/results" className="text-xs text-indigo-600 hover:underline">View all →</Link>
        </div>
        {results.length === 0 ? (
          <p className="p-5 text-xs text-slate-400">No results published yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.slice(0, 6).map((r) => {
              const pct = !r.isAbsent && r.marksObtained !== null && r.totalMarks > 0
                ? Math.round((r.marksObtained / r.totalMarks) * 100) : null;
              return (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{r.examTitle}</p>
                    <p className="text-xs text-slate-400">Sem {r.semester} · {r.examType}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {r.isAbsent ? (
                      <span className="text-xs text-slate-400">Absent</span>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-800">{r.marksObtained ?? "—"}<span className="text-slate-400 font-normal text-xs">/{r.totalMarks}</span></p>
                        <div className="flex items-center gap-1 justify-end">
                          {r.grade && <span className="text-xs font-bold text-indigo-600">{r.grade}</span>}
                          {pct !== null && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${r.isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                              {pct}%
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/student/timetable", label: "Timetable", color: "bg-indigo-50 border-indigo-100 text-indigo-700 hover:border-indigo-300" },
          { href: "/student/subjects",  label: "Subjects",  color: "bg-blue-50 border-blue-100 text-blue-700 hover:border-blue-300" },
          { href: "/student/results",   label: "Results",   color: "bg-purple-50 border-purple-100 text-purple-700 hover:border-purple-300" },
          { href: "/student/profile",   label: "My Profile", color: "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className={`border rounded-xl p-4 text-sm font-semibold text-center transition-all ${q.color}`}>
            {q.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub: string; color: string; icon: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    green:  "bg-green-50 border-green-100 text-green-700",
    red:    "bg-red-50 border-red-100 text-red-700",
    amber:  "bg-amber-50 border-amber-100 text-amber-700",
    slate:  "bg-slate-50 border-slate-200 text-slate-600",
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[color] ?? styles.slate}`}>
      <div className="mb-2 opacity-70">{icon}</div>
      <p className="text-xs font-medium opacity-70 mb-0.5">{label}</p>
      <p className="text-xl font-bold leading-tight">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}
