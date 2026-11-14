export const instant = false;

import { Suspense } from "react";
import NewFeeClient from "./NewFeeClient";

export default function NewFeePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading…</div>}>
      <NewFeeClient />
    </Suspense>
  );
}
