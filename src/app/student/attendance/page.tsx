export const instant = false;
import { Suspense } from "react";
import AttendanceClient from "./AttendanceClient";

export default function StudentAttendancePage() {
  return <Suspense><AttendanceClient /></Suspense>;
}
