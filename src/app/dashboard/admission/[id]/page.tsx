export const instant = false;

import { Suspense } from "react";
import AdmissionDetailClient from "./AdmissionDetailClient";

export default function AdmissionViewPage() {
  return <Suspense><AdmissionDetailClient /></Suspense>;
}
