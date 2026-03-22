"use client";

import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Button } from "@/components/ui";

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
  return (
    <Modal
      hideCloseButton={isLoading}
      isDismissable={!isLoading}
      isKeyboardDismissDisabled={isLoading}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onCancel();
        }
      }}
    >
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="muted">{description}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onCancel} disabled={isLoading}>
            No
          </Button>
          <Button variant="danger" type="button" onClick={onConfirm} disabled={isLoading}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
