export const instant = false;

import AccountantLayoutClient from "./AccountantLayoutClient";

export default function AccountantLayout({ children }: { children: React.ReactNode }) {
  return <AccountantLayoutClient>{children}</AccountantLayoutClient>;
}
