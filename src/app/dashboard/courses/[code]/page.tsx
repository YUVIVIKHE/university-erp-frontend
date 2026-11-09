export const instant = false;

import { Suspense } from "react";
import CourseDetailClient from "./CourseDetailClient";

export default function CourseDetailPage() {
  return <Suspense><CourseDetailClient /></Suspense>;
}
