'use client';

import React, { useState } from 'react';
import ModalDialog from '@/components/ui/ModalDialog';

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      autoFocusClose={false}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            autoFocus
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => void handleConfirm()}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="card-subtitle">{description}</p>
    </ModalDialog>
  );
}
