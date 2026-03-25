"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import {
  ADMIN_ACTIONS_CLASS,
  ADMIN_FORM_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_FORM_SECTION_TIGHT_CLASS,
  ADMIN_LOGIN_CARD_CLASS,
  ADMIN_LOGIN_PAGE_CLASS,
  ADMIN_PAGE_CLASS
} from "@/app/(admin)/components/admin-tailwind";
import { Card, Field, FormSection, TextInput } from "@/components/ui";

const DEFAULT_ADMIN_REDIRECT_PATH = "/admin/listings";

function toSafeAdminRedirectPath(rawPath: string | null) {
  if (!rawPath) {
    return DEFAULT_ADMIN_REDIRECT_PATH;
  }

  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return DEFAULT_ADMIN_REDIRECT_PATH;
  }

  if (!rawPath.startsWith("/admin")) {
    return DEFAULT_ADMIN_REDIRECT_PATH;
  }

  return rawPath;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setErrorMessage(payload.error ?? "Could not sign in.");
      return;
    }

    const nextPath =
      typeof window !== "undefined"
        ? toSafeAdminRedirectPath(new URLSearchParams(window.location.search).get("next"))
        : DEFAULT_ADMIN_REDIRECT_PATH;
    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className={`${ADMIN_PAGE_CLASS} ${ADMIN_LOGIN_PAGE_CLASS}`}>
      <Card as="section" className={ADMIN_LOGIN_CARD_CLASS} title="Admin Login" description="Sign in to manage listings.">
        <FormSection title="Credentials" className={ADMIN_FORM_SECTION_TIGHT_CLASS}>
          <form className={ADMIN_FORM_CLASS} onSubmit={onSubmit}>
            <Field label="Username">
              <TextInput value={username} onChange={setUsername} required />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                value={password}
                onChange={setPassword}
                required
              />
            </Field>
            <div className={ADMIN_ACTIONS_CLASS}>
              <Button type="submit" size="md" isDisabled={isLoading}>
                Sign in
              </Button>
            </div>
          </form>
        </FormSection>
        {errorMessage ? <p className={ADMIN_STATUS_MESSAGE_CLASS}>{errorMessage}</p> : null}
      </Card>
    </main>
  );
}
