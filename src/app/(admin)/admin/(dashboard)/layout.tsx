import type { ReactNode } from "react";
import AdminDashboardShell from "@/app/(admin)/components/AdminDashboardShell";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
