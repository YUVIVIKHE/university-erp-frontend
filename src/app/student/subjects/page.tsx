export const instant = false;
import { Suspense } from "react";
import SubjectsClient from "./SubjectsClient";

export default function StudentSubjectsPage() {
  return <Suspense><SubjectsClient /></Suspense>;
}
