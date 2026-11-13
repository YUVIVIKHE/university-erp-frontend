"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser, isLoggedIn } from "@/lib/auth";
import { modulesApi, type AdminDashboard, inr, fmtDate, errorMessage } from "@/lib/admin/modules";
import { BarList, Badge, ErrorBanner, StatCard } from "@/components/admin/ui";

type User = NonNullable<ReturnType<typeof getUser>>;

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <svg className="w-6 h-6 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  </div>
);

const ACTION_LABELS: Record<string, string> = {
  USER_REGISTERED: "User registered", LOGIN_SUCCESS: "Signed in", USER_LOGIN: "Signed in",
  NOTICE_CREATED: "Notice published", NOTICE_UPDATED: "Notice edited", NOTICE_DELETED: "Notice deleted",
  LIBRARY_BOOK_CREATED: "Book added", LIBRARY_BOOK_UPDATED: "Book updated", LIBRARY_BOOK_DELETED: "Book removed",
  LIBRARY_BOOK_ISSUED: "Book issued", LIBRARY_BOOK_RETURNED: "Book returned",
  STUDENTS_BULK_IMPORTED: "Students imported", SETTINGS_UPDATED: "Settings updated",
  ADMIN_PASSWORD_CHANGED: "Admin password changed",
};
const actionLabel = (a: string) => ACTION_LABELS[a] ?? a.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return fmtDate(iso);
}

function AdminHome({ user }: { user: User }) {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    modulesApi.dashboard().then(setData).catch((e) => setError(errorMessage(e, "Could not load dashboard")));
  }, []);

  if (error) return <div className="max-w-6xl mx-auto"><ErrorBanner message={error} /></div>;
  if (!data) return <Spinner />;
  const { counts, fees, attendance, library } = data;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, {user.fullName.split(" ")[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">{data.institutionName} · Academic year {data.academicYear} · as of {fmtDate(data.asOf)}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/students/import" className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium">Import students</Link>
          <Link href="/dashboard/notices" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium">+ New notice</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Active students" value={counts.activeStudents} hint={`${counts.students} total enrolled`} tone="indigo" />
        <StatCard label="Faculty" value={counts.faculty} hint={`${counts.programs} programs · ${counts.courses} courses`} />
        <StatCard label="Pending admissions" value={counts.pendingAdmissions}
          hint={<Link href="/dashboard/admission" className="text-indigo-600 hover:underline">Review →</Link>}
          tone={counts.pendingAdmissions > 0 ? "amber" : "slate"} />
        <StatCard label="Attendance (30 days)" value={attendance.rate === null ? "—" : `${attendance.rate}%`}
          hint={attendance.marked === 0 ? "No attendance marked yet" : `${attendance.studentsBelowThreshold} students below ${attendance.threshold}%`}
          tone={attendance.rate !== null && attendance.rate < attendance.threshold ? "red" : "green"} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Fees collected" value={inr(fees.collected)} hint={`${fees.collectionRate}% of ${inr(fees.billed - fees.concessions)} due`} tone="green" />
        <StatCard label="Fees outstanding" value={inr(fees.outstanding)} hint={`${fees.overdueRecords} overdue records`} tone={fees.overdueRecords > 0 ? "red" : "slate"} />
        <StatCard label="Library" value={`${library.issued} issued`} hint={`${library.overdue} overdue · ${library.titles} titles`} tone={library.overdue > 0 ? "amber" : "slate"} />
        <StatCard label="Upcoming exams" value={counts.upcomingExams} hint={`${counts.activeNotices} active notices`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Attendance — last 14 days</h2>
          {data.attendanceTrend.every((d) => d.value === null) ? (
            <p className="text-sm text-slate-400 py-10 text-center">No attendance marked in the last 14 days</p>
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {data.attendanceTrend.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${d.label}: ${d.value ?? "no classes"}${d.value !== null ? "%" : ""}`}>
                  <span className="text-[10px] text-slate-500 mb-1 opacity-0 group-hover:opacity-100">{d.value ?? ""}</span>
                  <div className={`w-full rounded-t ${d.value === null ? "bg-slate-100" : d.value < attendance.threshold ? "bg-red-400" : "bg-indigo-500"}`}
                    style={{ height: `${d.value === null ? 4 : Math.max(4, d.value)}%` }} />
                  <span className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">{d.label.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Students by program</h2>
          <BarList data={data.studentsByProgram} empty="No students yet" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl">
          <div className="px-6 py-4 border-b border-slate-100"><h2 className="text-sm font-semibold text-gray-900">Recent activity</h2></div>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">No activity yet</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{actionLabel(a.action)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">by {a.actor}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming exams</h2>
              <Link href="/dashboard/exams" className="text-xs text-indigo-600 hover:underline">All exams</Link>
            </div>
            {data.upcomingExams.length === 0 ? (
              <p className="text-sm text-slate-400 p-6 text-center">No exams scheduled</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {data.upcomingExams.map((e) => (
                  <li key={e.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-800">{e.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(e.examDate)} · {e.startTime?.slice(0, 5)} · {e.program} S{e.semester}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Admissions</h2>
            {data.admissionsByStatus.length === 0 ? <p className="text-sm text-slate-400">No applications yet</p> : (
              <div className="flex flex-wrap gap-2">
                {data.admissionsByStatus.map((s) => (
                  <Badge key={s.label} tone={s.label === "APPROVED" ? "green" : s.label === "REJECTED" ? "red" : "amber"}>
                    {s.label.toLowerCase()} · {s.value}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FacultyHome({ user }: { user: User }) {
  const links = [
    { label: "Mark attendance", href: "/dashboard/attendance", sub: "Record today's classes" },
    { label: "Exams & results", href: "/dashboard/exams", sub: "Schedule exams and enter marks" },
    { label: "Timetable", href: "/dashboard/timetable", sub: "View class schedules" },
    { label: "Students", href: "/dashboard/students", sub: "Look up student records" },
    { label: "Subjects", href: "/dashboard/academics/subjects", sub: "Subjects and credits" },
  ];
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, {user.fullName.split(" ")[0]}</h1>
      <p className="text-gray-500 text-sm mt-1 mb-8">{user.email}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-sm transition">
            <p className="font-semibold text-slate-800">{l.label}</p>
            <p className="text-xs text-slate-400 mt-1">{l.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    const u = getUser();
    if (u?.role === "ACCOUNTANT") { router.replace("/accountant"); return; }
    if (u?.role === "STUDENT") { router.replace("/student"); return; }
    setUser(u);
  }, [router]);

  if (!user) return <Spinner />;
  return user.role === "ADMIN" ? <AdminHome user={user} /> : <FacultyHome user={user} />;
}
