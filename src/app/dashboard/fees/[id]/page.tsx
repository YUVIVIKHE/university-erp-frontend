export const instant = false;

import { Suspense } from "react";
import FeeDetailClient from "./FeeDetailClient";

export default function FeeDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <FeeDetailClient />
    </Suspense>
  );
}
