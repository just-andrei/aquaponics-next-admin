import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function LoginLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}
