"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import AdminFormActions, { ADMIN_ACTION_BUTTON_CLASS } from "@/components/admin/AdminFormActions";
import { Button } from "@/components/base/buttons/button";
import {
  ADMIN_LAYOUT_GRID_CLASS,
  ADMIN_LIST_GRID_CLASS,
  ADMIN_LIST_ITEM_ACTIVE_CLASS,
  ADMIN_LIST_ITEM_CLASS,
  ADMIN_PANEL_CLASS,
  ADMIN_SLIDE_ACTIONS_CLASS,
  ADMIN_SLIDE_CARD_CLASS,
  ADMIN_SLIDE_HEADER_CLASS,
  ADMIN_SLIDE_LIST_CLASS,
  ADMIN_SLIDE_MEDIA_ROW_CLASS,
  ADMIN_SLIDE_META_GRID_CLASS,
  ADMIN_SLIDE_PREVIEW_CLASS,
  ADMIN_SLIDE_PREVIEW_DESKTOP_CLASS,
  ADMIN_SLIDE_PREVIEW_IMAGE_CLASS,
  ADMIN_SLIDE_PREVIEW_MOBILE_CLASS,
  ADMIN_SLIDE_PREVIEW_PLACEHOLDER_CLASS,
  ADMIN_SLIDE_STATUS_FIELD_CLASS,
  ADMIN_SLIDE_UPLOAD_FIELD_CLASS,
  ADMIN_SLIDE_UPLOAD_HEADER_CLASS,
  ADMIN_SLIDE_UPLOAD_HINT_CLASS,
  ADMIN_SLIDE_UPLOAD_META_CLASS,
  ADMIN_SLIDE_UPLOAD_TRIGGER_CLASS,
  ADMIN_STATUS_MESSAGE_CLASS,
  ADMIN_STATUS_MESSAGE_ERROR_CLASS,
  joinAdminClassNames
} from "@/components/admin/admin-tailwind";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { Field, FileTriggerButton, FormSection, SelectInput, TextArea, TextInput } from "@/components/ui";

type Slider = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
};

type Slide = {
  id: string;
  title: string | null;
  description: string | null;
  mediaDesktop: string | null;
  mediaDesktopThumb: string | null;
  mediaMobile: string | null;
  mediaMobileThumb: string | null;
  videoUrl: string | null;
  order: number;
  isActive: boolean;
};

type UploadKind = "desktop" | "mobile";

type Props = {
  initialSliders: Slider[];
  initialSelectedId: string | null;
  initialSlides: Slide[];
};

