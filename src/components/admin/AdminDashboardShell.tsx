import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ADMIN_CONTENT_CLASS, ADMIN_SHELL_CLASS } from "@/components/admin/admin-tailwind";
import { requireServerAdminUser } from "@/lib/admin-auth-server";

export default async function AdminDashboardShell({ children }: { children: ReactNode }) {
  const user = await requireServerAdminUser();

  return (
    <div className={ADMIN_SHELL_CLASS}>
      <AdminSidebar user={{ username: user.username, role: user.role }} />
      <div className={ADMIN_CONTENT_CLASS}>{children}</div>
    </div>
  );
}
