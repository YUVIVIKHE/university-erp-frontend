"use client";

import { useEffect, useState } from "react";
import { api, ExamResultData } from "@/lib/api";

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-green-100 text-green-700",
  "A":  "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  "B":  "bg-blue-100 text-blue-700",
  "C+": "bg-yellow-100 text-yellow-700",
  "C":  "bg-yellow-100 text-yellow-700",
  "D":  "bg-orange-100 text-orange-700",
  "F":  "bg-red-100 text-red-700",
};

export default function StudentResultsPage() {
  const [results, setResults] = useState<ExamResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSemester, setFilterSemester] = useState<string>("");

  useEffect(() => {
    api.studentPortal.results()
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const semesters = [...new Set(results.map((r) => r.semester))].sort((a, b) => a - b);
  const filtered = filterSemester ? results.filter((r) => String(r.semester) === filterSemester) : results;

  const passCount = filtered.filter((r) => r.isPass === true && !r.isAbsent).length;
  const failCount = filtered.filter((r) => r.isPass === false && !r.isAbsent).length;
  const absentCount = filtered.filter((r) => r.isAbsent).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Exam Results</h1>
        <p className="text-slate-400 text-sm mt-1">Your marks and grades across all semesters</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{passCount}</p>
          <p className="text-xs text-green-600 mt-0.5">Passed</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{failCount}</p>
          <p className="text-xs text-red-600 mt-0.5">Failed</p>
        </div>
        <div className="bg-slate-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-600">{absentCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Absent</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Semesters</option>
          {semesters.map((s) => (
            <option key={s} value={String(s)}>Semester {s}</option>
          ))}
        </select>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading results…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No results found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Exam", "Subject", "Sem", "Marks", "Grade", "Result"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{r.examTitle}</p>
                    <p className="text-slate-400 text-xs">{r.examType}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{r.examCode}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{r.semester}</td>
                  <td className="px-4 py-3">
                    {r.isAbsent ? (
                      <span className="text-slate-400 text-xs">Absent</span>
                    ) : (
                      <span className="text-slate-700 text-sm font-medium">
                        {r.marksObtained ?? "—"} / {r.totalMarks}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.grade ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${GRADE_COLORS[r.grade] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.grade}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.isAbsent ? (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">Absent</span>
                    ) : r.isPass === null ? (
                      <span className="text-slate-300 text-xs">—</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.isPass ? "PASS" : "FAIL"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
