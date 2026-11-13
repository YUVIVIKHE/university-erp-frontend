"use client";

import { useEffect, useState } from "react";
import {
  modulesApi, type GradeOptions, type Report, type ReportFilters, type ReportType, downloadCsv, errorMessage,
} from "@/lib/admin/modules";
import { AdminOnly, ErrorBanner, Field, PageHeader, btnPrimary, btnSecondary, inputCls } from "@/components/admin/ui";

const REPORTS: { type: ReportType; title: string; desc: string; filters: (keyof ReportFilters)[]; statuses?: [string, string][] }[] = [
  { type: "students", title: "Student list", desc: "Contact and enrolment details", filters: ["program", "semester", "status"],
    statuses: [["", "All"], ["ACTIVE", "Active"], ["INACTIVE", "Inactive"]] },
  { type: "attendance", title: "Attendance summary", desc: "Present / absent and % per student", filters: ["program", "semester", "from", "to"] },
  { type: "results", title: "Exam results", desc: "Marks, grades and pass/fail", filters: ["program", "semester", "examId"] },
  { type: "fees", title: "Fee records", desc: "Billed, paid, balance and status", filters: ["program", "status"],
    statuses: [["", "All"], ["PENDING", "Pending"], ["PARTIAL", "Partial"], ["PAID", "Paid"], ["OVERDUE", "Overdue"], ["WAIVED", "Waived"]] },
  { type: "library", title: "Library issues", desc: "Issues, returns and fines", filters: ["from", "to", "status"],
    statuses: [["", "All"], ["ISSUED", "Issued"], ["OVERDUE", "Overdue"], ["RETURNED", "Returned"]] },
];
const PREVIEW_ROWS = 200;
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

function ReportsPage() {
  const [type, setType] = useState<ReportType>("students");
  const [filters, setFilters] = useState<ReportFilters>({ from: daysAgo(29), to: today() });
  const [opts, setOpts] = useState<GradeOptions>({ programs: [], exams: [] });
  const [institution, setInstitution] = useState("University ERP");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type") as ReportType | null;
    if (t && REPORTS.some((r) => r.type === t)) setType(t);
    modulesApi.gradeOptions().then(setOpts).catch(() => {});
    modulesApi.settings().then((s) => setInstitution(s.institutionName)).catch(() => {});
  }, []);

  const def = REPORTS.find((r) => r.type === type)!;
  const set = (k: keyof ReportFilters, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  async function run() {
    setLoading(true); setError("");
    const f: ReportFilters = {};
    def.filters.forEach((k) => { if (filters[k]) f[k] = filters[k]; });
    try { setReport(await modulesApi.report(type, f)); }
    catch (e) { setError(errorMessage(e, "Could not run report")); setReport(null); }
    finally { setLoading(false); }
  }

  useEffect(() => { setReport(null); }, [type]);

  const fileBase = report ? `${report.type}-report-${today()}` : "report";

  function printPdf() {
    if (!report) return;
    const w = window.open("", "_blank");
    if (!w) { setError("Allow pop-ups for this site to print or save as PDF."); return; }
    const filterText = def.filters.filter((k) => filters[k]).map((k) => `${k}: ${filters[k]}`).join(" · ");
    w.document.write(`<!doctype html><html><head><title>${esc(report.title)}</title><style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:24px;color:#0f172a}
      h1{font-size:18px;margin:0}.sub{color:#64748b;font-size:12px;margin:4px 0 16px}
      table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left}
      th{background:#f1f5f9}tr:nth-child(even) td{background:#f8fafc}@page{size:landscape;margin:12mm}
    </style></head><body>
      <h1>${esc(institution)} — ${esc(report.title)}</h1>
      <div class="sub">Generated ${new Date().toLocaleString("en-IN")} · ${report.rows.length} rows${filterText ? " · " + esc(filterText) : ""}</div>
      <table><thead><tr>${report.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${report.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
      <script>window.onload=()=>{window.print()}<\/script></body></html>`);
    w.document.close();
  }

  return (
    <div className="w-full p-8">
      <PageHeader title="Reports" subtitle="Preview, then download for Excel or save as PDF" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {REPORTS.map((r) => (
          <button key={r.type} onClick={() => setType(r.type)}
            className={`text-left rounded-xl border p-4 transition ${type === r.type ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <p className={`text-sm font-semibold ${type === r.type ? "text-indigo-700" : "text-slate-800"}`}>{r.title}</p>
            <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          {def.filters.includes("program") && (
            <Field label="Program">
              <select className={inputCls} value={filters.program ?? ""} onChange={(e) => set("program", e.target.value)}>
                <option value="">All programs</option>
                {opts.programs.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          )}
          {def.filters.includes("semester") && (
            <Field label="Semester">
              <select className={inputCls} value={filters.semester ?? ""} onChange={(e) => set("semester", e.target.value)}>
                <option value="">All</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}
              </select>
            </Field>
          )}
          {def.filters.includes("examId") && (
            <Field label="Exam">
              <select className={inputCls} value={filters.examId ?? ""} onChange={(e) => set("examId", e.target.value)}>
                <option value="">All exams</option>
                {opts.exams.map((x) => <option key={x.id} value={x.id}>{x.examCode} — {x.title}</option>)}
              </select>
            </Field>
          )}
          {def.filters.includes("status") && def.statuses && (
            <Field label="Status">
              <select className={inputCls} value={filters.status ?? ""} onChange={(e) => set("status", e.target.value)}>
                {def.statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          )}
          {def.filters.includes("from") && (
            <Field label="From"><input type="date" className={inputCls} value={filters.from ?? ""} max={filters.to} onChange={(e) => set("from", e.target.value)} /></Field>
          )}
          {def.filters.includes("to") && (
            <Field label="To"><input type="date" className={inputCls} value={filters.to ?? ""} min={filters.from} onChange={(e) => set("to", e.target.value)} /></Field>
          )}
          <button onClick={run} disabled={loading} className={btnPrimary}>{loading ? "Running…" : "Run report"}</button>
        </div>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {report && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{report.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {report.rows.length} rows{report.truncated ? " (limit reached — narrow the filters)" : ""}
                {report.rows.length > PREVIEW_ROWS ? ` · previewing first ${PREVIEW_ROWS}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button disabled={report.rows.length === 0} className={btnSecondary} onClick={() => downloadCsv(`${fileBase}.csv`, report.columns, report.rows)}>Download for Excel</button>
              <button disabled={report.rows.length === 0} className={btnSecondary} onClick={printPdf}>Print / Save PDF</button>
            </div>
          </div>
          {report.rows.length === 0 ? (
            <p className="p-12 text-center text-slate-400 text-sm">No data for these filters</p>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide sticky top-0">
                  <tr>{report.columns.map((c) => <th key={c} className="text-left px-4 py-3 whitespace-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {r.map((c, j) => <td key={j} className="px-4 py-2 text-slate-700 whitespace-nowrap">{c === null || c === "" ? "—" : String(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <AdminOnly><ReportsPage /></AdminOnly>;
}
