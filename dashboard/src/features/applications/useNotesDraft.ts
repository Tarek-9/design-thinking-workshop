import { useCallback, useEffect, useState } from 'react';

import type { Application } from '@/domain/application';
import { NOTES_DEBOUNCE_MS } from '@/domain/application';

export type NotesDraft = {
  applicationId: string;
  text: string;
};

export type NotesField = {
  draft: NotesDraft | null;
  onChange: (applicationId: string, text: string) => void;
};

// A draft wins over the cache: the live stream echoes the Staff member's own
// writes and would overwrite the typing.
export function notesValueFor(
  notes: NotesField,
  application: Pick<Application, 'id' | 'internalNotes'>,
): string {
  return notes.draft?.applicationId === application.id
    ? notes.draft.text
    : application.internalNotes;
}

// Lives in the container, so closing the drawer flushes the note. save must
// await the PATCH: the draft is cleared only on success.
export function useNotesDraft(
  save: (applicationId: string, text: string) => Promise<unknown>,
): NotesField {
  const [draft, setDraft] = useState<NotesDraft | null>(null);

  const send = useCallback(
    (pending: NotesDraft) => {
      void save(pending.applicationId, pending.text).then(
        () => {
          // Cleared only if nothing was typed since the request left.
          setDraft((current) =>
            current !== null &&
            current.applicationId === pending.applicationId &&
            current.text === pending.text
              ? null
              : current,
          );
        },
        () => {
          // The mutation reports the failure; the text stays in the field.
        },
      );
    },
    [save],
  );

  useEffect(() => {
    if (draft === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      send(draft);
    }, NOTES_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, send]);

  // Sends the pending note: the Staff member left it by clicking the next row.
  const onChange = useCallback(
    (applicationId: string, text: string) => {
      if (draft !== null && draft.applicationId !== applicationId) {
        send(draft);
      }

      setDraft({ applicationId, text });
    },
    [draft, send],
  );

  return { draft, onChange };
}
