export const instant = false;

import { Suspense } from "react";
import NewFeeClient from "./NewFeeClient";

export default function NewFeePage() {
  return <Suspense><NewFeeClient /></Suspense>;
}
