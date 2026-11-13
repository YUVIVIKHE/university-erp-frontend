"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { modulesApi, type InstitutionSettings, errorMessage } from "@/lib/admin/modules";
import PasswordInput from "@/components/PasswordInput";
import { AdminOnly, ErrorBanner, Field, PageHeader, SuccessBanner, btnPrimary, inputCls } from "@/components/admin/ui";

type Key = keyof InstitutionSettings;

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function SettingsPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<InstitutionSettings | null>(null);
  const [form, setForm] = useState<InstitutionSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    modulesApi.settings().then((s) => { setSaved(s); setForm(s); }).catch((e) => setError(errorMessage(e, "Could not load settings")));
  }, []);

  if (!form || !saved) return <div className="p-8">{error ? <ErrorBanner message={error} /> : <p className="text-slate-400 text-sm">Loading…</p>}</div>;

  const set = (k: Key, v: string) => { setForm({ ...form, [k]: v }); setMsg(""); };
  const changed = (Object.keys(form) as Key[]).filter((k) => form[k] !== saved[k]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form || changed.length === 0) return;
    setSaving(true); setError(""); setMsg("");
    try {
      const patch = Object.fromEntries(changed.map((k) => [k, form[k]]));
      const s = await modulesApi.saveSettings(patch);
      setSaved(s); setForm(s); setMsg("Settings saved");
    } catch (err) { setError(errorMessage(err, "Could not save settings")); }
    finally { setSaving(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwError("");
    if (next.length < 12) { setPwError("New password must be at least 12 characters"); return; }
    if (next !== confirm) { setPwError("New passwords don't match"); return; }
    setPwSaving(true);
    try {
      await modulesApi.changePassword(cur, next);
      // The server invalidates every existing session, including this one.
      clearSession();
      router.replace("/login?passwordChanged=1");
    } catch (err) { setPwError(errorMessage(err, "Could not change password")); }
    finally { setPwSaving(false); }
  }

  const input = (k: Key, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input value={form[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} {...props} />
  );

  return (
    <div className="w-full p-8 max-w-4xl">
      <PageHeader title="Settings" subtitle="Institution profile, academic rules and your account" />

      <form onSubmit={save} className="space-y-6">
        <Section title="Institution" subtitle="Shown on the dashboard and reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Field label="Institution name *">{input("institutionName", { required: true, maxLength: 150 })}</Field></div>
            <Field label="Short name">{input("shortName", { maxLength: 30 })}</Field>
            <Field label="Website">{input("website", { maxLength: 200, placeholder: "https://" })}</Field>
            <Field label="Email">{input("email", { type: "email" })}</Field>
            <Field label="Phone">{input("phone", { maxLength: 30 })}</Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <textarea rows={2} maxLength={500} value={form.address} onChange={(e) => set("address", e.target.value)} className={`${inputCls} resize-none`} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Academic" subtitle="Used for the dashboard and attendance warnings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Academic year" hint="Format YYYY-YY, e.g. 2026-27">{input("academicYear", { pattern: "\\d{4}-\\d{2}", required: true })}</Field>
            <Field label="Minimum attendance (%)" hint="Students below this are flagged">{input("attendanceThreshold", { type: "number", min: 0, max: 100, required: true })}</Field>
          </div>
        </Section>

        <Section title="Library rules" subtitle="Apply to new issues and returns">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Loan period (days)">{input("libraryLoanDays", { type: "number", min: 1, max: 365, required: true })}</Field>
            <Field label="Fine per late day (₹)">{input("libraryFinePerDay", { type: "number", min: 0, max: 1000, required: true })}</Field>
            <Field label="Max books per student">{input("libraryMaxBooks", { type: "number", min: 1, max: 20, required: true })}</Field>
          </div>
        </Section>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving || changed.length === 0} className={btnPrimary}>
            {saving ? "Saving…" : changed.length ? `Save ${changed.length} change${changed.length > 1 ? "s" : ""}` : "No changes"}
          </button>
          <SuccessBanner message={msg} />
          <ErrorBanner message={error} />
        </div>
      </form>

      <div className="mt-8">
        <Section title="Change your password" subtitle="You'll be signed out everywhere and need to log in again">
          <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field label="Current password"><PasswordInput className={inputCls} value={cur} onChange={(e) => setCur(e.target.value)} required autoComplete="current-password" /></Field>
            <Field label="New password" hint="At least 12 characters"><PasswordInput className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" /></Field>
            <Field label="Confirm new password"><PasswordInput className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" /></Field>
            <div className="md:col-span-3 flex items-center gap-4">
              <button type="submit" disabled={pwSaving} className={btnPrimary}>{pwSaving ? "Changing…" : "Change password"}</button>
              <ErrorBanner message={pwError} />
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}

export default function Page() {
  return <AdminOnly><SettingsPage /></AdminOnly>;
}
