export const instant = false;
import { Suspense } from "react";
import FeesClient from "./FeesClient";

export default function StudentFeesPage() {
  return <Suspense><FeesClient /></Suspense>;
}
