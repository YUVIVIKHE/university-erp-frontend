export const instant = false;

import { Suspense } from "react";
import CourseDetailClient from "./CourseDetailClient";

export default function CourseDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <CourseDetailClient />
    </Suspense>
  );
}
