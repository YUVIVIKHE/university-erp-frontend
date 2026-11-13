"use client";

import { useEffect, useState } from "react";
import { api, FeeData } from "@/lib/api";

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
  PARTIAL:  { label: "Partial",  color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  PAID:     { label: "Paid",     color: "bg-green-100 text-green-700 border-green-200",    dot: "bg-green-500" },
  OVERDUE:  { label: "Overdue",  color: "bg-red-100 text-red-700 border-red-200",          dot: "bg-red-500"   },
  WAIVED:   { label: "Waived",   color: "bg-slate-100 text-slate-500 border-slate-200",    dot: "bg-slate-400" },
};

export default function StudentFeesPage() {
  const [fees, setFees] = useState<FeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.studentPortal.fees()
      .then(setFees)
      .catch((err) => setError((err as { message?: string })?.message ?? "Failed to load fee records."))
      .finally(() => setLoading(false));
  }, []);

  const totalBilled = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid   = fees.reduce((s, f) => s + f.amountPaid, 0);
  const totalDue    = fees.reduce((s, f) => s + f.balance, 0);
  const paymentPct  = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  const filtered = filterStatus === "ALL" ? fees : fees.filter((f) => f.status === filterStatus);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="p-8 text-red-500 text-sm">{error}</div>;

  return (
    <div className="p-5 md:p-7 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Fees</h1>
        <p className="text-slate-400 text-sm mt-1">Your fee records and payment status</p>
      </div>

      {/* Summary card */}
      {fees.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Billed</p>
              <p className="text-xl font-bold text-slate-800">₹{totalBilled.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Amount Paid</p>
              <p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Balance Due</p>
              <p className={`text-xl font-bold ${totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
                {totalDue > 0 ? `₹${totalDue.toLocaleString()}` : "Clear"}
              </p>
            </div>
          </div>

          {/* Payment progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
              <span>Payment progress</span>
              <span className="font-semibold text-slate-700">{paymentPct}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${paymentPct === 100 ? "bg-green-500" : "bg-indigo-500"}`}
                style={{ width: `${paymentPct}%` }}
              />
            </div>
          </div>

          {totalDue > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-amber-700 font-medium">₹{totalDue.toLocaleString()} remaining — contact the accounts office to pay.</p>
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "PARTIAL", "OVERDUE", "PAID", "WAIVED"].map((s) => {
          const count = s === "ALL" ? fees.length : fees.filter((f) => f.status === s).length;
          if (s !== "ALL" && count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filterStatus === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_META[s]?.label ?? s} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Fee list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
            No fee records found.
          </div>
        ) : (
          filtered.map((f) => {
            const meta = STATUS_META[f.status];
            const paidPct = f.amount > 0 ? Math.round((f.amountPaid / f.amount) * 100) : 0;
            return (
              <div key={f.feeId} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm">{f.feeType}</p>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${meta?.color ?? ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta?.dot ?? "bg-slate-400"}`} />
                        {meta?.label ?? f.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400">{f.feeId}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                      <span>Due: <span className="font-medium text-slate-700">{f.dueDate}</span></span>
                      {f.paidDate && <span>Paid on: <span className="font-medium text-green-700">{f.paidDate}</span></span>}
                    </div>
                    {f.remarks && <p className="text-xs text-slate-400 mt-1.5 italic">{f.remarks}</p>}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-slate-800">₹{f.amount.toLocaleString()}</p>
                    {f.amountPaid > 0 && f.amountPaid < f.amount && (
                      <p className="text-xs text-green-600">Paid: ₹{f.amountPaid.toLocaleString()}</p>
                    )}
                    {f.balance > 0 && (
                      <p className="text-xs text-red-500 font-semibold">Due: ₹{f.balance.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {/* Partial payment bar */}
                {f.status === "PARTIAL" && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Payment progress</span>
                      <span>{paidPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${paidPct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
