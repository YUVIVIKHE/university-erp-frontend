export const instant = false;

import { Suspense } from "react";
import AdmissionDetailClient from "./AdmissionDetailClient";

export default function AdmissionViewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <AdmissionDetailClient />
    </Suspense>
  );
}
