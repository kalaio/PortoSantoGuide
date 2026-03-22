"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  ADMIN_ACTIONS_CLASS,
  ADMIN_FORM_CLASS,
  ADMIN_PANEL_CLASS,
  ADMIN_REQUIRED_LEGEND_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_STATUS_MESSAGE_ERROR_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";
import { Button, ButtonLink, Field, TextInput } from "@/components/ui";

type ApiError = {
  error?: string;
};

type SliderValidationErrors = {
  name?: string;
  slug?: string;
};

function getValidationErrors(name: string, slug: string): SliderValidationErrors {
  const errors: SliderValidationErrors = {};

  if (name.trim().length === 0) {
    errors.name = "Name is required.";
  } else if (name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (slug.trim().length === 0) {
    errors.slug = "Slug is required.";
  } else if (slug.trim().length < 2) {
    errors.slug = "Slug must be at least 2 characters.";
  }

  return errors;
}

export default function CreateSliderClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const validationErrors = getValidationErrors(name, slug);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasTriedSubmit(true);

    if (hasValidationErrors) {
      setMessage("Please complete the required fields.");
      setStatusTone("error");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setStatusTone(null);

    const response = await fetch("/api/admin/sliders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug
      })
    });

    setIsLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as ApiError;
      setMessage(payload.error ?? "Could not create slider.");
      setStatusTone("error");
      return;
    }

    router.push("/admin/sliders");
    router.refresh();
  }

  return (
    <section className={ADMIN_PANEL_CLASS}>
      <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
      <form className={ADMIN_FORM_CLASS} onSubmit={onCreate} noValidate>
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            isInvalid={hasTriedSubmit && Boolean(validationErrors.name)}
            errorMessage={hasTriedSubmit ? validationErrors.name : undefined}
            required
            minLength={2}
          />
        </Field>
        <Field label="Slug">
          <TextInput
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            isInvalid={hasTriedSubmit && Boolean(validationErrors.slug)}
            errorMessage={hasTriedSubmit ? validationErrors.slug : undefined}
            required
            minLength={2}
          />
        </Field>

        <div className={ADMIN_ACTIONS_CLASS}>
          <Button type="submit" disabled={isLoading}>
            Create slider
          </Button>
          <ButtonLink variant="secondary" href="/admin/sliders">
            Cancel
          </ButtonLink>
        </div>
      </form>

      {message ? <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{message}</p> : null}
    </section>
  );
}
