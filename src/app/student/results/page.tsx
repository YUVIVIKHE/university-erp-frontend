export const instant = false;
import { Suspense } from "react";
import ResultsClient from "./ResultsClient";

export default function StudentResultsPage() {
  return <Suspense><ResultsClient /></Suspense>;
}
