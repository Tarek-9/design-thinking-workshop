import { useCallback, useEffect, useRef, useState } from 'react';

import { type Category, fetchCategories } from './api';

type CategoriesState =
  | { status: 'loading'; categories: Category[] }
  | { status: 'loaded'; categories: Category[] }
  | { status: 'error'; categories: Category[] };

/** Each load aborts the one before it, so a superseded fetch (StrictMode double mount, retry) never lands. */
export function useCategories() {
  const [state, setState] = useState<CategoriesState>({
    status: 'loading',
    categories: [],
  });
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    void fetchCategories(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setState(
        result.status === 'success'
          ? { status: 'loaded', categories: result.categories }
          : { status: 'error', categories: [] },
      );
    });
  }, []);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const retry = useCallback(() => {
    setState({ status: 'loading', categories: [] });
    load();
  }, [load]);

  return { ...state, retry };
}
