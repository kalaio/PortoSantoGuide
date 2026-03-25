"use client";

import { useRef } from "react";
import { Button } from "@/components/base/buttons/button";
import { ADMIN_NATIVE_HIDDEN_CLASS, joinAdminClassNames } from "@/app/(admin)/components/admin-tailwind";

type FileTriggerButtonProps = {
  accept?: string;
  disabled?: boolean;
  uploading?: boolean;
  idleLabel: string;
  uploadingLabel?: string;
  onSelect: (file: File) => Promise<void> | void;
  className?: string;
};

export default function FileTriggerButton({
  accept,
  disabled = false,
  uploading = false,
  idleLabel,
  uploadingLabel = "Uploading...",
  onSelect,
  className
}: FileTriggerButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isDisabled = disabled || uploading;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        className={joinAdminClassNames("uiFileInputHidden", ADMIN_NATIVE_HIDDEN_CLASS)}
        type="file"
        accept={accept}
        disabled={isDisabled}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          await onSelect(file);
          event.target.value = "";
        }}
      />

      <Button
        type="button"
        color="secondary"
        size="sm"
        isDisabled={isDisabled}
        className={uploading ? "isUploading" : undefined}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? uploadingLabel : idleLabel}
      </Button>
    </div>
  );
}