export default function SlidesAdminClient({
  initialSliders,
  initialSelectedId,
  initialSlides
}: Props) {
  const [sliders] = useState<Slider[]>(initialSliders);
  const [selectedSliderId, setSelectedSliderId] = useState<string | null>(initialSelectedId);
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [message, setMessage] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "success" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"load" | "create" | "delete" | null>(null);
  const [uploadingByKey, setUploadingByKey] = useState<Record<string, boolean>>({});
  const [lastUploadedFilenameByKey, setLastUploadedFilenameByKey] = useState<Record<string, string>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteSlideId, setPendingDeleteSlideId] = useState<string | null>(null);
  const sliderRequestIdRef = useRef(0);

  const selectedSlider = useMemo(
    () => sliders.find((slider) => slider.id === selectedSliderId) ?? null,
    [sliders, selectedSliderId]
  );

  const pendingDeleteSlide = useMemo(
    () => slides.find((slide) => slide.id === pendingDeleteSlideId) ?? null,
    [pendingDeleteSlideId, slides]
  );

  async function fetchSlides(sliderId: string) {
    const response = await fetch(`/api/admin/sliders/${sliderId}`);
    if (!response.ok) {
      return [] as Slide[];
    }
    const payload = (await response.json()) as { data: { slides: Slide[] } };
    return payload.data.slides ?? [];
  }

  async function handleSelectSlider(sliderId: string) {
    if (sliderId === selectedSliderId) {
      return;
    }

    const requestId = sliderRequestIdRef.current + 1;
    sliderRequestIdRef.current = requestId;

    setSelectedSliderId(sliderId);
    setMessage("");
    setStatusTone(null);
    setActiveAction("load");
    setIsLoading(true);
    const nextSlides = await fetchSlides(sliderId);

    if (sliderRequestIdRef.current !== requestId) {
      return;
    }

    setSlides(nextSlides);
    setIsLoading(false);
    setActiveAction(null);
  }

  async function handleCreateSlide() {
    if (!selectedSliderId) {
      return;
    }
    setActiveAction("create");
    setIsLoading(true);
    setMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/sliders/${selectedSliderId}/slides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error ?? "Could not create slide.");
      setStatusTone("error");
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    const payload = (await response.json()) as { data: Slide };
    setSlides([...slides, payload.data].sort((a, b) => a.order - b.order));
    setIsLoading(false);
    setActiveAction(null);
  }

  async function handleUpdateSlide(id: string, patch: Partial<Slide>) {
    setIsLoading(true);
    setMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/slides/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error ?? "Could not update slide.");
      setStatusTone("error");
      setIsLoading(false);
      return;
    }

    const payload = (await response.json()) as { data: Slide };
    setSlides(slides.map((slide) => (slide.id === id ? payload.data : slide)));
    setIsLoading(false);
  }

  async function handleDeleteSlide(id: string) {
    setActiveAction("delete");
    setIsLoading(true);
    setMessage("");
    setStatusTone(null);

    const response = await fetch(`/api/admin/slides/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error ?? "Could not delete slide.");
      setStatusTone("error");
      setIsDeleteDialogOpen(false);
      setPendingDeleteSlideId(null);
      setIsLoading(false);
      setActiveAction(null);
      return;
    }

    setSlides(slides.filter((slide) => slide.id !== id));
    setIsDeleteDialogOpen(false);
    setPendingDeleteSlideId(null);
    setIsLoading(false);
    setActiveAction(null);
  }

  function openDeleteDialog(slideId: string) {
    setPendingDeleteSlideId(slideId);
    setIsDeleteDialogOpen(true);
  }

  async function onDeleteConfirmed() {
    if (!pendingDeleteSlideId) {
      return;
    }

    await handleDeleteSlide(pendingDeleteSlideId);
  }

  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/slides/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Upload failed.");
    }

    const payload = (await response.json()) as { path: string; thumbPath: string | null };
    return payload;
  }

  function getUploadKey(slideId: string, kind: UploadKind) {
    return `${slideId}:${kind}`;
  }

  async function handleMediaUpload(slideId: string, kind: UploadKind, file: File) {
    const key = getUploadKey(slideId, kind);

    setUploadingByKey((prev) => ({
      ...prev,
      [key]: true
    }));

    setLastUploadedFilenameByKey((prev) => ({
      ...prev,
      [key]: file.name
    }));

    try {
      const { path, thumbPath } = await handleUpload(file);

      if (kind === "desktop") {
        await handleUpdateSlide(slideId, {
          mediaDesktop: path,
          mediaDesktopThumb: thumbPath
        });
      } else {
        await handleUpdateSlide(slideId, {
          mediaMobile: path,
          mediaMobileThumb: thumbPath
        });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      setStatusTone("error");
    } finally {
      setUploadingByKey((prev) => ({
        ...prev,
        [key]: false
      }));
    }
  }

  async function handleReorder(nextSlides: Slide[]) {
    if (!selectedSliderId) {
      return;
    }

    setSlides(nextSlides);
    await fetch("/api/admin/slides/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sliderId: selectedSliderId,
        orderedIds: nextSlides.map((slide) => slide.id)
      })
    });
  }

  return (
    <section className={ADMIN_LAYOUT_GRID_CLASS}>
      <aside className={ADMIN_PANEL_CLASS}>
        <h2>Sliders</h2>
        <div className={ADMIN_LIST_GRID_CLASS}>
          {sliders.map((slider) => (
            <article
              key={slider.id}
              className={joinAdminClassNames(ADMIN_LIST_ITEM_CLASS, selectedSliderId === slider.id && ADMIN_LIST_ITEM_ACTIVE_CLASS)}
              onClick={() => handleSelectSlider(slider.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSelectSlider(slider.id);
                }
              }}
              tabIndex={0}
            >
              <h3>{slider.name}</h3>
              <p className="muted">Slug: {slider.slug}</p>
            </article>
          ))}
        </div>

        <p className="muted">Select a slider to manage its slides.</p>
      </aside>

      <section className={ADMIN_PANEL_CLASS}>
        <FormSection title={selectedSlider ? `Slides for ${selectedSlider.name}` : "Slides"}>
        {selectedSlider ? (
          <AdminFormActions
            primaryActions={
              <Button type="button" size="md" onClick={handleCreateSlide} isDisabled={isLoading} isLoading={isLoading && activeAction === "create"} className={ADMIN_ACTION_BUTTON_CLASS}>
                Add Slide
              </Button>
            }
          />
        ) : null}

        {slides.length === 0 ? <p className="muted">No slides yet.</p> : null}

        <div className={ADMIN_SLIDE_LIST_CLASS}>
          {slides.map((slide, index) => (
            <div key={slide.id} className={ADMIN_SLIDE_CARD_CLASS}>
              <div className={ADMIN_SLIDE_HEADER_CLASS}>
                <strong>Slide {index + 1}</strong>
                <div className={ADMIN_SLIDE_ACTIONS_CLASS}>
                  <Button
                    type="button"
                    color="secondary"
                    size="md"
                    isDisabled={index === 0}
                    onClick={() => {
                      const next = [...slides];
                      const [item] = next.splice(index, 1);
                      next.splice(index - 1, 0, item);
                      handleReorder(next);
                    }}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    color="secondary"
                    size="md"
                    isDisabled={index === slides.length - 1}
                    onClick={() => {
                      const next = [...slides];
                      const [item] = next.splice(index, 1);
                      next.splice(index + 1, 0, item);
                      handleReorder(next);
                    }}
                  >
                    Down
                  </Button>
                  <Button type="button" color="primary-destructive" size="md" onClick={() => openDeleteDialog(slide.id)} isDisabled={isLoading}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className={ADMIN_SLIDE_META_GRID_CLASS}>
                <Field label="Title" hint="Visible in homepage" fullWidth>
                  <TextInput
                    value={slide.title ?? ""}
                    placeholder="Slide title"
                    onChange={(value) =>
                      setSlides(
                        slides.map((item) =>
                          item.id === slide.id ? { ...item, title: value } : item
                        )
                      )
                    }
                    onBlur={(event) => handleUpdateSlide(slide.id, { title: event.target.value })}
                  />
                </Field>

              <div className={ADMIN_SLIDE_MEDIA_ROW_CLASS}>
                <div className={ADMIN_SLIDE_UPLOAD_FIELD_CLASS} aria-busy={uploadingByKey[getUploadKey(slide.id, "desktop")] ?? false}>
                  <div className={ADMIN_SLIDE_UPLOAD_HEADER_CLASS}>
                    <span>Photo desktop</span>
                    <span className={ADMIN_SLIDE_UPLOAD_HINT_CLASS}>16:10 recommended</span>
                  </div>

                  <div className={joinAdminClassNames(ADMIN_SLIDE_PREVIEW_CLASS, ADMIN_SLIDE_PREVIEW_DESKTOP_CLASS)}>
                    {slide.mediaDesktop ? (
                      <Image
                        className={ADMIN_SLIDE_PREVIEW_IMAGE_CLASS}
                        src={slide.mediaDesktopThumb ?? slide.mediaDesktop}
                        alt="Desktop preview"
                        width={640}
                        height={400}
                      />
                    ) : (
                      <span className={ADMIN_SLIDE_PREVIEW_PLACEHOLDER_CLASS}>No desktop image</span>
                    )}
                  </div>

                  <FileTriggerButton
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className={ADMIN_SLIDE_UPLOAD_TRIGGER_CLASS}
                    disabled={isLoading}
                    uploading={uploadingByKey[getUploadKey(slide.id, "desktop")]}
                    idleLabel={slide.mediaDesktop ? "Replace desktop image" : "Upload desktop image"}
                    onSelect={async (file) => {
                      await handleMediaUpload(slide.id, "desktop", file);
                    }}
                  />

                  <p className={ADMIN_SLIDE_UPLOAD_META_CLASS}>
                    {lastUploadedFilenameByKey[getUploadKey(slide.id, "desktop")] ?? "JPG, PNG, WEBP, AVIF up to 8MB."}
                  </p>
                </div>

                <div className={ADMIN_SLIDE_UPLOAD_FIELD_CLASS} aria-busy={uploadingByKey[getUploadKey(slide.id, "mobile")] ?? false}>
                  <div className={ADMIN_SLIDE_UPLOAD_HEADER_CLASS}>
                    <span>Photo mobile</span>
                    <span className={ADMIN_SLIDE_UPLOAD_HINT_CLASS}>3:4 recommended</span>
                  </div>

                  <div className={joinAdminClassNames(ADMIN_SLIDE_PREVIEW_CLASS, ADMIN_SLIDE_PREVIEW_MOBILE_CLASS)}>
                    {slide.mediaMobile ? (
                      <Image
                        className={ADMIN_SLIDE_PREVIEW_IMAGE_CLASS}
                        src={slide.mediaMobileThumb ?? slide.mediaMobile}
                        alt="Mobile preview"
                        width={360}
                        height={480}
                      />
                    ) : (
                      <span className={ADMIN_SLIDE_PREVIEW_PLACEHOLDER_CLASS}>No mobile image</span>
                    )}
                  </div>

                  <FileTriggerButton
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className={ADMIN_SLIDE_UPLOAD_TRIGGER_CLASS}
                    disabled={isLoading}
                    uploading={uploadingByKey[getUploadKey(slide.id, "mobile")]}
                    idleLabel={slide.mediaMobile ? "Replace mobile image" : "Upload mobile image"}
                    onSelect={async (file) => {
                      await handleMediaUpload(slide.id, "mobile", file);
                    }}
                  />

                  <p className={ADMIN_SLIDE_UPLOAD_META_CLASS}>
                    {lastUploadedFilenameByKey[getUploadKey(slide.id, "mobile")] ?? "JPG, PNG, WEBP, AVIF up to 8MB."}
                  </p>
                </div>
              </div>

                <Field label="Video URL" hint="Optional">
                  <TextInput
                    type="url"
                    value={slide.videoUrl ?? ""}
                    placeholder="https://..."
                    onChange={(value) =>
                      setSlides(
                        slides.map((item) =>
                          item.id === slide.id ? { ...item, videoUrl: value } : item
                        )
                      )
                    }
                    onBlur={(event) => handleUpdateSlide(slide.id, { videoUrl: event.target.value })}
                  />
                </Field>

                <Field label="Status" className={ADMIN_SLIDE_STATUS_FIELD_CLASS}>
                  <SelectInput
                    value={slide.isActive ? "true" : "false"}
                    onChange={(event) =>
                      handleUpdateSlide(slide.id, { isActive: event.target.value === "true" })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </SelectInput>
                </Field>

                <Field label="Description" hint="Optional" fullWidth>
                  <TextArea
                    rows={3}
                    value={slide.description ?? ""}
                    placeholder="Short summary shown with the slide"
                    onChange={(value) =>
                      setSlides(
                        slides.map((item) =>
                          item.id === slide.id ? { ...item, description: value } : item
                        )
                      )
                    }
                    onBlur={(event) => handleUpdateSlide(slide.id, { description: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        {message ? <p className={joinAdminClassNames(ADMIN_STATUS_MESSAGE_CLASS, statusTone === "error" && ADMIN_STATUS_MESSAGE_ERROR_CLASS)}>{message}</p> : null}
        </FormSection>
      </section>

      <DeleteConfirmModal
        isOpen={isDeleteDialogOpen}
        title="Delete slide?"
        description={`This will permanently delete ${pendingDeleteSlide?.title ?? "this slide"}. This action cannot be undone.`}
        isLoading={isLoading && activeAction === "delete"}
        onCancel={() => {
          if (isLoading) {
            return;
          }

          setIsDeleteDialogOpen(false);
          setPendingDeleteSlideId(null);
        }}
        onConfirm={onDeleteConfirmed}
      />
    </section>
  );
}
