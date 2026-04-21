import type { ListingPhoto, ListingPhotoSectionSummary } from "@/types/listing";

export type NormalizedListingPhotoPayload = {
  assetId: string;
  photoSectionId: string | null;
  alt: string | null;
  sortOrder: number;
  isCover: boolean;
};

type ListingPhotoPayloadInput = {
  assetId: string;
  photoSectionId?: string | null;
  alt?: string | null;
  sortOrder: number;
  isCover?: boolean;
};

export function normalizeListingPhotoPayload(
  photos: ListingPhotoPayloadInput[] | undefined
): NormalizedListingPhotoPayload[] {
  const normalized = (photos ?? [])
    .map((photo, index) => ({
      assetId: photo.assetId,
      photoSectionId: photo.photoSectionId ?? null,
      alt: photo.alt?.trim() ? photo.alt.trim() : null,
      sortOrder: Number.isFinite(photo.sortOrder) ? photo.sortOrder : index,
      isCover: photo.isCover ?? false
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (normalized.length === 0) {
    return normalized;
  }

  let coverAssigned = false;

  return normalized.map((photo, index) => {
    const shouldBeCover = !coverAssigned && (photo.isCover || index === 0);

    if (shouldBeCover) {
      coverAssigned = true;
    }

    return {
      ...photo,
      sortOrder: index,
      isCover: shouldBeCover
    };
  });
}

export function groupListingPhotosBySection(
  photos: ListingPhoto[],
  sections: ListingPhotoSectionSummary[]
): Array<{ section: ListingPhotoSectionSummary | null; photos: ListingPhoto[] }> {
  const photosBySectionId = new Map<string, ListingPhoto[]>();
  const unsectionedPhotos: ListingPhoto[] = [];

  photos.forEach((photo) => {
    if (!photo.section) {
      unsectionedPhotos.push(photo);
      return;
    }

    const current = photosBySectionId.get(photo.section.id) ?? [];
    current.push(photo);
    photosBySectionId.set(photo.section.id, current);
  });

  const grouped: Array<{ section: ListingPhotoSectionSummary | null; photos: ListingPhoto[] }> = sections
    .map((section) => ({
      section,
      photos: photosBySectionId.get(section.id) ?? []
    }))
    .filter((group) => group.photos.length > 0);

  if (unsectionedPhotos.length > 0) {
    grouped.push({
      section: null,
      photos: unsectionedPhotos
    });
  }

  return grouped;
}

export function getListingPhotoSectionLabel(section: ListingPhotoSectionSummary | null) {
  return section?.label ?? "More photos";
}
