"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import readXlsxFile from "read-excel-file";
import { modulesApi, type ImportResponse, type ImportRow, downloadCsv, errorMessage } from "@/lib/admin/modules";
import { AdminOnly, Badge, ErrorBanner, PageHeader, StatCard, SuccessBanner, btnPrimary, btnSecondary } from "@/components/admin/ui";

const MAX_ROWS = 500;
const FIELDS: { key: keyof ImportRow; label: string; required: boolean; aliases: string[]; example: string }[] = [
  { key: "fullName", label: "Full Name", required: true, aliases: ["fullname", "name", "studentname"], example: "Aarav Patil" },
  { key: "email", label: "Email", required: true, aliases: ["email", "emailid", "emailaddress", "mail"], example: "aarav.patil@example.com" },
  { key: "rollNumber", label: "Roll Number", required: true, aliases: ["rollnumber", "rollno", "roll", "enrollmentno", "prn"], example: "2026CS001" },
  { key: "program", label: "Program", required: true, aliases: ["program", "programme", "course", "branch", "department"], example: "B.Tech Computer Science" },
  { key: "semester", label: "Semester", required: true, aliases: ["semester", "sem"], example: "1" },
  { key: "batchYear", label: "Batch Year", required: true, aliases: ["batchyear", "batch", "admissionyear", "year"], example: "2026" },
  { key: "phone", label: "Phone", required: false, aliases: ["phone", "mobile", "mobileno", "phoneno", "contact"], example: "9876543210" },
  { key: "dateOfBirth", label: "Date of Birth", required: false, aliases: ["dateofbirth", "dob", "birthdate"], example: "15-08-2008" },
  { key: "guardianName", label: "Guardian Name", required: false, aliases: ["guardianname", "parentname", "guardian", "fathername"], example: "Rajesh Patil" },
  { key: "guardianPhone", label: "Guardian Phone", required: false, aliases: ["guardianphone", "parentphone", "parentmobile", "guardianmobile"], example: "9876500000" },
  { key: "address", label: "Address", required: false, aliases: ["address", "residentialaddress"], example: "Loni, Maharashtra" },
];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const cellToString = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  return String(v).trim();
};

