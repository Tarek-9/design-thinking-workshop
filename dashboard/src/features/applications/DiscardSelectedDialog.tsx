import { Archive } from '@untitledui/icons';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { de } from '@/content/de';

type DiscardSelectedDialogProps = {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DiscardSelectedDialog({
  count,
  onConfirm,
  onCancel,
}: DiscardSelectedDialogProps) {
  return (
    <ConfirmDialog
      icon={Archive}
      // Discarding takes nothing away, so the confirm button is not destructive.
      destructive={false}
      title={de.applications.confirmDiscardSelected(count)}
      description={de.applications.confirmDiscardSelectedHint(count)}
      confirmLabel={de.applications.discard}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
