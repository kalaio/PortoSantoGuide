"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import {
  ADMIN_FIELD_ERROR_CLASS,
  ADMIN_SLIDE_ACTIONS_CLASS,
  ADMIN_SLIDE_CARD_CLASS,
  ADMIN_SLIDE_HEADER_CLASS,
  ADMIN_SLIDE_LIST_CLASS,
  ADMIN_SLIDE_PREVIEW_CLASS,
  ADMIN_SLIDE_PREVIEW_IMAGE_CLASS,
  ADMIN_SLIDE_PREVIEW_PLACEHOLDER_CLASS,
  ADMIN_SLIDE_UPLOAD_FIELD_CLASS,
  ADMIN_SLIDE_UPLOAD_META_CLASS,
  ADMIN_SLIDE_UPLOAD_TRIGGER_CLASS,
  ADMIN_NATIVE_HIDDEN_CLASS,
  joinAdminClassNames
} from "@/app/(admin)/components/admin-tailwind";
import { CheckboxField, Field, FormSection, SelectInput, TextInput } from "@/components/ui";
import type { ListingPhotoDraft, ListingPhotoSectionOption } from "./types";

type UploadResponse = {
  assetId: string;
  path: string;
  thumbPath: string | null;
  width: number | null;
  height: number | null;
};

type ListingPhotosSectionProps = {
  photos: ListingPhotoDraft[];
  photoSections: ListingPhotoSectionOption[];
  isLoading: boolean;
  onChange: (next: ListingPhotoDraft[]) => void;
};

function normalizePhotoDrafts(photos: ListingPhotoDraft[]) {
  let hasCover = false;

  return [...photos]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((photo, index) => {
      const isCover = !hasCover && (photo.isCover || index === 0);

      if (isCover) {
        hasCover = true;
      }

      return {
        ...photo,
        sortOrder: index,
        isCover
      };
    });
}

export default function ListingPhotosSection({
  photos,
  photoSections,
  isLoading,
  onChange
}: ListingPhotosSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/listing-photos/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Upload failed.");
    }

    return (await response.json()) as UploadResponse;
  }

  async function handleSelectFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploaded = await Promise.all([...fileList].map((file) => uploadFile(file)));
      const nextPhotos = normalizePhotoDrafts([
        ...photos,
        ...uploaded.map((photo, index) => ({
          id: crypto.randomUUID(),
          assetId: photo.assetId,
          path: photo.path,
          thumbnailPath: photo.thumbPath,
          alt: "",
          width: photo.width,
          height: photo.height,
          sortOrder: photos.length + index,
          isCover: photos.length === 0 && index === 0,
          photoSectionId: null
        }))
      ]);

      onChange(nextPhotos);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <FormSection title="Photos">
      <div className={ADMIN_SLIDE_UPLOAD_FIELD_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <strong className="text-primary">Upload photos</strong>
            <p className="m-0 text-tertiary">Add all gallery photos for this listing. The first one becomes the cover if none is selected.</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className={joinAdminClassNames("listingPhotosInput", ADMIN_NATIVE_HIDDEN_CLASS)}
            disabled={isLoading || isUploading}
            onChange={(event) => {
              void handleSelectFiles(event.target.files);
            }}
          />
          <Button
            type="button"
            color="secondary"
            size="md"
            className={ADMIN_SLIDE_UPLOAD_TRIGGER_CLASS}
            isDisabled={isLoading || isUploading}
            isLoading={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {photos.length > 0 ? "Add more photos" : "Upload photos"}
          </Button>
        </div>
        <p className={ADMIN_SLIDE_UPLOAD_META_CLASS}>JPG, PNG, WEBP, AVIF up to 8MB each.</p>
        {uploadError ? <p className={ADMIN_FIELD_ERROR_CLASS}>{uploadError}</p> : null}
      </div>

      <div className={ADMIN_SLIDE_LIST_CLASS}>
        {photos.length === 0 ? <p className="m-0 text-tertiary">No photos yet.</p> : null}
        {photos.map((photo, index) => (
          <article key={photo.id} className={ADMIN_SLIDE_CARD_CLASS}>
            <div className={ADMIN_SLIDE_HEADER_CLASS}>
              <strong>{photo.isCover ? `Cover photo ${index + 1}` : `Photo ${index + 1}`}</strong>
              <div className={ADMIN_SLIDE_ACTIONS_CLASS}>
                <Button
                  type="button"
                  color="secondary"
                  size="md"
                  isDisabled={isLoading || index === 0}
                  onClick={() => {
                    const nextPhotos = [...photos];
                    const [item] = nextPhotos.splice(index, 1);
                    nextPhotos.splice(index - 1, 0, item);
                    onChange(normalizePhotoDrafts(nextPhotos));
                  }}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  color="secondary"
                  size="md"
                  isDisabled={isLoading || index === photos.length - 1}
                  onClick={() => {
                    const nextPhotos = [...photos];
                    const [item] = nextPhotos.splice(index, 1);
                    nextPhotos.splice(index + 1, 0, item);
                    onChange(normalizePhotoDrafts(nextPhotos));
                  }}
                >
                  Down
                </Button>
                <Button
                  type="button"
                  color="primary-destructive"
                  size="md"
                  isDisabled={isLoading}
                  onClick={() => {
                    onChange(normalizePhotoDrafts(photos.filter((item) => item.id !== photo.id)));
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] max-[640px]:grid-cols-1">
              <div className={joinAdminClassNames(ADMIN_SLIDE_PREVIEW_CLASS, "aspect-[4/3]")}>
                {photo.path ? (
                  <Image
                    src={photo.thumbnailPath ?? photo.path}
                    alt={photo.alt || `Listing photo ${index + 1}`}
                    width={photo.width ?? 640}
                    height={photo.height ?? 480}
                    className={ADMIN_SLIDE_PREVIEW_IMAGE_CLASS}
                  />
                ) : (
                  <span className={ADMIN_SLIDE_PREVIEW_PLACEHOLDER_CLASS}>No preview</span>
                )}
              </div>

              <div className="grid gap-4">
                <Field label="Alt text">
                  <TextInput
                    value={photo.alt}
                    onChange={(value) =>
                      onChange(
                        normalizePhotoDrafts(
                          photos.map((item) =>
                            item.id === photo.id ? { ...item, alt: value } : item
                          )
                        )
                      )
                    }
                  />
                </Field>
                <Field label="Section">
                  <SelectInput
                    value={photo.photoSectionId ?? ""}
                    onChange={(event) =>
                      onChange(
                        normalizePhotoDrafts(
                          photos.map((item) =>
                            item.id === photo.id
                              ? {
                                  ...item,
                                  photoSectionId: event.target.value || null
                                }
                              : item
                          )
                        )
                      )
                    }
                  >
                    <option value="">More photos</option>
                    {photoSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <CheckboxField
                  label="Use as cover photo"
                  checked={photo.isCover}
                  onChange={(checked) => {
                    onChange(
                      normalizePhotoDrafts(
                        photos.map((item) => ({
                          ...item,
                          isCover: item.id === photo.id ? checked : false
                        }))
                      )
                    );
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </FormSection>
  );
}
