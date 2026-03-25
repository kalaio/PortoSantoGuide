"use client";

import {
  ADMIN_FIELD_ERROR_CLASS,
  ADMIN_MAP_BLOCK_CLASS,
  ADMIN_MAP_INVALID_CLASS,
  ADMIN_MAP_NOTE_CLASS,
  ADMIN_MAP_PICKER_CLASS,
  joinAdminClassNames
} from "@/app/(admin)/components/admin-tailwind";
import { Field, TextInput } from "@/components/ui";

type ListingLocationSectionProps = {
  latitude: string;
  longitude: string;
  mapNodeRef: React.RefObject<HTMLDivElement | null>;
  required?: boolean;
  errorMessage?: string;
};

export default function ListingLocationSection({
  latitude,
  longitude,
  mapNodeRef,
  required = false,
  errorMessage
}: ListingLocationSectionProps) {
  return (
    <>
      <div className={ADMIN_MAP_BLOCK_CLASS}>
        <p className={ADMIN_MAP_NOTE_CLASS}>
          Click on the map or drag the marker to set and refine the location.
        </p>
        <div ref={mapNodeRef} className={joinAdminClassNames(ADMIN_MAP_PICKER_CLASS, errorMessage && ADMIN_MAP_INVALID_CLASS)} />
      </div>
      <Field label="Latitude">
        <TextInput type="number" step="0.000001" value={latitude} readOnly required={required} />
      </Field>
      <Field label="Longitude">
        <TextInput type="number" step="0.000001" value={longitude} readOnly required={required} />
      </Field>
      {errorMessage ? <p className={ADMIN_FIELD_ERROR_CLASS}>{errorMessage}</p> : null}
    </>
  );
}
