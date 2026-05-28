"use client";

import DangerButton from "./DangerButton";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const ConfirmButton = variant === "danger" ? DangerButton : PrimaryButton;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="text-xl font-bold tracking-tight text-gray-900"
        >
          {title}
        </h2>

        {description && (
          <p
            id="confirm-dialog-description"
            className="mt-3 text-sm leading-6 text-gray-600"
          >
            {description}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onCancel} className="px-4 py-2">
            {cancelLabel}
          </SecondaryButton>

          <ConfirmButton onClick={onConfirm} className="px-4 py-2">
            {confirmLabel}
          </ConfirmButton>
        </div>
      </div>
    </div>
  );
}
