import { useCallback, useMemo } from 'react';

import type { ApplicationEdit } from '@/domain/application';
import { useEditApplication, useSetDiscarded } from '@/queries/applications';

import type { NotesField } from './useNotesDraft';
import { useNotesDraft } from './useNotesDraft';

export type ApplicationWrites = {
  onEdit: (id: string, change: ApplicationEdit) => void;
  onDiscard: (ids: ReadonlySet<string>) => void;
  notes: NotesField;
};

export function useApplicationWrites(now: Date): ApplicationWrites {
  const { mutate: edit, mutateAsync: editAndWait } = useEditApplication();
  const { mutate: setDiscarded } = useSetDiscarded();

  const onEdit = useCallback(
    (id: string, change: ApplicationEdit) => {
      edit({ id, change });
    },
    [edit],
  );

  // Stamped from the reference date, so a test sees the date it injected.
  const onDiscard = useCallback(
    (ids: ReadonlySet<string>) => {
      setDiscarded({ ids, discardedAt: now.toISOString() });
    },
    [setDiscarded, now],
  );

  // The note waits for its request: the draft is kept on failure.
  const saveNotes = useCallback(
    (id: string, internalNotes: string) =>
      editAndWait({ id, change: { internalNotes } }),
    [editAndWait],
  );

  const notes = useNotesDraft(saveNotes);

  return useMemo(
    () => ({ onEdit, onDiscard, notes }),
    [onEdit, onDiscard, notes],
  );
}
