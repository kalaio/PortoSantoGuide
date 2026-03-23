import type { ReactNode } from "react";
import AdminDashboardShell from "@/components/admin/AdminDashboardShell";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
