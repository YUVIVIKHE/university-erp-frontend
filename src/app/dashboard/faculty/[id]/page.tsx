export const instant = false;

import { Suspense } from "react";
import FacultyDetailClient from "./FacultyDetailClient";

export default function FacultyDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <FacultyDetailClient />
    </Suspense>
  );
}
