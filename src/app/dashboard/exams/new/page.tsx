"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, SubjectData } from "@/lib/api";
import { useProgramCourse } from "@/hooks/useProgramCourse";

const EXAM_TYPES = ["MIDTERM", "FINAL", "INTERNAL", "PRACTICAL", "VIVA", "ASSIGNMENT"];

export default function NewExamPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<SubjectData[]>([]);

  const [form, setForm] = useState({
    title: "",
    examType: "MIDTERM",
    program: "",
    course: "",
    semester: "1",
    academicYear: "",
    examDate: "",
    startTime: "09:00",
    endTime: "12:00",
    venue: "",
    totalMarks: "100",
    passingMarks: "40",
    subjectId: "",
    status: "SCHEDULED",
    instructions: "",
  });

  const { courses, programOptions, loadingPrograms, loadingCourses } = useProgramCourse(form.program);

  useEffect(() => {
    if (form.program) {
      api.subjects.list("", form.program, Number(form.semester) || undefined, undefined, "ACTIVE", 0)
        .then((res) => setSubjects(res.content))
        .catch(() => {});
    } else {
      setSubjects([]);
    }
  }, [form.program, form.semester]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title || !form.program || !form.course || !form.examDate || !form.academicYear) {
      setError("Title, program, course, academic year and exam date are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.exams.create({
        title: form.title.trim(),
        examType: form.examType,
        program: form.program.trim(),
        course: form.course.trim(),
        semester: Number(form.semester),
        academicYear: form.academicYear.trim(),
        examDate: form.examDate,
        startTime: form.startTime,
        endTime: form.endTime,
        venue: form.venue || null,
        totalMarks: Number(form.totalMarks),
        passingMarks: Number(form.passingMarks),
        subjectId: form.subjectId ? Number(form.subjectId) : null,
        status: form.status,
        instructions: form.instructions || null,
      });
      router.push(`/dashboard/exams/${res.id}`);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to schedule exam.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/exams" className="text-indigo-600 text-sm hover:underline">← Back to Exams</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Schedule New Exam</h1>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Exam Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Exam Title <span className="text-red-500">*</span></label>
              <input type="text" required value={form.title} onChange={(e) => set("title", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Mid-Term Examination – Data Structures" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Exam Type</label>
              <select value={form.examType} onChange={(e) => set("examType", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Academic */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Academic Scope</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Program <span className="text-red-500">*</span></label>
              <select required value={form.program}
                disabled={loadingPrograms}
                onChange={(e) => { set("program", e.target.value); set("course", ""); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">{loadingPrograms ? "Loading…" : "— Select program —"}</option>
                {programOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Course <span className="text-red-500">*</span></label>
              <select required value={form.course}
                disabled={!form.program || loadingCourses}
                onChange={(e) => set("course", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">
                  {!form.program ? "Select a program first" : loadingCourses ? "Loading…" : courses.length === 0 ? "No courses found" : "— Select course —"}
                </option>
                {courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Semester</label>
              <select value={form.semester} onChange={(e) => set("semester", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Academic Year <span className="text-red-500">*</span></label>
              <input type="text" required value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="2024-25" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject (optional)</label>
              <select value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">— Select subject —</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.subjectCode} · {s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Schedule & Venue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Exam Date <span className="text-red-500">*</span></label>
              <input type="date" required value={form.examDate} onChange={(e) => set("examDate", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Venue</label>
              <input type="text" value={form.venue} onChange={(e) => set("venue", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Hall A, Block 2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>

        {/* Marks */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Marks Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Total Marks <span className="text-red-500">*</span></label>
              <input type="number" min="1" required value={form.totalMarks} onChange={(e) => set("totalMarks", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Passing Marks <span className="text-red-500">*</span></label>
              <input type="number" min="0" required value={form.passingMarks} onChange={(e) => set("passingMarks", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Instructions</label>
              <textarea rows={3} value={form.instructions} onChange={(e) => set("instructions", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                placeholder="Bring college ID, blue pen…" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? "Scheduling…" : "Schedule Exam"}
          </button>
          <Link href="/dashboard/exams"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
