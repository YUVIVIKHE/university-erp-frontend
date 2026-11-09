"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, StudentData } from "@/lib/api";

function Row({ label, value, full }: { label: string; value?: string | number | null; full?: boolean }) {
  return (
    <div className={`flex items-start gap-2 py-1.5 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs text-gray-500 w-44 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-800 mb-3 pb-1.5 border-b border-gray-200">{title}</h3>
      <div className="grid grid-cols-2 gap-x-8">{children}</div>
    </div>
  );
}

const inp = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

type EditForm = {
  program: string; semester: string; batchYear: string;
  dateOfBirth: string; phone: string; address: string;
  guardianName: string; guardianPhone: string; isActive: boolean;
};

function toForm(s: StudentData): EditForm {
  return {
    program: s.program ?? "",
    semester: String(s.semester ?? ""),
    batchYear: String(s.batchYear ?? ""),
    dateOfBirth: s.dateOfBirth ?? "",
    phone: s.phone ?? "",
    address: s.address ?? "",
    guardianName: s.guardianName ?? "",
    guardianPhone: s.guardianPhone ?? "",
    isActive: s.isActive,
  };
}

export default function StudentDetailClient() {
  const { rollNumber } = useParams<{ rollNumber: string }>();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    api.students.get(rollNumber)
      .then(setStudent)
      .catch(() => setError("Student not found."))
      .finally(() => setLoading(false));
  }, [rollNumber]);

  function startEdit() {
    if (!student) return;
    setForm(toForm(student));
    setSaveError("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(null);
    setSaveError("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await api.students.update(rollNumber, {
        program: form.program,
        semester: Number(form.semester),
        batchYear: Number(form.batchYear),
        dateOfBirth: form.dateOfBirth || "",
        phone: form.phone,
        address: form.address,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        isActive: form.isActive,
      });
      setStudent(updated);
      setEditing(false);
      setForm(null);
    } catch (e) {
      setSaveError((e as { message?: string }).message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const set = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => f ? { ...f, [k]: e.target.value } : f);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="w-5 h-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );

  if (error || !student) return (
    <div className="text-center py-20 text-gray-500">{error ?? "Not found"}</div>
  );

  const initials = student.fullName.split(" ").map(n => n[0]).slice(0, 2).join("");

  return (
    <div className="w-full p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <Link href="/dashboard/students" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Student Profile</h1>
          <p className="text-gray-500 text-sm font-mono">{student.rollNumber}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
          student.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"
        }`}>
          {student.isActive ? "Active" : "Inactive"}
        </span>
        {!editing && (
          <>
            <button
              onClick={startEdit}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Print
            </button>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        {/* Profile header */}
        <div className="px-8 py-8 border-b border-gray-200">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{student.fullName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{student.email}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">Roll Number</p>
              <p className="font-mono font-semibold text-indigo-700 text-lg">{student.rollNumber}</p>
            </div>
          </div>
          {!editing && (
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { label: "Program", value: student.program },
                { label: "Semester", value: `Semester ${student.semester}` },
                { label: "Batch", value: student.batchYear },
                { label: "Enrolled", value: student.enrollmentDate },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-center min-w-[100px]">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && form ? (
          <form onSubmit={saveEdit} className="px-8 py-6 space-y-8">
            {saveError && (
              <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{saveError}</p>
            )}

            <section>
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-1.5 border-b border-gray-200">Academic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <label className="block text-xs font-medium text-gray-500">
                  Program <span className="text-red-500">*</span>
                  <input required maxLength={100} value={form.program} onChange={set("program")} className={inp} />
                </label>
                <label className="block text-xs font-medium text-gray-500">
                  Semester <span className="text-red-500">*</span>
                  <input required type="number" min={1} max={100} value={form.semester} onChange={set("semester")} className={inp} />
                </label>
                <label className="block text-xs font-medium text-gray-500">
                  Batch Year <span className="text-red-500">*</span>
                  <input required type="number" min={2000} max={2200} value={form.batchYear} onChange={set("batchYear")} className={inp} />
                </label>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-1.5 border-b border-gray-200">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <label className="block text-xs font-medium text-gray-500">
                  Date of Birth
                  <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inp} />
                </label>
                <label className="block text-xs font-medium text-gray-500">
                  Phone
                  <input maxLength={20} value={form.phone} onChange={set("phone")} className={inp} />
                </label>
              </div>
              <label className="block text-xs font-medium text-gray-500 mt-5">
                Address
                <textarea maxLength={1000} rows={3} value={form.address} onChange={set("address")}
                  className={`${inp} resize-none`} />
              </label>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-1.5 border-b border-gray-200">Guardian Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block text-xs font-medium text-gray-500">
                  Guardian Name
                  <input maxLength={255} value={form.guardianName} onChange={set("guardianName")} className={inp} />
                </label>
                <label className="block text-xs font-medium text-gray-500">
                  Guardian Phone
                  <input maxLength={20} value={form.guardianPhone} onChange={set("guardianPhone")} className={inp} />
                </label>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-800 mb-4 pb-1.5 border-b border-gray-200">Status</h3>
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => f ? { ...f, isActive: e.target.checked } : f)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Student is active</span>
              </label>
            </section>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={cancelEdit} disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          /* Read-only view */
          <div className="px-8 py-6 space-y-8">
            <Section title="1. Academic Information">
              <Row label="Roll Number"     value={student.rollNumber} />
              <Row label="Program"         value={student.program} />
              <Row label="Semester"        value={student.semester} />
              <Row label="Batch Year"      value={student.batchYear} />
              <Row label="Enrollment Date" value={student.enrollmentDate} />
            </Section>

            <Section title="2. Personal Information">
              <Row label="Full Name"     value={student.fullName} />
              <Row label="Email"         value={student.email} />
              <Row label="Phone"         value={student.phone} />
              <Row label="Date of Birth" value={student.dateOfBirth} />
              <Row label="Address" value={student.address} full />
            </Section>

            <Section title="3. Guardian Information">
              <Row label="Guardian Name"  value={student.guardianName} />
              <Row label="Guardian Phone" value={student.guardianPhone} />
            </Section>

            <Section title="4. Record">
              <Row label="Created At"   value={student.createdAt?.slice(0, 10)} />
              <Row label="Last Updated" value={student.updatedAt?.slice(0, 10)} />
            </Section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center">
                University ERP — Student Record · Roll No. {student.rollNumber} · Generated on {new Date().toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