function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [busy, setBusy] = useState<"" | "reading" | "checking" | "importing">("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "errors">("all");

  function downloadTemplate() {
    downloadCsv("student-import-template.csv", FIELDS.map((f) => f.label), [FIELDS.map((f) => f.example)]);
  }

  async function onFile(file: File) {
    setError(""); setResult(null); setRows([]); setMissing([]); setFileName(file.name); setBusy("reading");
    try {
      let table: string[][];
      if (/\.xlsx$/i.test(file.name)) {
        table = (await readXlsxFile(file)).map((r) => r.map(cellToString));
      } else if (/\.csv$/i.test(file.name)) {
        table = parseCsv((await file.text()).replace(/^﻿/, ""));
      } else {
        throw new Error("Please upload an Excel (.xlsx) or CSV file. For old .xls files, open in Excel and save as .xlsx.");
      }
      table = table.filter((r) => r.some((c) => c.trim() !== ""));
      if (table.length < 2) throw new Error("The file has no data rows below the header row.");

      const header = table[0].map(norm);
      const colIndex: Partial<Record<keyof ImportRow, number>> = {};
      for (const f of FIELDS) {
        const idx = header.findIndex((h) => h === norm(f.label) || f.aliases.includes(h));
        if (idx >= 0) colIndex[f.key] = idx;
      }
      const miss = FIELDS.filter((f) => f.required && colIndex[f.key] === undefined).map((f) => f.label);
      setMissing(miss);
      if (miss.length) { setBusy(""); return; }

      const data = table.slice(1);
      if (data.length > MAX_ROWS) throw new Error(`This file has ${data.length} rows. Import at most ${MAX_ROWS} at a time — split the file and upload each part.`);
      const parsed = data.map((r) => Object.fromEntries(
        FIELDS.map((f) => [f.key, colIndex[f.key] !== undefined ? (r[colIndex[f.key]!] ?? "").trim() : ""])
      ) as unknown as ImportRow);
      setRows(parsed);

      setBusy("checking");
      setResult(await modulesApi.importStudents(parsed, true));
    } catch (e) {
      setError(errorMessage(e, "Could not read the file"));
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function runImport() {
    setBusy("importing"); setError("");
    try {
      const r = await modulesApi.importStudents(rows, false);
      setResult(r);
      const created = r.rows.filter((x) => x.status === "CREATED");
      if (created.length) {
        downloadCsv(`student-logins-${new Date().toISOString().slice(0, 10)}.csv`,
          ["Row", "Full Name", "Email (login)", "Roll Number", "Temporary Password"],
          created.map((x) => [x.row, x.fullName, x.email, x.rollNumber, x.temporaryPassword]));
      }
    } catch (e) { setError(errorMessage(e, "Import failed")); }
    finally { setBusy(""); }
  }

  const imported = result && !result.dryRun;
  const shown = (result?.rows ?? []).filter((r) => filter === "all" || r.status === "ERROR");

  return (
    <div className="w-full p-8 max-w-6xl">
      <PageHeader title="Import students" subtitle="Create many student accounts at once from an Excel or CSV file"
        actions={<Link href="/dashboard/students" className={btnSecondary}>← Back to students</Link>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          ["1", "Get the template", "Fill one student per row. Required: Full Name, Email, Roll Number, Program, Semester, Batch Year."],
          ["2", "Upload & check", "We check every row (formats, duplicates, existing accounts) before anything is created."],
          ["3", "Import & share logins", "A file with each student's email and temporary password downloads automatically."],
        ].map(([n, t, d]) => (
          <div key={n} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold flex items-center justify-center mb-2">{n}</div>
            <p className="font-semibold text-slate-800 text-sm">{t}</p>
            <p className="text-xs text-slate-500 mt-1">{d}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 flex flex-wrap items-center gap-3">
        <button onClick={downloadTemplate} className={btnSecondary}>Download template</button>
        <label className={`${btnPrimary} cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>
          {busy === "reading" ? "Reading file…" : busy === "checking" ? "Checking rows…" : "Upload Excel / CSV"}
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </label>
        {fileName && <span className="text-sm text-slate-500">{fileName}{rows.length ? ` · ${rows.length} rows` : ""}</span>}
      </div>

      <div className="space-y-3 mb-4">
        <ErrorBanner message={error} />
        {missing.length > 0 && (
          <ErrorBanner message={`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Use the template's header row.`} />
        )}
        {imported && result.created > 0 && (
          <SuccessBanner message={`${result.created} student account${result.created > 1 ? "s" : ""} created. The login file has downloaded — share each student's temporary password privately. Passwords are not shown again.`} />
        )}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Rows" value={result.total} />
            <StatCard label={imported ? "Created" : "Ready to import"} value={imported ? result.created : result.valid} tone="green" />
            <StatCard label="With errors" value={result.invalid} tone={result.invalid ? "red" : "slate"} hint={result.invalid ? (imported ? "Skipped — fix and re-upload" : "Will be skipped") : undefined} />
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center">
              {!imported ? (
                <button onClick={runImport} disabled={result.valid === 0 || !!busy} className={`${btnPrimary} w-full`}>
                  {busy === "importing" ? "Creating accounts…" : `Import ${result.valid} student${result.valid === 1 ? "" : "s"}`}
                </button>
              ) : (
                <button onClick={() => { setResult(null); setRows([]); setFileName(""); }} className={`${btnSecondary} w-full`}>Import another file</button>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            <button onClick={() => setFilter("all")} className={`text-xs px-3 py-1 rounded-full ${filter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>All rows</button>
            <button onClick={() => setFilter("errors")} className={`text-xs px-3 py-1 rounded-full ${filter === "errors" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>Errors only ({result.invalid})</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr><th className="text-left px-4 py-3">Row</th><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Roll No</th><th className="text-left px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => (
                  <tr key={r.row} className={r.status === "ERROR" ? "bg-red-50/40" : ""}>
                    <td className="px-4 py-2 text-slate-400">{r.row}</td>
                    <td className="px-4 py-2 text-slate-800">{r.fullName || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{r.email || "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.rollNumber || "—"}</td>
                    <td className="px-4 py-2">
                      {r.status === "ERROR" ? <span className="text-xs text-red-700">{r.errors.join(" · ")}</span>
                        : r.status === "CREATED" ? <Badge tone="green">Created</Badge> : <Badge tone="indigo">Ready</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return <AdminOnly><ImportPage /></AdminOnly>;
}
