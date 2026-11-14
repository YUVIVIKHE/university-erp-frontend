"use client";

import { useEffect, useMemo, useState } from "react";
import { api, SubjectData } from "@/lib/api";

type RegistrationState = {
  academicYear: string;
  termName: string;
  semester: number;
  studentId: string;
  rollNumber: string;
  course: string;
  department: string;
  division: string;
  registrationDate: string;
  registrationDeadline: string;
  status: string;
  approvalStatus: string;
  approvalRemarks: string | null;
  registrationReceipt: string;
  selectedSubjects: string[];
  availableSubjects: SubjectData[];
  totalCredits: number;
};

export default function RegistrationClient() {
  const [state, setState] = useState<RegistrationState | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.studentPortal.registration()
      .then((payload) => {
        setState(payload);
        setSelected(payload.selectedSubjects);
      })
      .catch((err) => {
        setError((err as { message?: string })?.message ?? "Failed to fetch registration details.");
      })
      .finally(() => setLoading(false));
  }, []);

  const totalCredits = useMemo(
    () => (state?.availableSubjects ?? []).reduce((sum, subject) => {
      if (selected.includes(subject.subjectCode)) return sum + (subject.credits ?? 0);
      return sum;
    }, 0),
    [selected, state]
  );

  async function handleSubmit() {
    if (!state || selected.length === 0) {
      setError("Select at least one subject before submitting.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = await api.studentPortal.submitRegistration(selected);
      setState((prev) => ({
        ...(prev ?? payload),
        ...payload,
        availableSubjects: prev?.availableSubjects ?? payload.availableSubjects ?? [],
      }));
      setSuccess(`Registration submitted successfully. Receipt: ${payload.registrationReceipt}`);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Failed to submit registration.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error && !state) return <div className="p-8 text-red-500 text-sm">{error}</div>;

  const availableSubjects = state?.availableSubjects ?? [];

  return (
    <div className="p-5 md:p-7 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Term Registration</h1>
        <p className="text-slate-400 text-sm mt-1">Register your selected subjects for the upcoming term</p>
      </div>

      {state && (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-indigo-100 text-xs uppercase tracking-wide">Academic year</p>
              <p className="text-xl font-bold mt-1">{state.academicYear}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-indigo-100 text-xs uppercase tracking-wide">Receipt</p>
              <p className="font-mono text-sm mt-1">{state.registrationReceipt}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {state && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatCard label="Semester" value={`Sem ${state.semester}`} />
          <StatCard label="Course" value={state.course} />
          <StatCard label="Selected" value={`${selected.length}`} />
          <StatCard label="Credits" value={`${totalCredits}`} />
        </div>
      )}

      {state && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Registration Summary</p>
              <p className="text-xs text-slate-400">Deadline: {state.registrationDeadline}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${state.status === "SUBMITTED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {state.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <InfoRow label="Student ID" value={state.studentId} />
            <InfoRow label="Roll Number" value={state.rollNumber} />
            <InfoRow label="Department" value={state.department} />
            <InfoRow label="Division" value={state.division} />
            <InfoRow label="Registration date" value={state.registrationDate} />
            <InfoRow label="Approval Status" value={state.approvalStatus} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Available Subjects</h2>
            <p className="text-xs text-slate-400">Choose the subjects you want to register for this term.</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || selected.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Submitting…" : "Submit Registration"}
          </button>
        </div>

        {availableSubjects.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No subjects are available for your current semester.</div>
        ) : (
          <div className="space-y-3">
            {availableSubjects.map((subject) => {
              const checked = selected.includes(subject.subjectCode);
              return (
                <label
                  key={subject.id}
                  className={`flex items-start gap-3 cursor-pointer rounded-xl border p-4 transition-all ${checked ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-slate-50/60 hover:border-slate-300"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelected((current) =>
                        current.includes(subject.subjectCode)
                          ? current.filter((code) => code !== subject.subjectCode)
                          : [...current, subject.subjectCode]
                      )
                    }
                    className="mt-1 h-4 w-4 accent-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{subject.name}</p>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">{subject.subjectCode}</p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
                        {subject.credits ?? 0} credits
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      <span className="bg-slate-200 px-2 py-0.5 rounded-full">{subject.type}</span>
                      <span>Sem {subject.semester}</span>
                      <span>{subject.facultyName ?? "Faculty TBD"}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
