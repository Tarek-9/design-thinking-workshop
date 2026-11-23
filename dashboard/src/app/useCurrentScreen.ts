/** The hash is external state, so it is read through `useSyncExternalStore`. */

import { useSyncExternalStore } from 'react';

import type { Screen } from './AppShell';

const IMPLEMENTED_SCREENS: readonly Screen[] = [
  'overview',
  'applications',
  'categories',
  'discarded',
];
const DEFAULT_SCREEN: Screen = 'applications';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
}

function getSnapshot(): Screen {
  const hash = window.location.hash.slice(1).split('?')[0];
  const screen = IMPLEMENTED_SCREENS.find((candidate) => candidate === hash);
  return screen ?? DEFAULT_SCREEN;
}

export function useCurrentScreen(): Screen {
  return useSyncExternalStore(subscribe, getSnapshot);
}
