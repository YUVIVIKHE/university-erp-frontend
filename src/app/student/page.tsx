"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, StudentData, ExamResultData, FeeData } from "@/lib/api";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<StudentData | null>(null);
  const [results, setResults] = useState<ExamResultData[]>([]);
  const [attendance, setAttendance] = useState<{ subjectCode: string; subjectName: string; total: number; present: number }[]>([]);
  const [fees, setFees] = useState<FeeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.studentPortal.me(),
      api.studentPortal.results(),
      api.studentPortal.attendance(),
      api.studentPortal.fees(),
    ]).then(([p, r, a, f]) => {
      setProfile(p);
      setResults(r);
      setAttendance(a);
      setFees(f);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading…</div>;
  if (!profile) return <div className="p-8 text-red-500 text-sm">Could not load profile.</div>;

  const passedCount = results.filter((r) => r.isPass === true).length;
  const pendingFees = fees.filter((f) => f.status === "PENDING" || f.status === "PARTIAL" || f.status === "OVERDUE");
  const totalAttendance = attendance.reduce((s, a) => s + a.total, 0);
  const presentCount = attendance.reduce((s, a) => s + a.present, 0);
  const overallAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <p className="text-indigo-100 text-sm mb-1">Welcome back,</p>
        <h1 className="text-2xl font-bold mb-1">{profile.fullName}</h1>
        <p className="text-indigo-200 text-sm">{profile.program} · Semester {profile.semester} · Batch {profile.batchYear}</p>
        <div className="mt-4 inline-block bg-white/20 backdrop-blur rounded-lg px-3 py-1.5">
          <span className="font-mono text-sm font-semibold">{profile.rollNumber}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Exam Results" value={`${passedCount} / ${results.length}`} sub="passed" color="indigo" />
        <StatCard
          label="Attendance"
          value={overallAttendance !== null ? `${overallAttendance}%` : "—"}
          sub={`${presentCount} / ${totalAttendance} classes`}
          color={overallAttendance !== null && overallAttendance < 75 ? "red" : "green"}
        />
        <StatCard label="Fee Due" value={`₹${pendingFees.reduce((s, f) => s + (f.amount - f.amountPaid), 0).toLocaleString()}`} sub={`${pendingFees.length} pending`} color={pendingFees.length > 0 ? "amber" : "green"} />
        <StatCard label="Semester" value={String(profile.semester)} sub={profile.program} color="slate" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickCard href="/student/results" title="View Results" desc="Check your exam marks and grades" icon="📄" />
        <QuickCard href="/student/attendance" title="Attendance" desc="Subject-wise attendance summary" icon="📋" />
        <QuickCard href="/student/fees" title="Fee Details" desc="View and track fee payments" icon="💳" />
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Info label="Roll Number" value={profile.rollNumber} />
          <Info label="Email" value={profile.email} />
          <Info label="Program" value={profile.program} />
          <Info label="Batch Year" value={String(profile.batchYear)} />
          {profile.phone && <Info label="Phone" value={profile.phone} />}
          {profile.guardianName && <Info label="Guardian" value={profile.guardianName} />}
          {profile.enrollmentDate && <Info label="Enrolled" value={profile.enrollmentDate} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const bg: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl p-4 ${bg[color] ?? bg.slate}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  );
}

function QuickCard({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all group">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{title}</p>
      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700 font-medium">{value}</p>
    </div>
  );
}
