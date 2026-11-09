export const instant = false;

import { Suspense } from "react";
import StudentDetailClient from "./StudentDetailClient";

export default function StudentDetailPage() {
  return <Suspense><StudentDetailClient /></Suspense>;
}
