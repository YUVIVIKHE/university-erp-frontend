export const instant = false;

import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return <Suspense><DashboardClient /></Suspense>;
}
