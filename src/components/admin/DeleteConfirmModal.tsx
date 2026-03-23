"use client";

import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";

type DeleteConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  isOpen,
  title,
  description = "This action cannot be undone.",
  confirmLabel = "Yes, delete",
  isLoading = false,
  onCancel,
  onConfirm
}: DeleteConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable={!isLoading}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isLoading) {
          onCancel();
        }
      }}
      className="z-[120]"
    >
      <Modal className="max-w-[26rem]">
        <Dialog className="grid w-full gap-4 rounded-[1.5rem] border border-[color:var(--admin-border)] bg-white p-6 shadow-[0_24px_60px_rgba(10,13,18,0.16)]">
          <div className="grid gap-2">
            <h3 className="m-0 text-xl font-semibold text-[color:var(--admin-text)]">{title}</h3>
            <p className="m-0 text-[color:var(--admin-muted)]">{description}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3 [&>*]:min-w-[8.5rem] [&>*]:justify-center">
            <Button color="secondary" size="md" type="button" onClick={onCancel} isDisabled={isLoading}>
              No
            </Button>
            <Button color="primary-destructive" size="md" type="button" onClick={onConfirm} isDisabled={isLoading} isLoading={isLoading}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
