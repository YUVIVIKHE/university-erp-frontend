export const instant = false;

import { Suspense } from "react";
import StudentDetailClient from "./StudentDetailClient";

export default function StudentDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <StudentDetailClient />
    </Suspense>
  );
}
