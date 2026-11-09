export const instant = false;

import { Suspense } from "react";
import AccountantLayoutClient from "./AccountantLayoutClient";

export default function AccountantLayout({ children }: { children: React.ReactNode }) {
  return <Suspense><AccountantLayoutClient>{children}</AccountantLayoutClient></Suspense>;
}
