"use client";

import { useMemo, useState } from "react";
import AdminFormActions, { ADMIN_ACTION_BUTTON_CLASS } from "@/app/(admin)/components/AdminFormActions";
import { Button } from "@/components/base/buttons/button";
import {
  ADMIN_LAYOUT_GRID_CLASS,
  ADMIN_LIST_GRID_CLASS,
  ADMIN_LIST_ITEM_ACTIVE_CLASS,
  ADMIN_LIST_ITEM_CLASS,
  ADMIN_PANEL_CLASS,
  ADMIN_FORM_SECTION_TIGHT_CLASS,
  ADMIN_FORM_CLASS,
  ADMIN_REQUIRED_LEGEND_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_STATUS_MESSAGE_ERROR_CLASS,
  joinAdminClassNames
} from "@/app/(admin)/components/admin-tailwind";
import DeleteConfirmModal from "@/app/(admin)/components/DeleteConfirmModal";
import { Badge, Card, Field, FormSection, SelectInput, TextInput } from "@/components/ui";

type SliderRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
};

type Props = {
  initialSliders: SliderRow[];
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

export default function SlidersAdminClient({ initialSliders }: Props) {
  const [sliders, setSliders] = useState<SliderRow[]>(initialSliders);
  const [selectedId, setSelectedId] = useState<string | null>(initialSliders[0]?.id ?? null);
  const [message, setMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editName, setEditName] = useState(initialSliders[0]?.name ?? "");
  const [editSlug, setEditSlug] = useState(initialSliders[0]?.slug ?? "");
  const [editIsActive, setEditIsActive] = useState(initialSliders[0]?.isActive ?? true);

  const selectedSlider = useMemo(
    () => sliders.find((slider) => slider.id === selectedId) ?? null,
    [sliders, selectedId]
  );

  const pendingDeleteSlider = useMemo(
    () => sliders.find((slider) => slider.id === pendingDeleteId) ?? null,
    [sliders, pendingDeleteId]
  );

  function syncEditForm(id: string | null, source: SliderRow[]) {
    const found = source.find((slider) => slider.id === id) ?? null;
    setEditName(found?.name ?? "");
    setEditSlug(found?.slug ?? "");
    setEditIsActive(found?.isActive ?? true);
    setHasTriedSubmit(false);
  }

  const validationErrors = getValidationErrors(editName, editSlug);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  async function onUpdate(id: string) {
    setHasTriedSubmit(true);

    if (hasValidationErrors) {
      setMessage("Please complete the required fields.");
      setStatusTone("error");
      return;
    }

    setMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/sliders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        slug: editSlug,
        isActive: editIsActive
      })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error ?? "Could not update slider.");
      setStatusTone("error");
      return;
    }

    const payload = (await response.json()) as { data: SliderRow };
    const next = sliders.map((slider) => (slider.id === payload.data.id ? payload.data : slider));
    setSliders(next);
    setSelectedId(payload.data.id);
    syncEditForm(payload.data.id, next);
    setMessage("Slider updated.");
    setStatusTone("success");
  }

  function openDeleteDialog(id: string) {
    setPendingDeleteId(id);
    setIsDeleteDialogOpen(true);
  }

  async function onDeleteConfirmed() {
    if (!pendingDeleteId) {
      return;
    }

    setMessage("");
    setStatusTone(null);
    setIsDeleting(true);

    const response = await fetch(`/api/admin/sliders/${pendingDeleteId}`, { method: "DELETE" });
    setIsDeleting(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error ?? "Could not delete slider.");
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      setPendingDeleteId(null);
      return;
    }

    const next = sliders.filter((slider) => slider.id !== pendingDeleteId);
    setSliders(next);
    if (selectedId === pendingDeleteId) {
      const nextId = next[0]?.id ?? null;
      setSelectedId(nextId);
      syncEditForm(nextId, next);
    }

    setIsDeleteDialogOpen(false);
    setPendingDeleteId(null);
    setMessage("Slider deleted.");
    setStatusTone("success");
  }

  return (
    <section className={ADMIN_LAYOUT_GRID_CLASS}>
      <aside className={ADMIN_PANEL_CLASS}>
        <h2>Sliders</h2>
        <div className={ADMIN_LIST_GRID_CLASS}>
          {sliders.map((slider) => (
            <article
              key={slider.id}
              className={joinAdminClassNames(ADMIN_LIST_ITEM_CLASS, selectedId === slider.id && ADMIN_LIST_ITEM_ACTIVE_CLASS)}
              onClick={() => {
                setSelectedId(slider.id);
                syncEditForm(slider.id, sliders);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedId(slider.id);
                  syncEditForm(slider.id, sliders);
                }
              }}
              tabIndex={0}
            >
              <h3>{slider.name}</h3>
              <p className="muted">Slug: {slider.slug}</p>
              <Badge tone={slider.isActive ? "success" : "neutral"}>
                {slider.isActive ? "Active" : "Inactive"}
              </Badge>
            </article>
          ))}
        </div>
      </aside>

      <Card as="section">
        {selectedSlider ? (
          <FormSection title="Edit Slider" className={ADMIN_FORM_SECTION_TIGHT_CLASS}>
            <div className={ADMIN_FORM_CLASS}>
            <p className={ADMIN_REQUIRED_LEGEND_CLASS}>Fields marked with * are required.</p>
            <Field label="Name">
              <TextInput
                value={editName}
                onChange={setEditName}
                isInvalid={hasTriedSubmit && Boolean(validationErrors.name)}
                errorMessage={hasTriedSubmit ? validationErrors.name : undefined}
                required
              />
            </Field>
            <Field label="Slug">
              <TextInput
                value={editSlug}
                onChange={setEditSlug}
                isInvalid={hasTriedSubmit && Boolean(validationErrors.slug)}
                errorMessage={hasTriedSubmit ? validationErrors.slug : undefined}
                required
              />
            </Field>
            <Field label="Status">
              <SelectInput
                value={editIsActive ? "true" : "false"}
                onChange={(event) => setEditIsActive(event.target.value === "true")}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </SelectInput>
            </Field>
            <AdminFormActions
              primaryActions={
                <>
                  <Button color="secondary" size="md" type="button" onClick={() => onUpdate(selectedSlider.id)} className={ADMIN_ACTION_BUTTON_CLASS}>
                    Save Changes
                  </Button>
                  <Button size="md" href={`/admin/slides?sliderId=${selectedSlider.id}`} className={ADMIN_ACTION_BUTTON_CLASS}>
                    Manage Slides
                  </Button>
                </>
              }
              destructiveAction={
                <Button color="primary-destructive" size="md" type="button" onClick={() => openDeleteDialog(selectedSlider.id)} isDisabled={isDeleting} className={ADMIN_ACTION_BUTTON_CLASS}>
                  Delete
                </Button>
              }
            />
            </div>
          </FormSection>
        ) : (
          <FormSection title="Edit Slider">
            <div className={ADMIN_FORM_CLASS}>
              <p className="muted">No sliders yet.</p>
              <AdminFormActions
                primaryActions={<Button size="md" href="/admin/sliders/new" className={ADMIN_ACTION_BUTTON_CLASS}>Create Slider</Button>}
              />
            </div>
          </FormSection>
        )}

        {message ? <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{message}</p> : null}
      </Card>

      <DeleteConfirmModal
        isOpen={isDeleteDialogOpen}
        title="Delete slider?"
        description={`This will permanently delete ${pendingDeleteSlider?.name ?? "this slider"} and all of its slides. This action cannot be undone.`}
        isLoading={isDeleting}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={onDeleteConfirmed}
      />
    </section>
  );
}
