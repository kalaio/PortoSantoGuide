"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onLogout() {
    setIsLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    setIsLoading(false);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button fullWidth variant="secondary" type="button" onClick={onLogout} disabled={isLoading}>
      Logout
    </Button>
  );
}
