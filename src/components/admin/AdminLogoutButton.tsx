"use client";

import { LogOut01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

export default function AdminLogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onLogout() {
    setIsLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    iconOnly ? (
      <ButtonUtility
        color="tertiary"
        size="sm"
        icon={LogOut01}
        tooltip="Log out"
        isDisabled={isLoading}
        onClick={onLogout}
      />
    ) : (
      <Button className="w-full justify-center" color="secondary" size="md" type="button" onClick={onLogout} isDisabled={isLoading} isLoading={isLoading}>
        Logout
      </Button>
    )
  );
}
