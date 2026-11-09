"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  total: number;
  present: number;
  absent: number;
}

export default function StudentAttendancePage() {
  const [data, setData] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.studentPortal.attendance()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPresent = data.reduce((s, r) => s + r.present, 0);
  const totalClasses = data.reduce((s, r) => s + r.total, 0);
  const overall = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
        <p className="text-slate-400 text-sm mt-1">Subject-wise attendance summary</p>
      </div>

      {/* Overall */}
      {overall !== null && (
        <div className={`rounded-xl p-5 ${overall >= 75 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${overall >= 75 ? "text-green-700" : "text-red-700"}`}>Overall Attendance</p>
              <p className={`text-3xl font-bold mt-1 ${overall >= 75 ? "text-green-800" : "text-red-800"}`}>{overall}%</p>
              <p className={`text-xs mt-1 ${overall >= 75 ? "text-green-600" : "text-red-600"}`}>
                {totalPresent} present out of {totalClasses} classes
              </p>
            </div>
            <div className={`text-5xl font-black opacity-20 ${overall >= 75 ? "text-green-600" : "text-red-600"}`}>
              {overall >= 75 ? "✓" : "!"}
            </div>
          </div>
          {overall < 75 && (
            <p className="text-xs text-red-600 mt-3 bg-red-100 rounded-lg px-3 py-2">
              Your attendance is below 75%. You need to attend more classes to be eligible for exams.
            </p>
          )}
        </div>
      )}

      {/* Subject list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading attendance…</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No attendance records found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.map((s) => {
              const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
              const low = pct < 75;
              return (
                <div key={s.subjectCode} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{s.subjectName}</p>
                      <p className="text-slate-400 text-xs font-mono">{s.subjectCode}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${low ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {pct}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${low ? "bg-red-400" : "bg-green-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span className="text-green-600 font-medium">{s.present} present</span>
                    <span className="text-red-500">{s.absent} absent</span>
                    <span>{s.total} total</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
