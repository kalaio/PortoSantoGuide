"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onLogout() {
    setIsLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button className="w-full justify-center" color="secondary" size="md" type="button" onClick={onLogout} isDisabled={isLoading} isLoading={isLoading}>
      Logout
    </Button>
  );
}
