// Shared by both screens, so the bulk confirmation and selection cannot drift apart.

import { useState } from 'react';

import type { Application, ApplicationEdit } from '@/domain/application';

type UseApplicationActionsOptions = {
  applications: readonly Application[];
  onEdit: (id: string, change: ApplicationEdit) => void;
  // Owned by App: discardedAt is a field on the one list every screen reads.
  onDiscard: (ids: ReadonlySet<string>) => void;
};

export function useApplicationActions({
  applications,
  onEdit,
  onDiscard,
}: UseApplicationActionsOptions) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  // The bulk discard waits here while the screen's dialog asks the question.
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const selected =
    applications.find((application) => application.id === selectedId) ?? null;

  function close(): void {
    setSelectedId(null);
  }

  function toggle(id: string): void {
    setSelectedId((current) => (current === id ? null : id));
  }

  function forget(ids: ReadonlySet<string>): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  }

  function discard(ids: ReadonlySet<string>): void {
    onDiscard(ids);
    if (selectedId !== null && ids.has(selectedId)) {
      close();
    }
    forget(ids);
  }

  // Only bulk discard asks; a single row is undone from the fourth screen.
  function discardSelected(): void {
    if (selectedIds.size > 0) {
      setDiscardConfirmOpen(true);
    }
  }

  function confirmDiscardSelected(): void {
    setDiscardConfirmOpen(false);
    discard(selectedIds);
  }

  function cancelDiscardSelected(): void {
    setDiscardConfirmOpen(false);
  }

  return {
    selected,
    selectedId,
    selectedIds,
    setSelectedIds,
    open: setSelectedId,
    toggle,
    close,
    update: onEdit,
    discard,
    discardSelected,
    discardConfirmOpen,
    confirmDiscardSelected,
    cancelDiscardSelected,
  };
}
