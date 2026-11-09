"use client";

import { useEffect, useState } from "react";
import { api, FeeData } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  PARTIAL:  "bg-orange-100 text-orange-700",
  PAID:     "bg-green-100 text-green-700",
  OVERDUE:  "bg-red-100 text-red-700",
  WAIVED:   "bg-slate-100 text-slate-500",
};

export default function StudentFeesPage() {
  const [fees, setFees] = useState<FeeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.studentPortal.fees()
      .then(setFees)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalBilled = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid   = fees.reduce((s, f) => s + f.amountPaid, 0);
  const totalDue    = fees.reduce((s, f) => s + f.balance, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Fee Details</h1>
        <p className="text-slate-400 text-sm mt-1">Your fee records and payment status</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Total Billed</p>
          <p className="text-xl font-bold text-slate-800">₹{totalBilled.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <p className="text-xs text-green-600 mb-1">Amount Paid</p>
          <p className="text-xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${totalDue > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
          <p className={`text-xs mb-1 ${totalDue > 0 ? "text-red-600" : "text-green-600"}`}>Balance Due</p>
          <p className={`text-xl font-bold ${totalDue > 0 ? "text-red-700" : "text-green-700"}`}>₹{totalDue.toLocaleString()}</p>
        </div>
      </div>

      {/* Fee records */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading fees…</div>
        ) : fees.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No fee records found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {fees.map((f) => (
              <div key={f.feeId} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800 text-sm">{f.feeType}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[f.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400">{f.feeId}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>Due: <span className="font-medium text-slate-700">{f.dueDate}</span></span>
                      {f.paidDate && <span>Paid: <span className="font-medium text-green-700">{f.paidDate}</span></span>}
                    </div>
                    {f.remarks && <p className="text-xs text-slate-400 mt-1 italic">{f.remarks}</p>}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-base font-bold text-slate-800">₹{f.amount.toLocaleString()}</p>
                    {f.amountPaid > 0 && (
                      <p className="text-xs text-green-600">Paid: ₹{f.amountPaid.toLocaleString()}</p>
                    )}
                    {f.balance > 0 && (
                      <p className="text-xs text-red-500">Due: ₹{f.balance.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
