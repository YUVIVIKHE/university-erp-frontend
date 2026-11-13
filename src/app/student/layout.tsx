export const instant = false;
import { Suspense } from "react";
import StudentLayoutClient from "./StudentLayoutClient";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <Suspense><StudentLayoutClient>{children}</StudentLayoutClient></Suspense>;
}
