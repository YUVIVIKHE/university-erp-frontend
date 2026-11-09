"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, FacultyData } from "@/lib/api";
import { useProgramCourse } from "@/hooks/useProgramCourse";

const DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Senior Professor",
  "Head of Department",
  "Dean",
  "Lecturer",
  "Lab Instructor",
  "Visiting Faculty",
];

export default function NewFacultyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<(FacultyData & { tempPassword?: string }) | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    department: "",
    designation: "Assistant Professor",
    specialization: "",
    qualification: "",
    dateOfJoining: "",
    dateOfBirth: "",
    phone: "",
    address: "",
    isActive: true,
  });

  // Department uses programs list for suggestions
  const { programOptions, loadingPrograms } = useProgramCourse("");

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.email.trim() || !form.department.trim()) {
      setError("Full name, email, and department are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.faculty.create({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        designation: form.designation,
        specialization: form.specialization || null,
        qualification: form.qualification || null,
        dateOfJoining: form.dateOfJoining || null,
        dateOfBirth: form.dateOfBirth || null,
        phone: form.phone || null,
        address: form.address || null,
        isActive: form.isActive,
      }) as FacultyData & { tempPassword?: string };
      setCreated(res);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? "Failed to add faculty.");
    } finally {
      setSaving(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="w-full p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Faculty account created</h2>
          <p className="text-slate-500 text-sm mb-6">
            {created.fullName} · {created.employeeId}
          </p>

          {created.tempPassword && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Login credentials — share with faculty</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="font-mono text-sm text-slate-800 select-all">{created.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Temporary Password</p>
                  <p className="font-mono text-sm font-semibold text-amber-800 select-all bg-amber-100 rounded px-2 py-1 inline-block">
                    {created.tempPassword}
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-3">
                ⚠ This password is shown only once. Ask the faculty member to change it after first login.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/dashboard/faculty/${created.id}`)}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              View Profile →
            </button>
            <button
              onClick={() => { setCreated(null); setForm({ fullName: "", email: "", department: "", designation: "Assistant Professor", specialization: "", qualification: "", dateOfJoining: "", dateOfBirth: "", phone: "", address: "", isActive: true }); }}
              className="px-5 py-2 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700"
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/faculty" className="text-indigo-600 text-sm hover:underline">← Back to Faculty</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Add Faculty Member</h1>
        <p className="text-slate-500 text-sm mt-1">
          A login account is created immediately. The temporary password is shown once after submission.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wide">Account Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email" required value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="jane.smith@university.edu"
              />
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wide">Academic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Department <span className="text-red-500">*</span></label>
              <select required value={form.department} disabled={loadingPrograms}
                onChange={(e) => set("department", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">{loadingPrograms ? "Loading…" : "— Select department —"}</option>
                {programOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Designation</label>
              <select
                value={form.designation} onChange={(e) => set("designation", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Specialization</label>
              <input
                type="text" value={form.specialization} onChange={(e) => set("specialization", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Machine Learning, Data Structures…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Qualification</label>
              <input
                type="text" value={form.qualification} onChange={(e) => set("qualification", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Ph.D. Computer Science, IIT Delhi"
              />
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wide">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date of Joining</label>
              <input type="date" value={form.dateOfJoining} onChange={(e) => set("dateOfJoining", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select value={form.isActive ? "true" : "false"} onChange={(e) => set("isActive", e.target.value === "true")}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                placeholder="Residential address" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          A login will be created with a temporary password shown after submission. The faculty member can log in immediately.
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? "Adding…" : "Add Faculty Member"}
          </button>
          <Link href="/dashboard/faculty"
            className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
