"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ExamScheduleData } from "@/lib/api";
import { useProgramCourse } from "@/hooks/useProgramCourse";

const EXAM_TYPES = ["MIDTERM", "FINAL", "INTERNAL", "PRACTICAL", "VIVA", "ASSIGNMENT"];
const STATUSES   = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ONGOING:   "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [examType, setExamType] = useState("");
  const [status, setStatus] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const { programOptions, loadingPrograms } = useProgramCourse("");

  async function fetchExams() {
    setLoading(true);
    try {
      const res = await api.exams.list(search, program, undefined, examType, status, academicYear, page, 20);
      setExams(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchExams(); }, [search, program, examType, status, academicYear, page]);

  return (
    <div className="w-full p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exam Schedules</h1>
          <p className="text-slate-500 text-sm mt-1">Manage exams, schedules, and results</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">{totalElements} total</span>
          <Link href="/dashboard/exams/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            + Schedule Exam
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search title or exam code…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 min-w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select value={program} disabled={loadingPrograms}
          onChange={(e) => { setProgram(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44 disabled:bg-slate-50 disabled:text-slate-400">
          <option value="">{loadingPrograms ? "Loading…" : "All Programs"}</option>
          {programOptions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={examType} onChange={(e) => { setExamType(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Types</option>
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text" placeholder="Academic Year (e.g. 2024-25)" value={academicYear}
          onChange={(e) => { setAcademicYear(e.target.value); setPage(0); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-44"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading exams…</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-lg">No exams found</p>
            <p className="text-slate-400 text-sm mt-1">Schedule an exam to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Code", "Title", "Type", "Program", "Sem", "Date", "Subject", "Marks", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{e.examCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-48 truncate">{e.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{e.examType}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{e.program}</td>
                  <td className="px-4 py-3 text-slate-600">{e.semester}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{e.examDate}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.subjectName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{e.totalMarks}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[e.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link href={`/dashboard/exams/${e.id}`}
                      className="text-indigo-600 hover:underline text-xs font-medium">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page + 1} of {totalPages} · {totalElements} exams</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">← Prev</button>
              <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
