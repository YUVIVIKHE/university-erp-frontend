"use client";

import { useCallback, useEffect, useState } from "react";
import { modulesApi, type Notice, type NoticeInput, errorMessage, fmtDate } from "@/lib/admin/modules";
import {
  AdminOnly, Badge, ConfirmDialog, Empty, ErrorBanner, Field, Modal, PageHeader, Pagination,
  btnPrimary, inputCls, useDebounced,
} from "@/components/admin/ui";

const AUDIENCES = [["ALL", "Everyone"], ["STUDENTS", "Students"], ["FACULTY", "Faculty"], ["STAFF", "Staff"]] as const;
const PRIORITIES = [["NORMAL", "Normal"], ["IMPORTANT", "Important"], ["URGENT", "Urgent"]] as const;

/** <input type="datetime-local"> works in local time without a zone; convert both ways. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const EMPTY: NoticeInput = { title: "", body: "", audience: "ALL", priority: "NORMAL", pinned: false, publishAt: null, expiresAt: null };

function NoticeForm({ initial, onSaved, onCancel, id }: {
  initial: NoticeInput; id?: number; onSaved: () => void; onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [publishLocal, setPublishLocal] = useState(toLocalInput(initial.publishAt));
  const [expiresLocal, setExpiresLocal] = useState(toLocalInput(initial.expiresAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof NoticeInput>(k: K, v: NoticeInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = { ...form, publishAt: fromLocalInput(publishLocal), expiresAt: fromLocalInput(expiresLocal) };
    try {
      if (id) await modulesApi.updateNotice(id, payload); else await modulesApi.createNotice(payload);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Could not save notice"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="px-6 py-5 space-y-4">
      <ErrorBanner message={error} />
      <Field label="Title *">
        <input required maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="e.g. Mid-semester exams start 2 December" />
      </Field>
      <Field label="Message *">
        <textarea required rows={6} maxLength={10000} value={form.body} onChange={(e) => set("body", e.target.value)} className={`${inputCls} resize-y`} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Audience">
          <select value={form.audience} onChange={(e) => set("audience", e.target.value as NoticeInput["audience"])} className={inputCls}>
            {AUDIENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select value={form.priority} onChange={(e) => set("priority", e.target.value as NoticeInput["priority"])} className={inputCls}>
            {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Publish at" hint="Leave empty to publish now">
          <input type="datetime-local" value={publishLocal} onChange={(e) => setPublishLocal(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Expires at" hint="Optional — hides the notice after this time">
          <input type="datetime-local" value={expiresLocal} onChange={(e) => setExpiresLocal(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.pinned} onChange={(e) => set("pinned", e.target.checked)} className="rounded border-slate-300" />
        Pin to the top
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : id ? "Save changes" : "Publish notice"}</button>
      </div>
    </form>
  );
}

function NoticesPage() {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Notice | "new" | null>(null);
  const [deleting, setDeleting] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useDebounced(search);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await modulesApi.notices(q, audience, state, page);
      setItems(res.content); setTotalPages(res.totalPages); setTotal(res.totalElements);
    } catch (e) { setError(errorMessage(e, "Could not load notices")); }
    finally { setLoading(false); }
  }, [q, audience, state, page]);

  useEffect(() => { load(); }, [load]);

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try { await modulesApi.deleteNotice(deleting.id); setDeleting(null); load(); }
    catch (e) { setError(errorMessage(e, "Could not delete notice")); setDeleting(null); }
    finally { setBusy(false); }
  }

  const stateBadge = (n: Notice) =>
    n.state === "ACTIVE" ? <Badge tone="green">Live</Badge> : n.state === "SCHEDULED" ? <Badge tone="indigo">Scheduled</Badge> : <Badge>Expired</Badge>;
  const prioBadge = (n: Notice) =>
    n.priority === "URGENT" ? <Badge tone="red">Urgent</Badge> : n.priority === "IMPORTANT" ? <Badge tone="amber">Important</Badge> : null;

  return (
    <div className="w-full p-8">
      <PageHeader title="Notices" subtitle="Announcements for students, faculty and staff"
        actions={<button onClick={() => setEditing("new")} className={btnPrimary}>+ New notice</button>} />

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className={`${inputCls} md:col-span-2`} placeholder="Search notices…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select className={inputCls} value={audience} onChange={(e) => { setAudience(e.target.value); setPage(0); }}>
          <option value="">All audiences</option>
          {AUDIENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className={inputCls} value={state} onChange={(e) => { setState(e.target.value); setPage(0); }}>
          <option value="">Any status</option>
          <option value="ACTIVE">Live</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Loading…</div>
      ) : items.length === 0 ? (
        <Empty title={total === 0 && !q && !audience && !state ? "No notices yet" : "No notices match these filters"}
          action={<button onClick={() => setEditing("new")} className="text-indigo-600 text-sm hover:underline">Publish your first notice →</button>} />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <article key={n.id} className={`bg-white rounded-xl border p-5 ${n.pinned ? "border-indigo-200" : "border-slate-200"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {n.pinned && <span className="text-xs text-indigo-600 font-medium">📌 Pinned</span>}
                    <h3 className="font-semibold text-slate-800">{n.title}</h3>
                    {prioBadge(n)} {stateBadge(n)}
                  </div>
                  <p className="text-xs text-slate-400">
                    To {AUDIENCES.find(([v]) => v === n.audience)?.[1]} · {n.state === "SCHEDULED" ? "publishes" : "published"} {fmtDate(n.publishAt)}
                    {n.expiresAt && ` · expires ${fmtDate(n.expiresAt)}`}{n.createdBy && ` · by ${n.createdBy}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditing(n)} className="text-xs text-indigo-600 hover:underline font-medium">Edit</button>
                  <span className="text-slate-200">|</span>
                  <button onClick={() => setDeleting(n)} className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3 whitespace-pre-line line-clamp-4">{n.body}</p>
            </article>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {editing && (
        <Modal title={editing === "new" ? "New notice" : "Edit notice"} onClose={() => setEditing(null)} wide>
          <NoticeForm
            id={editing === "new" ? undefined : editing.id}
            initial={editing === "new" ? EMPTY : {
              title: editing.title, body: editing.body, audience: editing.audience, priority: editing.priority,
              pinned: editing.pinned, publishAt: editing.publishAt, expiresAt: editing.expiresAt,
            }}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete notice" confirmLabel="Delete" busy={busy}
          message={<>Delete <span className="font-medium text-slate-700">{deleting.title}</span>? This cannot be undone.</>}
          onCancel={() => setDeleting(null)} onConfirm={remove} />
      )}
    </div>
  );
}

export default function Page() {
  return <AdminOnly><NoticesPage /></AdminOnly>;
}
