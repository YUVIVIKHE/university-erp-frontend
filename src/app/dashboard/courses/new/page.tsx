export const instant = false;

import { Suspense } from "react";
import NewCourseClient from "./NewCourseClient";

export default function NewCoursePage() {
  return <Suspense><NewCourseClient /></Suspense>;
}
