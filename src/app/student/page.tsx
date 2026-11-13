export const instant = false;
import { Suspense } from "react";
import StudentDashboardClient from "./StudentDashboardClient";

export default function StudentDashboardPage() {
  return <Suspense><StudentDashboardClient /></Suspense>;
}
