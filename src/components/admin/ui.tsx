"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, isLoggedIn } from "@/lib/auth";

export const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400";
export const btnPrimary =
  "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
export const btnSecondary =
  "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

/** Renders children only for signed-in admins; everyone else is redirected. */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    const role = getUser()?.role;
    if (role !== "ADMIN") { router.replace(role === "ACCOUNTANT" ? "/accountant" : role === "STUDENT" ? "/student" : "/dashboard"); return; }
    setOk(true);
  }, [router]);
  if (!ok) return <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>;
  return <>{children}</>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  slate: "text-slate-800", indigo: "text-indigo-600", green: "text-emerald-600",
  amber: "text-amber-600", red: "text-red-600",
} as const;

export function StatCard({ label, value, hint, tone = "slate" }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: keyof typeof tones;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tones[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onCancel, danger = true }: {
  title: string; message: React.ReactNode; confirmLabel: string; busy?: boolean;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">{title}</h2>
        <div className="text-sm text-slate-500 mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className={btnSecondary}>Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const badgeTones = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  slate: "bg-slate-50 text-slate-600 border-slate-200",
} as const;
export function Badge({ tone = "slate", children }: { tone?: keyof typeof badgeTones; children: React.ReactNode }) {
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${badgeTones[tone]}`}>{children}</span>;
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{message}</div>;
}

export function SuccessBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-lg">{message}</div>;
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
      <div className="flex gap-2">
        <button disabled={page === 0} onClick={() => onPage(page - 1)}
          className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">← Prev</button>
        <button disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}
          className="px-3 py-1 rounded border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">Next →</button>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function Empty({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
      <p className="text-slate-400">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Debounced value for search boxes, so we don't hit the API on every keystroke. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** Simple horizontal bar list, no chart library needed. */
export function BarList({ data, suffix = "", empty = "No data yet" }: {
  data: { label: string; value: number | null }[]; suffix?: string; empty?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value ?? 0));
  if (data.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">{empty}</p>;
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 truncate pr-2">{d.label}</span>
            <span className="font-medium text-slate-800">{d.value ?? 0}{suffix}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${((d.value ?? 0) / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
