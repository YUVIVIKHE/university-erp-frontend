"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { modulesApi, type GradeOptions, type GradeResult, errorMessage, fmtDate } from "@/lib/admin/modules";
import {
  AdminOnly, BarList, Badge, Empty, ErrorBanner, PageHeader, Pagination, StatCard, btnSecondary, inputCls, useDebounced,
} from "@/components/admin/ui";

function GradesPage() {
  const [opts, setOpts] = useState<GradeOptions>({ programs: [], exams: [] });
  const [program, setProgram] = useState("");
  const [semester, setSemester] = useState("");
  const [examId, setExamId] = useState("");
  const [outcome, setOutcome] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const q = useDebounced(search);

  useEffect(() => { modulesApi.gradeOptions().then(setOpts).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await modulesApi.grades({ program, semester, examId, search: q, outcome, page })); }
    catch (e) { setError(errorMessage(e, "Could not load grades")); }
    finally { setLoading(false); }
  }, [program, semester, examId, q, outcome, page]);
  useEffect(() => { load(); }, [load]);

  const exams = opts.exams.filter((e) => (!program || e.program === program) && (!semester || String(e.semester) === semester));
  const s = data?.summary;
  const reset = (fn: () => void) => { fn(); setPage(0); };
  const noData = !loading && data && data.summary.results === 0 && !program && !semester && !examId && !q && !outcome;

  return (
    <div className="w-full p-8">
      <PageHeader title="Grades" subtitle="Results and pass rates across all exams"
        actions={<>
          <Link href="/dashboard/reports?type=results" className={btnSecondary}>Export results</Link>
          <Link href="/dashboard/exams" className={btnSecondary}>Enter marks</Link>
        </>} />

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select className={inputCls} value={program} onChange={(e) => reset(() => { setProgram(e.target.value); setExamId(""); })}>
          <option value="">All programs</option>
          {opts.programs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={inputCls} value={semester} onChange={(e) => reset(() => { setSemester(e.target.value); setExamId(""); })}>
          <option value="">All semesters</option>
          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}
        </select>
        <select className={inputCls} value={examId} onChange={(e) => reset(() => setExamId(e.target.value))}>
          <option value="">All exams</option>
          {exams.map((e) => <option key={e.id} value={e.id}>{e.examCode} — {e.title}</option>)}
        </select>
        <select className={inputCls} value={outcome} onChange={(e) => reset(() => setOutcome(e.target.value))}>
          <option value="">Pass / fail / absent</option>
          <option value="PASS">Passed</option>
          <option value="FAIL">Failed</option>
          <option value="ABSENT">Absent</option>
        </select>
        <input className={inputCls} placeholder="Student name or roll no…" value={search} onChange={(e) => reset(() => setSearch(e.target.value))} />
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {noData ? (
        <Empty title="No exam results have been entered yet."
          action={<Link href="/dashboard/exams" className="text-indigo-600 text-sm hover:underline">Go to Exams & Results to enter marks →</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <StatCard label="Results" value={s?.results ?? "—"} hint={s ? `${s.appeared} appeared · ${s.absent} absent` : undefined} />
            <StatCard label="Pass rate" value={s ? `${s.passRate}%` : "—"} tone={s && s.passRate < 50 ? "red" : "green"} />
            <StatCard label="Passed" value={s?.passed ?? "—"} tone="green" />
            <StatCard label="Failed" value={s?.failed ?? "—"} tone={s && s.failed > 0 ? "red" : "slate"} />
            <StatCard label="Average score" value={s?.averagePercentage != null ? `${s.averagePercentage}%` : "—"}
              hint={s?.highestPercentage != null ? `Highest ${s.highestPercentage}%` : undefined} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-1 h-fit">
              <h2 className="text-sm font-semibold text-slate-800 mb-4">Grade distribution</h2>
              <BarList data={(s?.gradeDistribution ?? []).map((g) => ({ label: g.grade, value: g.count }))} empty="No grades" />
            </div>
            <div className="lg:col-span-3">
              {loading ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Loading…</div>
                : !data || data.content.length === 0 ? <Empty title="No results match these filters" />
                : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                        <tr><th className="text-left px-4 py-3">Student</th><th className="text-left px-4 py-3">Exam</th><th className="text-right px-4 py-3">Marks</th><th className="text-right px-4 py-3">%</th><th className="text-center px-4 py-3">Grade</th><th className="text-left px-4 py-3">Result</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.content.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3"><p className="text-slate-800">{r.studentName}</p><p className="text-xs font-mono text-slate-400">{r.rollNumber}</p></td>
                            <td className="px-4 py-3"><p className="text-slate-800">{r.examTitle}</p><p className="text-xs text-slate-400">{r.examCode} · {fmtDate(r.examDate)}</p></td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">{r.absent ? "—" : `${r.marksObtained ?? "—"} / ${r.totalMarks}`}</td>
                            <td className="px-4 py-3 text-right">{r.absent || r.percentage == null ? "—" : r.percentage}</td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-700">{r.grade || "—"}</td>
                            <td className="px-4 py-3">{r.absent ? <Badge>Absent</Badge> : r.pass ? <Badge tone="green">Pass</Badge> : r.pass === false ? <Badge tone="red">Fail</Badge> : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              <Pagination page={page} totalPages={data?.totalPages ?? 0} onPage={setPage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return <AdminOnly><GradesPage /></AdminOnly>;
}
