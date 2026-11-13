"use client";

import { useCallback, useEffect, useState } from "react";
import {
  modulesApi, type Book, type BookInput, type BookIssue, type LibraryStats, errorMessage, fmtDate, inr,
} from "@/lib/admin/modules";
import {
  AdminOnly, Badge, ConfirmDialog, Empty, ErrorBanner, Field, Modal, PageHeader, Pagination, StatCard,
  SuccessBanner, btnPrimary, btnSecondary, inputCls, useDebounced,
} from "@/components/admin/ui";

const EMPTY_BOOK: BookInput = { accessionNo: "", isbn: "", title: "", author: "", publisher: "", category: "", shelf: "", totalCopies: 1 };

function BookForm({ initial, id, categories, onSaved, onCancel }: {
  initial: BookInput; id?: number; categories: string[]; onSaved: () => void; onCancel: () => void;
}) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof BookInput>(k: K, v: BookInput[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (id) await modulesApi.updateBook(id, f); else await modulesApi.createBook(f);
      onSaved();
    } catch (err) { setError(errorMessage(err, "Could not save book")); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="px-6 py-5 space-y-4">
      <ErrorBanner message={error} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Accession no. *"><input required maxLength={40} value={f.accessionNo} onChange={(e) => set("accessionNo", e.target.value.toUpperCase())} className={`${inputCls} font-mono`} placeholder="LIB-0001" /></Field>
        <Field label="ISBN"><input maxLength={20} value={f.isbn ?? ""} onChange={(e) => set("isbn", e.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Title *"><input required maxLength={255} value={f.title} onChange={(e) => set("title", e.target.value)} className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Author *"><input required maxLength={255} value={f.author} onChange={(e) => set("author", e.target.value)} className={inputCls} /></Field>
        <Field label="Publisher"><input maxLength={255} value={f.publisher ?? ""} onChange={(e) => set("publisher", e.target.value)} className={inputCls} /></Field>
        <Field label="Category">
          <input list="book-categories" maxLength={100} value={f.category ?? ""} onChange={(e) => set("category", e.target.value)} className={inputCls} placeholder="e.g. Computer Science" />
          <datalist id="book-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Shelf / rack"><input maxLength={50} value={f.shelf ?? ""} onChange={(e) => set("shelf", e.target.value)} className={inputCls} placeholder="A-3" /></Field>
        <Field label="Total copies *"><input required type="number" min={0} max={10000} value={f.totalCopies} onChange={(e) => set("totalCopies", Number(e.target.value))} className={inputCls} /></Field>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : id ? "Save changes" : "Add book"}</button>
      </div>
    </form>
  );
}

function IssueForm({ book, onDone, onCancel }: { book: Book; onDone: (msg: string) => void; onCancel: () => void }) {
  const [roll, setRoll] = useState("");
  const [due, setDue] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const r = await modulesApi.issueBook({ bookId: book.id, rollNumber: roll.trim(), dueDate: due || null, remarks });
      onDone(`Issued "${r.bookTitle}" to ${r.studentName} (${r.rollNumber}), due ${fmtDate(r.dueDate)}`);
    } catch (err) { setError(errorMessage(err, "Could not issue book")); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="px-6 py-5 space-y-4">
      <div className="bg-slate-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-slate-800">{book.title}</p>
        <p className="text-xs text-slate-500">{book.author} · {book.availableCopies} of {book.totalCopies} available</p>
      </div>
      <ErrorBanner message={error} />
      <Field label="Student roll number *"><input required autoFocus value={roll} onChange={(e) => setRoll(e.target.value)} className={`${inputCls} font-mono`} placeholder="e.g. 2026CS001" /></Field>
      <Field label="Due date" hint="Leave empty to use the default loan period from Settings">
        <input type="date" value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Remarks"><input maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inputCls} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Issuing…" : "Issue book"}</button>
      </div>
    </form>
  );
}

function ReturnForm({ issue, onDone, onCancel }: { issue: BookIssue; onDone: (msg: string) => void; onCancel: () => void }) {
  const [waive, setWaive] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const r = await modulesApi.returnBook(issue.id, { waiveFine: waive, remarks });
      onDone(`Returned "${r.bookTitle}"${Number(r.fine) > 0 ? ` — fine ${inr(r.fine)}` : ""}`);
    } catch (err) { setError(errorMessage(err, "Could not return book")); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="px-6 py-5 space-y-4">
      <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
        <p className="font-medium text-slate-800">{issue.bookTitle}</p>
        <p className="text-xs text-slate-500">{issue.studentName} ({issue.rollNumber}) · issued {fmtDate(issue.issueDate)} · due {fmtDate(issue.dueDate)}</p>
      </div>
      <ErrorBanner message={error} />
      {issue.overdue ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          {issue.daysOverdue} days late — fine <span className="font-semibold">{inr(issue.estimatedFine)}</span>
          <label className="flex items-center gap-2 mt-2 text-amber-900">
            <input type="checkbox" checked={waive} onChange={(e) => setWaive(e.target.checked)} /> Waive the fine
          </label>
        </div>
      ) : <p className="text-sm text-emerald-700">Returned on time — no fine.</p>}
      <Field label="Remarks"><input maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inputCls} placeholder="e.g. Book condition" /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Confirm return"}</button>
      </div>
    </form>
  );
}

