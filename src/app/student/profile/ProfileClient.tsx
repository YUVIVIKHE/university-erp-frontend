"use client";

import { useEffect, useState } from "react";
import { api, StudentData } from "@/lib/api";

export default function ProfileClient() {
  const [profile, setProfile] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const [form, setForm] = useState({ phone: "", address: "", guardianName: "", guardianPhone: "" });

  useEffect(() => {
    api.studentPortal.me()
      .then((p) => {
        setProfile(p);
        setForm({
          phone:         p.phone         ?? "",
          address:       p.address       ?? "",
          guardianName:  p.guardianName  ?? "",
          guardianPhone: p.guardianPhone ?? "",
        });
      })
      .catch((err) => setError((err as { message?: string })?.message ?? "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.studentPortal.updateProfile({
        phone:         form.phone         || undefined,
        address:       form.address       || undefined,
        guardianName:  form.guardianName  || undefined,
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error || !profile) return <div className="p-8 text-red-500 text-sm">{error ?? "No profile found."}</div>;

  const initials = profile.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-5 md:p-7 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Your academic information and contact details</p>
      </div>

      {/* Avatar card */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold">{profile.fullName}</h2>
          <p className="text-indigo-200 text-sm mt-0.5">{profile.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs bg-white/20 text-white font-mono font-semibold px-2.5 py-1 rounded-lg">{profile.rollNumber}</span>
            <span className="text-xs bg-white/10 text-indigo-100 px-2.5 py-1 rounded-lg">{profile.program}</span>
            <span className="text-xs bg-white/10 text-indigo-100 px-2.5 py-1 rounded-lg">Sem {profile.semester}</span>
          </div>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Profile updated successfully.
        </div>
      )}

      {/* Academic info (read-only) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Academic Details</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Roll Number",    value: profile.rollNumber },
            { label: "Program",        value: profile.program },
            { label: "Semester",       value: `Semester ${profile.semester}` },
            { label: "Batch Year",     value: String(profile.batchYear) },
            { label: "Date of Birth",  value: profile.dateOfBirth ?? "—" },
            { label: "Enrolled On",    value: profile.enrollmentDate ?? "—" },
            { label: "Status",         value: profile.isActive ? "Active" : "Inactive" },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
              <p className="text-sm font-medium text-slate-700">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editable contact info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact &amp; Guardian</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(false); setForm({ phone: profile.phone ?? "", address: profile.address ?? "", guardianName: profile.guardianName ?? "", guardianPhone: profile.guardianPhone ?? "" }); }}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Phone",          value: profile.phone         ?? "—" },
              { label: "Guardian Name",  value: profile.guardianName  ?? "—" },
              { label: "Guardian Phone", value: profile.guardianPhone ?? "—" },
              { label: "Address",        value: profile.address       ?? "—" },
            ].map((f) => (
              <div key={f.label} className={f.label === "Address" ? "sm:col-span-2" : ""}>
                <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
                <p className="text-sm font-medium text-slate-700">{f.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 98765 43210" />
              <Field label="Guardian Name" value={form.guardianName} onChange={(v) => setForm((f) => ({ ...f, guardianName: v }))} placeholder="Parent / Guardian name" />
              <Field label="Guardian Phone" value={form.guardianPhone} onChange={(v) => setForm((f) => ({ ...f, guardianPhone: v }))} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Your residential address"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Change password hint */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">Account &amp; Security</p>
          <p className="text-xs text-slate-400 mt-0.5">Email: {profile.email}</p>
        </div>
        <span className="text-xs text-slate-400 italic">Contact admin to change email or password</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
    </div>
  );
}
