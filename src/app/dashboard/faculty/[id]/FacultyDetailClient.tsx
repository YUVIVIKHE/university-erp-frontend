"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, FacultyData } from "@/lib/api";

const DESIGNATIONS = [
  "Assistant Professor","Associate Professor","Professor","Senior Professor",
  "Head of Department","Dean","Lecturer","Lab Instructor","Visiting Faculty",
];

type EditForm = {
  fullName: string; department: string; designation: string;
  specialization: string; qualification: string; dateOfJoining: string;
  dateOfBirth: string; phone: string; address: string; isActive: boolean;
};

function toForm(f: FacultyData): EditForm {
  return {
    fullName: f.fullName, department: f.department, designation: f.designation,
    specialization: f.specialization ?? "", qualification: f.qualification ?? "",
    dateOfJoining: f.dateOfJoining ?? "", dateOfBirth: f.dateOfBirth ?? "",
    phone: f.phone ?? "", address: f.address ?? "", isActive: f.isActive,
  };
}

export default function FacultyDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<FacultyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.faculty.get(Number(id))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Faculty not found."); setLoading(false); });
  }, [id]);

  function startEdit() { if (data) { setForm(toForm(data)); setEditing(true); } }
  function cancelEdit() { setEditing(false); setForm(null); setError(""); }

  async function saveEdit() {
    if (!form || !data) return;
    setSaving(true); setError("");
    try {
      const updated = await api.faculty.update(data.id, {
        fullName: form.fullName, department: form.department,
        designation: form.designation,
        specialization: form.specialization || null,
        qualification: form.qualification || null,
        dateOfJoining: form.dateOfJoining || null,
        dateOfBirth: form.dateOfBirth || null,
        phone: form.phone || null, address: form.address || null,
        isActive: form.isActive,
      });
      setData(updated); setEditing(false); setForm(null);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Save failed.");
    } finally { setSaving(false); }
  }

  function setF(field: keyof EditForm, value: unknown) {
    setForm((f) => f ? { ...f, [field]: value } : f);
  }

  if (loading) return <div className="p-12 text-center text-slate-400">Loading…</div>;
  if (!data) return <div className="p-12 text-center text-red-500">{error || "Not found."}</div>;

  return (
    <div className="w-full p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/faculty" className="text-indigo-600 text-sm hover:underline">← Back to Faculty</Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">{data.fullName}</h1>
          <p className="text-slate-500 text-sm">{data.designation} · {data.department}</p>
        </div>
        {!editing && (
          <button onClick={startEdit} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Edit
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {!editing ? (
        <div className="space-y-5">
          {/* Identity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Identity</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <Field label="Employee ID" value={data.employeeId} mono />
              <Field label="Email" value={data.email} />
              <Field label="Phone" value={data.phone} />
              <Field label="Status">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${data.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {data.isActive ? "Active" : "Inactive"}
                </span>
              </Field>
            </div>
          </div>

          {/* Academic */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Academic</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <Field label="Department" value={data.department} />
              <Field label="Designation" value={data.designation} />
              <Field label="Specialization" value={data.specialization} />
              <Field label="Qualification" value={data.qualification} className="col-span-2" />
              <Field label="Date of Joining" value={data.dateOfJoining} />
            </div>
          </div>

          {/* Personal */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Personal</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <Field label="Date of Birth" value={data.dateOfBirth} />
              <Field label="Address" value={data.address} className="col-span-2" />
            </div>
          </div>

          {/* Record */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Record</h2>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Created" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : null} />
              <Field label="Last Updated" value={data.updatedAt ? new Date(data.updatedAt).toLocaleString() : null} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name" required>
                <input type="text" value={form!.fullName} onChange={(e) => setF("fullName", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Status">
                <select value={form!.isActive ? "true" : "false"} onChange={(e) => setF("isActive", e.target.value === "true")}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </FormField>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Academic</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Department" required>
                <input type="text" value={form!.department} onChange={(e) => setF("department", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Designation">
                <select value={form!.designation} onChange={(e) => setF("designation", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="Specialization">
                <input type="text" value={form!.specialization} onChange={(e) => setF("specialization", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Qualification">
                <input type="text" value={form!.qualification} onChange={(e) => setF("qualification", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Date of Joining">
                <input type="date" value={form!.dateOfJoining} onChange={(e) => setF("dateOfJoining", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Personal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Date of Birth">
                <input type="date" value={form!.dateOfBirth} onChange={(e) => setF("dateOfBirth", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Phone">
                <input type="tel" value={form!.phone} onChange={(e) => setF("phone", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </FormField>
              <FormField label="Address" className="md:col-span-2">
                <textarea rows={2} value={form!.address} onChange={(e) => setF("address", e.target.value)}
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
    </div>
  );
}

function Field({ label, value, mono, className, children }: {
  label: string; value?: string | null; mono?: boolean; className?: string; children?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      {children ?? (
        <p className={`text-sm ${mono ? "font-mono text-indigo-700" : "text-slate-800"}`}>
          {value ?? <span className="text-slate-300">—</span>}
        </p>
      )}
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
