"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ExamScheduleData, ExamResultData, SubjectData } from "@/lib/api";
import { useProgramCourse } from "@/hooks/useProgramCourse";

const EXAM_TYPES = ["MIDTERM", "FINAL", "INTERNAL", "PRACTICAL", "VIVA", "ASSIGNMENT"];
const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ONGOING:   "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

type EditForm = {
  title: string; examType: string; program: string; course: string; semester: string;
  academicYear: string; examDate: string; startTime: string; endTime: string;
  venue: string; totalMarks: string; passingMarks: string; subjectId: string;
  status: string; instructions: string;
};

function toEditForm(e: ExamScheduleData): EditForm {
  return {
    title: e.title, examType: e.examType, program: e.program, course: e.course,
    semester: String(e.semester), academicYear: e.academicYear,
    examDate: e.examDate, startTime: e.startTime?.substring(0, 5) ?? "09:00",
    endTime: e.endTime?.substring(0, 5) ?? "12:00",
    venue: e.venue ?? "", totalMarks: String(e.totalMarks), passingMarks: String(e.passingMarks),
    subjectId: e.subjectId ? String(e.subjectId) : "", status: e.status,
    instructions: e.instructions ?? "",
  };
}

export default function ExamDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<ExamScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "results">("details");
  const { courses: editCourses, programOptions, loadingPrograms, loadingCourses } = useProgramCourse(form?.program ?? "");

  useEffect(() => {
    setLoading(true);
    api.exams.get(Number(id))
      .then((d) => { setExam(d); setLoading(false); })
      .catch(() => { setError("Exam not found."); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (exam && form?.program) {
      api.subjects.list("", form.program, Number(form.semester) || undefined, undefined, "ACTIVE", 0)
        .then((res) => setSubjects(res.content))
        .catch(() => {});
    }
  }, [form?.program, form?.semester]);

  function startEdit() { if (exam) { setForm(toEditForm(exam)); setEditing(true); } }
  function cancelEdit() { setEditing(false); setForm(null); setError(""); }

  async function saveEdit() {
    if (!form || !exam) return;
    setSaving(true); setError("");
    try {
      const updated = await api.exams.update(exam.id, {
        title: form.title.trim(), examType: form.examType, program: form.program.trim(),
        course: form.course.trim(), semester: Number(form.semester), academicYear: form.academicYear.trim(),
        examDate: form.examDate, startTime: form.startTime, endTime: form.endTime,
        venue: form.venue || null, totalMarks: Number(form.totalMarks),
        passingMarks: Number(form.passingMarks),
        subjectId: form.subjectId ? Number(form.subjectId) : null,
        status: form.status, instructions: form.instructions || null,
      });
      setExam(updated); setEditing(false); setForm(null);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Save failed.");
    } finally { setSaving(false); }
  }

  function setF(field: keyof EditForm, value: string) {
    setForm((f) => f ? { ...f, [field]: value } : f);
  }

  if (loading) return <div className="p-12 text-center text-slate-400">Loading…</div>;
  if (!exam && error) return <div className="p-12 text-center text-red-500">{error}</div>;
  if (!exam) return null;

  return (
    <div className="w-full p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/exams" className="text-indigo-600 text-sm hover:underline">← Back to Exams</Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">{exam.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-slate-500 text-sm font-mono">{exam.examCode}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[exam.status] ?? "bg-slate-100 text-slate-600"}`}>
              {exam.status}
            </span>
          </div>
        </div>
        {!editing && (
          <div className="flex gap-2">
            <button onClick={startEdit}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Edit
            </button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {/* Tabs */}
      {!editing && (
        <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
          {(["details", "results"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab === "results" ? "Results / Mark Entry" : "Details"}
            </button>
          ))}
        </div>
      )}

      {/* Details View */}
      {!editing && activeTab === "details" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Academic Scope</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <Field label="Program" value={exam.program} />
              <Field label="Course" value={exam.course} />
              <Field label="Semester" value={String(exam.semester)} />
              <Field label="Academic Year" value={exam.academicYear} />
              <Field label="Exam Type" value={exam.examType} />
              <Field label="Subject" value={exam.subjectName ?? "—"} />
              <Field label="Subject Code" value={exam.subjectCode ?? "—"} mono />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Schedule</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <Field label="Date" value={exam.examDate} />
              <Field label="Time" value={`${exam.startTime} – ${exam.endTime}`} />
              <Field label="Venue" value={exam.venue ?? "—"} />
              <Field label="Total Marks" value={String(exam.totalMarks)} />
              <Field label="Passing Marks" value={String(exam.passingMarks)} />
              <Field label="Scheduled By" value={exam.createdByName ?? "—"} />
            </div>
          </div>

          {exam.instructions && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Instructions</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{exam.instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Form */}
      {editing && form && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Exam Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField label="Title" required>
                  <input type="text" value={form.title} onChange={(e) => setF("title", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </FormField>
              </div>
              <FormField label="Exam Type">
                <select value={form.examType} onChange={(e) => setF("examType", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={(e) => setF("status", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </FormField>
              <FormField label="Program" required>
                <select value={form.program} disabled={loadingPrograms}
                  onChange={(e) => { setF("program", e.target.value); setF("course", ""); }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">{loadingPrograms ? "Loading…" : "— Select program —"}</option>
                  {programOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="Course" required>
                <select value={form.course} disabled={!form.program || loadingCourses}
                  onChange={(e) => setF("course", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
                  <option value="">
                    {!form.program ? "Select a program first" : loadingCourses ? "Loading…" : editCourses.length === 0 ? "No courses found" : "— Select course —"}
                  </option>
                  {editCourses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Semester">
                <select value={form.semester} onChange={(e) => setF("semester", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </FormField>
              <FormField label="Academic Year" required>
                <input type="text" value={form.academicYear} onChange={(e) => setF("academicYear", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="2024-25" />
              </FormField>
              <FormField label="Subject">
                <select value={form.subjectId} onChange={(e) => setF("subjectId", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">— None —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.subjectCode} · {s.name}</option>)}
                </select>
              </FormField>
              <FormField label="Exam Date" required>
                <input type="date" value={form.examDate} onChange={(e) => setF("examDate", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Start Time">
                <input type="time" value={form.startTime} onChange={(e) => setF("startTime", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="End Time">
                <input type="time" value={form.endTime} onChange={(e) => setF("endTime", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Venue">
                <input type="text" value={form.venue} onChange={(e) => setF("venue", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Total Marks">
                <input type="number" value={form.totalMarks} onChange={(e) => setF("totalMarks", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Passing Marks">
                <input type="number" value={form.passingMarks} onChange={(e) => setF("passingMarks", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Instructions" className="md:col-span-2">
                <textarea rows={3} value={form.instructions} onChange={(e) => setF("instructions", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </FormField>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveEdit} disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={cancelEdit}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {!editing && activeTab === "results" && <ResultsPanel examId={exam.id} totalMarks={exam.totalMarks} passingMarks={exam.passingMarks} program={exam.program} semester={exam.semester} />}
    </div>
  );
}

// ── Results Panel ────────────────────────────────────────────────────────────

type StudentEntry = { studentId: number; rollNumber: string; name: string; marksObtained: string; isAbsent: boolean; remarks: string; existing?: ExamResultData };

function ResultsPanel({ examId, totalMarks, passingMarks, program, semester }: {
  examId: number; totalMarks: number; passingMarks: number; program: string; semester: number;
}) {
  const [results, setResults] = useState<ExamResultData[]>([]);
  const [entries, setEntries] = useState<StudentEntry[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load existing results
    api.exams.getResults(examId)
      .then((r) => { setResults(r); setLoadingResults(false); })
      .catch(() => setLoadingResults(false));

    // Load eligible students
    api.students.list("", program, true, 0)
      .then((res) => {
        const students = res.content.filter((s) => s.semester === semester);
        setEntries(students.map((s) => ({
          studentId: s.id, rollNumber: s.rollNumber, name: s.fullName,
          marksObtained: "", isAbsent: false, remarks: "",
        })));
        setLoadingStudents(false);
      })
      .catch(() => setLoadingStudents(false));
  }, [examId, program, semester]);

  // Merge existing results into entries
  useEffect(() => {
    if (results.length === 0 || entries.length === 0) return;
    setEntries((prev) => prev.map((e) => {
      const existing = results.find((r) => r.studentId === e.studentId);
      if (!existing) return e;
      return {
        ...e,
        marksObtained: existing.isAbsent ? "" : String(existing.marksObtained ?? ""),
        isAbsent: existing.isAbsent,
        remarks: existing.remarks ?? "",
        existing,
      };
    }));
  }, [results]);

  function updateEntry(idx: number, field: keyof StudentEntry, value: unknown) {
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const payload = entries.map((e) => ({
        studentId: e.studentId,
        marksObtained: !e.isAbsent && e.marksObtained !== "" ? Number(e.marksObtained) : undefined,
        isAbsent: e.isAbsent,
        remarks: e.remarks || undefined,
      }));
      const updated = await api.exams.saveResults(examId, payload);
      setResults(updated);
      setSaved(true);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to save results.");
    } finally { setSaving(false); }
  }

  const gradeColor: Record<string, string> = {
    O: "text-green-700 font-bold", "A+": "text-green-600 font-semibold",
    A: "text-blue-600", "B+": "text-blue-500", B: "text-slate-600",
    C: "text-yellow-600", F: "text-red-600 font-bold", AB: "text-slate-400 italic",
  };

  if (loadingResults || loadingStudents)
    return <div className="p-8 text-center text-slate-400">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {entries.length} students eligible · Pass mark: {passingMarks}/{totalMarks}
        </p>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-xs font-medium">✓ Saved</span>}
          {error && <span className="text-red-600 text-xs">{error}</span>}
          <button onClick={handleSave} disabled={saving || entries.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Save Results"}
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
          No students found in Semester {semester} of {program}.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Roll No.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Marks /{totalMarks}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Absent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Grade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Result</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e, idx) => {
                const existing = e.existing;
                const grade = existing?.grade ?? null;
                return (
                  <tr key={e.studentId} className={`${e.isAbsent ? "bg-slate-50" : ""} hover:bg-indigo-50/30 transition-colors`}>
                    <td className="px-4 py-2 font-mono text-xs font-semibold text-indigo-700">{e.rollNumber}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{e.name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number" min="0" max={totalMarks} step="0.5"
                        disabled={e.isAbsent}
                        value={e.isAbsent ? "" : e.marksObtained}
                        onChange={(ev) => updateEntry(idx, "marksObtained", ev.target.value)}
                        className="w-20 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-100 disabled:text-slate-400"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={e.isAbsent}
                        onChange={(ev) => updateEntry(idx, "isAbsent", ev.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer" />
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-sm ${grade ? gradeColor[grade] ?? "text-slate-600" : "text-slate-300"}`}>
                        {grade ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {existing ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          existing.isAbsent ? "bg-slate-100 text-slate-500" :
                          existing.isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {existing.isAbsent ? "ABSENT" : existing.isPass ? "PASS" : "FAIL"}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={e.remarks}
                        onChange={(ev) => updateEntry(idx, "remarks", ev.target.value)}
                        className="w-32 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="optional" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono, className }: { label: string; value?: string | null; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className={`text-sm ${mono ? "font-mono text-indigo-700" : "text-slate-800"}`}>
        {value ?? <span className="text-slate-300">—</span>}
      </p>
    </div>
  );
}

function FormField({ label, required, className, children }: {
  label: string; required?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
