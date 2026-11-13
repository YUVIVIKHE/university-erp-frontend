export const instant = false;
import { Suspense } from "react";
import TimetableClient from "./TimetableClient";

export default function StudentTimetablePage() {
  return <Suspense><TimetableClient /></Suspense>;
}
