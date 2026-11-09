export const instant = false;

import { Suspense } from "react";
import FeeDetailClient from "./FeeDetailClient";

export default function FeeDetailPage() {
  return <Suspense><FeeDetailClient /></Suspense>;
}