function LibraryPage() {
  const [tab, setTab] = useState<"books" | "issues">("books");
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // books
  const [books, setBooks] = useState<Book[]>([]);
  const [bSearch, setBSearch] = useState("");
  const [bCat, setBCat] = useState("");
  const [bAvail, setBAvail] = useState(false);
  const [bPage, setBPage] = useState(0);
  const [bPages, setBPages] = useState(0);
  const [bTotal, setBTotal] = useState(0);
  // issues
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [iSearch, setISearch] = useState("");
  const [iStatus, setIStatus] = useState("ISSUED");
  const [iPage, setIPage] = useState(0);
  const [iPages, setIPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editBook, setEditBook] = useState<Book | "new" | null>(null);
  const [issueFor, setIssueFor] = useState<Book | null>(null);
  const [returning, setReturning] = useState<BookIssue | null>(null);
  const [deleting, setDeleting] = useState<Book | null>(null);
  const [busy, setBusy] = useState(false);
  const bq = useDebounced(bSearch);
  const iq = useDebounced(iSearch);

  const loadMeta = useCallback(() => {
    modulesApi.libraryStats().then(setStats).catch(() => {});
    modulesApi.libraryCategories().then(setCategories).catch(() => {});
  }, []);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const r = await modulesApi.books(bq, bCat, bAvail, bPage);
      setBooks(r.content); setBPages(r.totalPages); setBTotal(r.totalElements);
    } catch (e) { setError(errorMessage(e, "Could not load books")); }
    finally { setLoading(false); }
  }, [bq, bCat, bAvail, bPage]);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const r = await modulesApi.issues(iq, iStatus, iPage);
      setIssues(r.content); setIPages(r.totalPages);
    } catch (e) { setError(errorMessage(e, "Could not load issued books")); }
    finally { setLoading(false); }
  }, [iq, iStatus, iPage]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { if (tab === "books") loadBooks(); }, [tab, loadBooks]);
  useEffect(() => { if (tab === "issues") loadIssues(); }, [tab, loadIssues]);

  const refresh = (msg?: string) => {
    if (msg) setNotice(msg);
    setError("");
    loadMeta();
    if (tab === "books") loadBooks(); else loadIssues();
  };

  async function removeBook() {
    if (!deleting) return;
    setBusy(true);
    try { await modulesApi.deleteBook(deleting.id); setDeleting(null); refresh(`Deleted "${deleting.title}"`); }
    catch (e) { setError(errorMessage(e, "Could not delete book")); setDeleting(null); }
    finally { setBusy(false); }
  }

  const tabCls = (t: string) => `px-4 py-2 text-sm font-medium rounded-lg ${tab === t ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <div className="w-full p-8">
      <PageHeader title="Library" subtitle="Catalogue, issues, returns and fines"
        actions={<button onClick={() => setEditBook("new")} className={btnPrimary}>+ Add book</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Titles" value={stats?.titles ?? "—"} hint={`${stats?.totalCopies ?? 0} copies`} />
        <StatCard label="Available" value={stats?.availableCopies ?? "—"} tone="green" />
        <StatCard label="Issued" value={stats?.issued ?? "—"} tone="indigo" />
        <StatCard label="Overdue" value={stats?.overdue ?? "—"} tone={stats && stats.overdue > 0 ? "red" : "slate"}
          hint={stats && stats.finesPending > 0 ? `${inr(stats.finesPending)} fines accruing` : undefined} />
        <StatCard label="Fines collected" value={inr(stats?.finesCollected)} />
      </div>

      <div className="flex gap-2 mb-4">
        <button className={tabCls("books")} onClick={() => setTab("books")}>Books</button>
        <button className={tabCls("issues")} onClick={() => setTab("issues")}>Issued books</button>
      </div>

      <div className="space-y-3 mb-4">
        <SuccessBanner message={notice} />
        <ErrorBanner message={error} />
      </div>

      {tab === "books" ? (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <input className={`${inputCls} md:col-span-2`} placeholder="Search title, author, accession no., ISBN…" value={bSearch} onChange={(e) => { setBSearch(e.target.value); setBPage(0); }} />
            <select className={inputCls} value={bCat} onChange={(e) => { setBCat(e.target.value); setBPage(0); }}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={bAvail} onChange={(e) => { setBAvail(e.target.checked); setBPage(0); }} /> Available only
            </label>
          </div>
          {loading ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Loading…</div>
            : books.length === 0 ? (
              <Empty title={bTotal === 0 && !bq && !bCat && !bAvail ? "The catalogue is empty" : "No books match these filters"}
                action={<button onClick={() => setEditBook("new")} className="text-indigo-600 text-sm hover:underline">Add the first book →</button>} />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <tr><th className="text-left px-4 py-3">Accession</th><th className="text-left px-4 py-3">Title</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Shelf</th><th className="text-right px-4 py-3">Available</th><th className="px-4 py-3" /></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {books.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.accessionNo}</td>
                        <td className="px-4 py-3"><p className="font-medium text-slate-800">{b.title}</p><p className="text-xs text-slate-400">{b.author}</p></td>
                        <td className="px-4 py-3 text-slate-600">{b.category ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{b.shelf ?? "—"}</td>
                        <td className="px-4 py-3 text-right"><span className={b.availableCopies === 0 ? "text-red-600 font-medium" : "text-slate-800"}>{b.availableCopies}</span><span className="text-slate-400"> / {b.totalCopies}</span></td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button disabled={b.availableCopies === 0} onClick={() => setIssueFor(b)} className="text-xs font-medium text-indigo-600 hover:underline disabled:text-slate-300 disabled:no-underline">Issue</button>
                          <span className="text-slate-200 mx-2">|</span>
                          <button onClick={() => setEditBook(b)} className="text-xs font-medium text-slate-600 hover:underline">Edit</button>
                          <span className="text-slate-200 mx-2">|</span>
                          <button onClick={() => setDeleting(b)} className="text-xs font-medium text-red-400 hover:text-red-600">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          <Pagination page={bPage} totalPages={bPages} onPage={setBPage} />
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className={`${inputCls} md:col-span-2`} placeholder="Search by book, student name or roll number…" value={iSearch} onChange={(e) => { setISearch(e.target.value); setIPage(0); }} />
            <select className={inputCls} value={iStatus} onChange={(e) => { setIStatus(e.target.value); setIPage(0); }}>
              <option value="ISSUED">Currently issued</option>
              <option value="OVERDUE">Overdue</option>
              <option value="RETURNED">Returned</option>
              <option value="">All</option>
            </select>
          </div>
          {loading ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Loading…</div>
            : issues.length === 0 ? <Empty title="No records" />
            : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <tr><th className="text-left px-4 py-3">Book</th><th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">Issued</th><th className="text-left px-4 py-3">Due</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Fine</th><th className="px-4 py-3" /></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issues.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><p className="font-medium text-slate-800">{i.bookTitle}</p><p className="text-xs font-mono text-slate-400">{i.accessionNo}</p></td>
                        <td className="px-4 py-3"><p className="text-slate-800">{i.studentName}</p><p className="text-xs font-mono text-slate-400">{i.rollNumber}</p></td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(i.issueDate)}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDate(i.dueDate)}</td>
                        <td className="px-4 py-3">
                          {i.status === "RETURNED" ? <Badge tone="green">Returned {fmtDate(i.returnDate)}</Badge>
                            : i.overdue ? <Badge tone="red">{i.daysOverdue}d overdue</Badge> : <Badge tone="indigo">Issued</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right">{i.status === "ISSUED" ? (i.overdue ? <span className="text-amber-700">{inr(i.estimatedFine)}</span> : "—") : (Number(i.fine) > 0 ? inr(i.fine) : "—")}</td>
                        <td className="px-4 py-3 text-right">{i.status === "ISSUED" && <button onClick={() => setReturning(i)} className="text-xs font-medium text-indigo-600 hover:underline">Return</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          <Pagination page={iPage} totalPages={iPages} onPage={setIPage} />
        </>
      )}

      {editBook && (
        <Modal title={editBook === "new" ? "Add book" : `Edit — ${editBook.title}`} onClose={() => setEditBook(null)}>
          <BookForm id={editBook === "new" ? undefined : editBook.id} categories={categories}
            initial={editBook === "new" ? EMPTY_BOOK : {
              accessionNo: editBook.accessionNo, isbn: editBook.isbn ?? "", title: editBook.title, author: editBook.author,
              publisher: editBook.publisher ?? "", category: editBook.category ?? "", shelf: editBook.shelf ?? "", totalCopies: editBook.totalCopies,
            }}
            onCancel={() => setEditBook(null)}
            onSaved={() => { const isNew = editBook === "new"; setEditBook(null); refresh(isNew ? "Book added to the catalogue" : "Book updated"); }} />
        </Modal>
      )}
      {issueFor && (
        <Modal title="Issue book" onClose={() => setIssueFor(null)}>
          <IssueForm book={issueFor} onCancel={() => setIssueFor(null)} onDone={(m) => { setIssueFor(null); refresh(m); }} />
        </Modal>
      )}
      {returning && (
        <Modal title="Return book" onClose={() => setReturning(null)}>
          <ReturnForm issue={returning} onCancel={() => setReturning(null)} onDone={(m) => { setReturning(null); refresh(m); }} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete book" confirmLabel="Delete" busy={busy}
          message={<>Delete <span className="font-medium text-slate-700">{deleting.title}</span>? Books with issue history can&apos;t be deleted — set their copies to 0 instead.</>}
          onCancel={() => setDeleting(null)} onConfirm={removeBook} />
      )}
    </div>
  );
}

export default function Page() {
  return <AdminOnly><LibraryPage /></AdminOnly>;
}
