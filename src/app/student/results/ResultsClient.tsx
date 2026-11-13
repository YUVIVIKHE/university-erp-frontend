"use client";

import { useEffect, useState } from "react";
import { api, ExamResultData } from "@/lib/api";

const GRADE_COLORS: Record<string, string> = {
  "O":  "bg-emerald-100 text-emerald-700",
  "A+": "bg-green-100 text-green-700",
  "A":  "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  "B":  "bg-blue-100 text-blue-700",
  "C+": "bg-yellow-100 text-yellow-700",
  "C":  "bg-yellow-100 text-yellow-700",
  "D":  "bg-orange-100 text-orange-700",
  "F":  "bg-red-100 text-red-700",
};

const EXAM_TYPE_COLORS: Record<string, string> = {
  MIDTERM:    "bg-indigo-100 text-indigo-600",
  FINAL:      "bg-purple-100 text-purple-700",
  INTERNAL:   "bg-teal-100 text-teal-700",
  PRACTICAL:  "bg-cyan-100 text-cyan-700",
  VIVA:       "bg-pink-100 text-pink-700",
  ASSIGNMENT: "bg-orange-100 text-orange-600",
};

export default function StudentResultsPage() {
  const [results, setResults] = useState<ExamResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSem, setActiveSem] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.studentPortal.results()
      .then(setResults)
      .catch((err) => setError((err as { message?: string })?.message ?? "Failed to load results."))
      .finally(() => setLoading(false));
  }, []);

  const semesters = [...new Set(results.map((r) => r.semester))].sort((a, b) => a - b);

  useEffect(() => {
    if (semesters.length > 0 && activeSem === null) setActiveSem(semesters[semesters.length - 1]);
  }, [semesters.length]);

  const semResults = activeSem !== null ? results.filter((r) => r.semester === activeSem) : results;
  const passCount = semResults.filter((r) => r.isPass === true && !r.isAbsent).length;
  const failCount = semResults.filter((r) => r.isPass === false && !r.isAbsent).length;
  const absentCount = semResults.filter((r) => r.isAbsent).length;

  // Average marks % for graded results
  const graded = semResults.filter((r) => !r.isAbsent && r.marksObtained !== null && r.totalMarks > 0);
  const avgPct = graded.length > 0
    ? Math.round(graded.reduce((s, r) => s + (r.marksObtained! / r.totalMarks) * 100, 0) / graded.length)
    : null;

  // Group by exam type within semester
  const byType = semResults.reduce<Record<string, ExamResultData[]>>((acc, r) => {
    const key = r.examType;
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="p-8 text-red-500 text-sm">{error}</div>;

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Exam Results</h1>
        <p className="text-slate-400 text-sm mt-1">Your marks, grades and performance across all semesters</p>
      </div>

      {/* Semester tabs */}
      {semesters.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {semesters.map((sem) => (
            <button
              key={sem}
              onClick={() => setActiveSem(sem)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeSem === sem
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {semResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{passCount}</p>
            <p className="text-xs text-green-600 mt-0.5">Passed</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{failCount}</p>
            <p className="text-xs text-red-500 mt-0.5">Failed</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-500">{absentCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Absent</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-700">{avgPct !== null ? `${avgPct}%` : "—"}</p>
            <p className="text-xs text-indigo-500 mt-0.5">Avg Score</p>
          </div>
        </div>
      )}

      {/* Results grouped by exam type */}
      {semResults.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No results for Semester {activeSem} yet.
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(byType).map(([type, typeResults]) => (
            <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Type header */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${EXAM_TYPE_COLORS[type] ?? "bg-slate-100 text-slate-600"}`}>
                  {type}
                </span>
                <span className="text-xs text-slate-400">{typeResults.length} result{typeResults.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Results */}
              <div className="divide-y divide-slate-100">
                {typeResults.map((r) => {
                  const pct = !r.isAbsent && r.marksObtained !== null && r.totalMarks > 0
                    ? Math.round((r.marksObtained / r.totalMarks) * 100) : null;
                  return (
                    <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                      {/* Score circle */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                        r.isAbsent ? "bg-slate-100 text-slate-400" :
                        r.isPass === false ? "bg-red-100 text-red-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {r.isAbsent ? "AB" : pct !== null ? `${pct}%` : "—"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{r.examTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400">{r.examDate}</span>
                          {r.examCode && <span className="text-xs font-mono text-slate-400">{r.examCode}</span>}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        {r.isAbsent ? (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Absent</span>
                        ) : (
                          <>
                            <p className="text-base font-bold text-slate-800">
                              {r.marksObtained ?? "—"}<span className="text-slate-400 text-xs font-normal">/{r.totalMarks}</span>
                            </p>
                            <div className="flex items-center gap-1.5 justify-end">
                              {r.grade && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${GRADE_COLORS[r.grade] ?? "bg-slate-100 text-slate-600"}`}>
                                  {r.grade}
                                </span>
                              )}
                              {r.isPass !== null && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {r.isPass ? "PASS" : "FAIL"}
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

              {/* Type summary footer */}
              {typeResults.filter((r) => !r.isAbsent && r.marksObtained !== null).length > 1 && (
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {typeResults.filter((r) => r.isPass === true).length}/{typeResults.length} passed
                  </span>
                  {(() => {
                    const g = typeResults.filter((r) => !r.isAbsent && r.marksObtained !== null && r.totalMarks > 0);
                    if (g.length === 0) return null;
                    const avg = Math.round(g.reduce((s, r) => s + (r.marksObtained! / r.totalMarks) * 100, 0) / g.length);
                    return <span>Average: <span className="font-semibold text-slate-700">{avg}%</span></span>;
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
