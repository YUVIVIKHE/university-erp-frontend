"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { api, StudentData } from "@/lib/api";

type DocumentStatus = "Verified" | "Pending" | "Missing";

type Doc = {
  key: string;
  label: string;
  status: DocumentStatus;
  fileName?: string;
};

export default function ProfileClient() {
  const [profile, setProfile] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [documents, setDocuments] = useState<Doc[]>([]);

  const [form, setForm] = useState({
    phone: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
  });

  useEffect(() => {
    api.studentPortal.me()
      .then((p) => {
        setProfile(p);
        setForm({
          phone: p.phone ?? "",
          address: p.address ?? "",
          guardianName: p.guardianName ?? "",
          guardianPhone: p.guardianPhone ?? "",
        });
        setDocuments([
          { key: "photo", label: "Passport Photograph", status: "Pending" },
          { key: "signature", label: "Signature", status: "Missing" },
          { key: "mark10", label: "10th Marksheet", status: "Verified" },
          { key: "mark12", label: "12th Marksheet", status: "Pending" },
          { key: "lc", label: "Leaving Certificate", status: "Missing" },
          { key: "tc", label: "Transfer Certificate", status: "Pending" },
          { key: "caste", label: "Caste Certificate", status: "Missing" },
          { key: "income", label: "Income Certificate", status: "Missing" },
        ]);
      })
      .catch((err) => setError((err as { message?: string })?.message ?? "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.studentPortal.updateProfile({
        phone: form.phone || undefined,
        address: form.address || undefined,
        guardianName: form.guardianName || undefined,
        guardianPhone: form.guardianPhone || undefined,
      });
      setProfile(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function handleDocumentUpload(key: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocuments((current) =>
      current.map((doc) =>
        doc.key === key ? { ...doc, status: "Verified", fileName: file.name } : doc
      )
    );
  }

  const completion = useMemo(() => {
    if (!documents.length) return 0;
    const done = documents.filter((doc) => doc.status === "Verified").length;
    return Math.round((done / documents.length) * 100);
  }, [documents]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return <div className="p-8 text-red-500 text-sm">{error ?? "No profile found."}</div>;

  const initials = profile.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Personal</h1>
          <p className="text-slate-400 text-sm mt-1">Student profile, contact, guardians and document status</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl px-3.5 py-2.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit details
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setForm({
                  phone: profile.phone ?? "",
                  address: profile.address ?? "",
                  guardianName: profile.guardianName ?? "",
                  guardianPhone: profile.guardianPhone ?? "",
                });
              }}
              className="text-xs text-slate-600 hover:text-slate-800 font-medium px-3 py-2 rounded-xl border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-3.5 py-2.5 rounded-xl transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.fullName}</h2>
            <p className="text-indigo-100 text-sm mt-0.5">{profile.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-white/15 px-2.5 py-1 rounded-lg font-mono font-semibold">{profile.rollNumber}</span>
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg">{profile.program}</span>
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg">Semester {profile.semester}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[220px]">
          <p className="text-[11px] uppercase tracking-wide text-indigo-100">Document completion</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-2xl font-black">{completion}%</span>
            <span className="text-xs text-indigo-100">{documents.filter((d) => d.status === "Verified").length}/{documents.length} verified</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-300" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Personal details updated successfully.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SectionCard title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Full Name" value={profile.fullName} />
            <InfoRow label="Student ID" value={profile.rollNumber} />
            <InfoRow label="Date of Birth" value={profile.dateOfBirth ?? "—"} />
            <InfoRow label="Gender" value="Not specified" />
            <InfoRow label="Blood Group" value="Not specified" />
            <InfoRow label="Nationality" value="Not specified" />
            <InfoRow label="Category" value="Not specified" full />
          </div>
        </SectionCard>

        <SectionCard title="Contact Information">
          {editing ? (
            <div className="space-y-4">
              <Field label="Mobile Number" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 98765 43210" />
              <Field label="Alternate Mobile" value="" placeholder="Optional" />
              <Field label="Email Address" value={profile.email} readOnly />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Address</label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Mobile Number" value={profile.phone ?? "—"} />
              <InfoRow label="Alternate Mobile" value="—" />
              <InfoRow label="Email Address" value={profile.email} />
              <InfoRow label="Permanent Address" value={profile.address ?? "—"} full />
              <InfoRow label="Current Address" value={profile.address ?? "—"} full />
              <InfoRow label="State" value="—" />
              <InfoRow label="District" value="—" />
              <InfoRow label="City" value="—" />
              <InfoRow label="PIN Code" value="—" />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Parent / Guardian Information">
          {editing ? (
            <div className="space-y-4">
              <Field label="Father Name" value={form.guardianName} onChange={(v) => setForm((f) => ({ ...f, guardianName: v }))} placeholder="Father / guardian name" />
              <Field label="Mother Name" value="" placeholder="Optional" />
              <Field label="Guardian Name" value={form.guardianName} onChange={(v) => setForm((f) => ({ ...f, guardianName: v }))} placeholder="Guardian name" />
              <Field label="Parent Contact Number" value={form.guardianPhone} onChange={(v) => setForm((f) => ({ ...f, guardianPhone: v }))} placeholder="+91 98765 43210" />
              <Field label="Parent Email" value="" placeholder="Optional" />
              <Field label="Occupation" value="" placeholder="Optional" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Father Name" value={profile.guardianName ?? "—"} />
              <InfoRow label="Mother Name" value="—" />
              <InfoRow label="Guardian Name" value={profile.guardianName ?? "—"} />
              <InfoRow label="Parent Contact" value={profile.guardianPhone ?? "—"} />
              <InfoRow label="Parent Email" value="—" />
              <InfoRow label="Occupation" value="—" />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Academic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Admission Number" value="—" />
            <InfoRow label="Admission Date" value={profile.enrollmentDate ?? "—"} />
            <InfoRow label="Department" value={profile.program} />
            <InfoRow label="Course" value={profile.program} />
            <InfoRow label="Academic Year" value={`${profile.batchYear}-${profile.batchYear + 1}`} />
            <InfoRow label="Current Semester" value={`Semester ${profile.semester}`} />
            <InfoRow label="Division" value="A" />
            <InfoRow label="Roll Number" value={profile.rollNumber} />
            <InfoRow label="Previous Qualification" value="—" full />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Document Management" className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {documents.map((doc) => (
            <div key={doc.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{doc.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{doc.fileName ?? "No file uploaded"}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                  doc.status === "Verified"
                    ? "bg-green-100 text-green-700"
                    : doc.status === "Pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-600"
                }`}>
                  {doc.status}
                </span>
              </div>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-700">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5.5 5.5 0 0117.5 8H16a3 3 0 00-3 3v1m-3 4h10m0 0l-3-3m3 3l-3 3" />
                </svg>
                Upload
                <input type="file" className="hidden" onChange={(event) => handleDocumentUpload(doc.key, event)} />
              </label>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, children, className = "p-5" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      </div>
      <div className={className}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value, full = false }: { label: string; value: string | number; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-slate-100 disabled:text-slate-400"
      />
    </div>
  );
}
