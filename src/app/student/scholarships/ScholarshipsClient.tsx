"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, StudentData, StudentScholarshipApplication, StudentScholarshipOffer } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  VERIFIED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-200 text-slate-700",
  PENDING: "bg-amber-100 text-amber-700",
};

export default function ScholarshipsClient() {
  const [profile, setProfile] = useState<StudentData | null>(null);
  const [applications, setApplications] = useState<StudentScholarshipApplication[]>([]);
  const [offers, setOffers] = useState<StudentScholarshipOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingOffer, setApplyingOffer] = useState<number | null>(null);
  const [requestedAmount, setRequestedAmount] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.studentPortal.me(),
      api.studentPortal.scholarships(),
      api.studentPortal.scholarshipOffers(),
    ])
      .then(([p, rows, availableOffers]) => {
        setProfile(p);
        setApplications(rows);
        setOffers(availableOffers);
      })
      .catch((err) => {
        setError((err as { message?: string })?.message ?? "Failed to load scholarship applications.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (applyingOffer === null) return;
    setSubmitting(true);
    setApplicationError(null);
    setApplicationMessage(null);
    try {
      await api.studentPortal.applyForScholarship(applyingOffer, {
        requestId: crypto.randomUUID(),
        requestedAmount: Number(requestedAmount),
        evidenceReference: evidenceReference.trim(),
        reason: reason.trim(),
      });
      const [rows, availableOffers] = await Promise.all([
        api.studentPortal.scholarships(),
        api.studentPortal.scholarshipOffers(),
      ]);
      setApplications(rows);
      setOffers(availableOffers);
      setApplyingOffer(null);
      setRequestedAmount("");
      setEvidenceReference("");
      setReason("");
      setApplicationMessage("Your application was submitted.");
    } catch (err) {
      setApplicationError((err as { message?: string })?.message ?? "Could not submit the application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return <div className="p-8 text-red-500 text-sm">{error ?? "Scholarship data unavailable."}</div>;

  return (
    <div className="p-5 md:p-7 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Scholarships &amp; Financial Aid</h1>
        <p className="text-slate-400 text-sm mt-1">{profile.program} · Roll No. {profile.rollNumber}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Applications" value={applications.length} tone="indigo" />
        <SummaryCard label="Awarded" value={applications.filter((a) => a.financial_outcome === "POSTED").length} tone="green" />
        <SummaryCard label="Pending" value={applications.filter((a) => a.status === "SUBMITTED").length} tone="amber" />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Scholarship offers</h2>
          <p className="text-xs text-slate-400 mt-1">Eligibility is evaluated using your active profile, program, semester, and batch year.</p>
        </div>
        {applicationMessage && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{applicationMessage}</p>}
        {applicationError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{applicationError}</p>}
        {offers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400">No active scholarship offers are available.</div>
        ) : offers.map((offer) => (
          <article key={offer.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{offer.scheme}</h3>
                <p className="mt-1 text-sm text-slate-500">{offer.description}</p>
              </div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${offer.eligible ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {offer.eligible ? "Eligible" : "Not eligible"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Info label="Category" value={offer.category} />
              <Info label="Funding" value={offer.funding} />
              <Info label="Maximum award" value={`₹${Number(offer.maxAmount).toLocaleString("en-IN")}`} />
              <Info label="Deadline" value={offer.applicationDeadline ?? "No deadline"} />
            </div>
            <p className="mt-3 text-xs text-slate-500">{offer.eligibilityCriteria}</p>
            <p className={`mt-2 text-xs ${offer.eligible ? "text-emerald-700" : "text-slate-500"}`}>{offer.eligibilityMessage}</p>
            {offer.applicationStatus && (
              <p className="mt-2 text-xs text-indigo-700">
                Previous application: {offer.applicationStatus}
                {offer.financialOutcome ? ` · ${offer.financialOutcome}` : ""}
              </p>
            )}
            {offer.eligible && (
              <button
                type="button"
                onClick={() => {
                  setApplyingOffer(applyingOffer === offer.id ? null : offer.id);
                  setRequestedAmount(String(offer.maxAmount));
                  setApplicationError(null);
                  setApplicationMessage(null);
                }}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {applyingOffer === offer.id ? "Cancel" : "Apply"}
              </button>
            )}
            {applyingOffer === offer.id && (
              <form onSubmit={submitApplication} className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4">
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  Requested amount (maximum ₹{Number(offer.maxAmount).toLocaleString("en-IN")})
                  <input required type="number" min="0.01" max={offer.maxAmount} step="0.01" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
                </label>
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  Supporting evidence reference
                  <input required maxLength={250} value={evidenceReference} onChange={(e) => setEvidenceReference(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Enter a document reference; file uploads are not supported here." />
                </label>
                <label className="grid gap-1 text-xs font-medium text-slate-600">
                  Reason for applying
                  <textarea required maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
                </label>
                <button disabled={submitting} type="submit" className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </form>
            )}
          </article>
        ))}
      </section>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Applications</h2>
          <span className="text-xs text-slate-400">Recent</span>
        </div>

        <div className="divide-y divide-slate-100">
          {applications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No scholarship records found for your account.</div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">{app.scheme}</p>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[app.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{app.category} · {app.funding}</p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-400">Requested</p>
                    <p className="font-bold text-slate-800">₹{Number(app.requested_amount ?? 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs text-slate-500">
                  <Info label="Academic year" value={app.academic_year} />
                  <Info label="Evidence" value={app.evidence_reference || "—"} />
                  <Info label="Decision" value={app.financial_outcome || "Pending"} />
                  <Info label="Approved amount" value={app.approved_amount ? `₹${Number(app.approved_amount).toLocaleString("en-IN")}` : "—"} />
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700 mb-1">Reason</p>
                  <p>{app.reason || "No reason provided."}</p>
                </div>

                {app.review_note && (
                  <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700">
                    <p className="font-semibold mb-1">Review note</p>
                    <p>{app.review_note}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "indigo" | "green" | "amber" }) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xl font-black ${styles[tone]}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-medium text-slate-700 break-words">{value}</p>
    </div>
  );
}
