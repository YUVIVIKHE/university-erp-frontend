"use client";

import { useEffect, useState } from "react";
import { api, StudentData, SubjectData } from "@/lib/api";

const TYPE_COLORS: Record<string, string> = {
  THEORY:    "bg-blue-100 text-blue-700",
  PRACTICAL: "bg-purple-100 text-purple-700",
  LAB:       "bg-purple-100 text-purple-700",
  ELECTIVE:  "bg-amber-100 text-amber-700",
  PROJECT:   "bg-green-100 text-green-700",
};

export default function StudentSubjectsPage() {
  const [profile, setProfile] = useState<StudentData | null>(null);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSem, setSelectedSem] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.studentPortal.me(),
      api.studentPortal.subjects(),
    ]).then(([p, res]) => {
      setProfile(p);
      setSubjects(res.content);
    }).catch((err) => {
      setError((err as { message?: string })?.message ?? "Failed to load subjects.");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (profile && selectedSem === null) setSelectedSem(profile.semester);
  }, [profile, selectedSem]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="p-8 text-red-500 text-sm">{error}</div>;

  const allSemesters = [...new Set(subjects.map((s) => s.semester))].sort((a, b) => a - b);
  const filtered = selectedSem !== null ? subjects.filter((s) => s.semester === selectedSem) : subjects;

  const totalCredits = filtered.reduce((s, sub) => s + (sub.credits ?? 0), 0);

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Subjects</h1>
          <p className="text-slate-400 text-sm mt-1">{profile?.program} &nbsp;·&nbsp; All semesters</p>
        </div>
        {selectedSem !== null && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Credits</p>
            <p className="text-2xl font-bold text-indigo-600">{totalCredits}</p>
          </div>
        )}
      </div>

      {/* Semester tabs */}
      <div className="flex gap-2 flex-wrap">
        {allSemesters.map((sem) => (
          <button
            key={sem}
            onClick={() => setSelectedSem(sem)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              selectedSem === sem
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            Semester {sem}
            {sem === profile?.semester && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${selectedSem === sem ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-600"}`}>
                Current
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Subject cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No subjects found for Semester {selectedSem}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{sub.name}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{sub.subjectCode}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0 ${TYPE_COLORS[sub.type] ?? "bg-slate-100 text-slate-600"}`}>
                  {sub.type}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span className="font-semibold text-indigo-600">{sub.credits} Credits</span>
                </span>
                <span>Sem {sub.semester} · Year {sub.year}</span>
              </div>

              {sub.facultyName && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{sub.facultyName}</span>
                </div>
              )}

              {sub.description && (
                <p className="mt-2 text-xs text-slate-400 line-clamp-2">{sub.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
