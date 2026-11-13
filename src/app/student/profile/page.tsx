export const instant = false;
import { Suspense } from "react";
import ProfileClient from "./ProfileClient";

export default function StudentProfilePage() {
  return <Suspense><ProfileClient /></Suspense>;
}
