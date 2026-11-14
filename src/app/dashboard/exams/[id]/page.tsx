export const instant = false;

import { Suspense } from "react";
import ExamDetailClient from "./ExamDetailClient";

export default function ExamDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <ExamDetailClient />
    </Suspense>
  );
}
