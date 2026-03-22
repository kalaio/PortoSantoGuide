import type { ReactNode } from "react";
import AdminDashboardShell from "@/components/admin/AdminDashboardShell";
import HeroUiRootProvider from "@/components/providers/HeroUiRootProvider";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <HeroUiRootProvider>
      <AdminDashboardShell>{children}</AdminDashboardShell>
    </HeroUiRootProvider>
  );
}
