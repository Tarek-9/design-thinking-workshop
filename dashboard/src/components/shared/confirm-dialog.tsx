/** Replaces window.confirm, which cannot show the consequence. Focus starts on the dialog, so a stray Enter confirms nothing. */

import { AlertTriangle } from '@untitledui/icons';
import type { FC } from 'react';
import {
  Dialog as AriaDialog,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import { cx } from '@/utils/cx';

type ConfirmDialogProps = {
  title: string;
  description?: string;
  /** Names the action, never "OK". */
  confirmLabel: string;
  /** On by default: every confirmation is about something taken away. */
  destructive?: boolean;
  icon?: FC<{ className?: string }>;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = true,
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AriaModalOverlay
      isDismissable
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
      className="bg-overlay/40 data-[entering]:overlay-entering data-[exiting]:overlay-exiting fixed inset-0 z-50 flex items-end justify-center p-4 backdrop-blur-[2px] sm:items-center"
    >
      <AriaModal className="data-[entering]:dialog-entering data-[exiting]:dialog-exiting w-full max-w-md">
        <AriaDialog
          role="alertdialog"
          className="bg-primary ring-secondary flex flex-col gap-5 rounded-2xl p-6 shadow-lg ring-1 outline-none"
        >
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className={cx(
                'flex size-11 shrink-0 items-center justify-center rounded-xl ring-1',
                destructive
                  ? 'bg-error-primary ring-utility-red-200'
                  : 'bg-secondary ring-secondary',
              )}
            >
              <Icon
                className={cx(
                  'size-5',
                  destructive ? 'text-fg-error-primary' : 'text-fuut-purple',
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <AriaHeading
                slot="title"
                className="text-text-primary tracking-heading text-lg font-semibold"
              >
                {title}
              </AriaHeading>
              {description === undefined ? null : (
                <p className="text-text-tertiary mt-1 text-sm leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Column-reverse on a phone keeps the harmless answer nearest the thumb. */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {/* Cancel comes first in the DOM, so Tab reaches it before the destructive answer. */}
            <Button size="md" color="secondary" onClick={onCancel}>
              {de.confirm.cancel}
            </Button>
            <Button
              size="md"
              color={destructive ? 'primary-destructive' : 'primary'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}
