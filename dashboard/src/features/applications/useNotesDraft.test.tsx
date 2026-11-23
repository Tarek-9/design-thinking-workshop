import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NOTES_DEBOUNCE_MS } from '@/domain/application';

import { useNotesDraft } from './useNotesDraft';

describe('useNotesDraft', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function pause(ms = NOTES_DEBOUNCE_MS) {
    await act(async () => {
      vi.advanceTimersByTime(ms);
      await Promise.resolve();
    });
  }

  it('sends nothing until typing pauses', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Sch');
    });
    await pause(NOTES_DEBOUNCE_MS - 1);

    expect(save).not.toHaveBeenCalled();

    await pause(1);

    expect(save).toHaveBeenCalledExactlyOnceWith('a1', 'Sch');
  });

  it('sends one request for a burst of keystrokes', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    for (const text of ['S', 'Sc', 'Sch']) {
      act(() => {
        result.current.onChange('a1', text);
      });
      await pause(100);
    }

    await pause();

    expect(save).toHaveBeenCalledExactlyOnceWith('a1', 'Sch');
  });

  it('shows the draft while it is unsent and lets go once it lands', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Rückruf');
    });

    expect(result.current.draft).toEqual({
      applicationId: 'a1',
      text: 'Rückruf',
    });

    await pause();

    expect(result.current.draft).toBeNull();
  });

  // A note that failed to save stays on screen so it can be copied out.
  it('keeps the text when the save fails', async () => {
    const save = vi.fn(() => Promise.reject(new Error('offline')));
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Rückruf');
    });
    await pause();

    expect(save).toHaveBeenCalledOnce();
    expect(result.current.draft).toEqual({
      applicationId: 'a1',
      text: 'Rückruf',
    });
  });

  it('holds on to a keystroke that landed after the request left', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Rück');
    });
    await pause();
    act(() => {
      result.current.onChange('a1', 'Rückruf');
    });

    expect(result.current.draft?.text).toBe('Rückruf');
  });

  // Only one draft exists, so switching Applications must flush the first.
  it('sends a pending note before starting one on another Application', () => {
    const save = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useNotesDraft(save));

    act(() => {
      result.current.onChange('a1', 'Rückruf');
    });
    act(() => {
      result.current.onChange('a2', 'Warteliste');
    });

    expect(save).toHaveBeenCalledExactlyOnceWith('a1', 'Rückruf');
    expect(result.current.draft).toEqual({
      applicationId: 'a2',
      text: 'Warteliste',
    });
  });
});
