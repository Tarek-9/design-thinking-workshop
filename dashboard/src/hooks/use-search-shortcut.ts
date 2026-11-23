// SearchField shows the ⌘K hint on every screen, so the shortcut works on all of them.

import type { RefObject } from 'react';
import { useEffect } from 'react';

export function useSearchShortcut(
  inputRef: RefObject<HTMLInputElement | null>,
): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef]);
}
