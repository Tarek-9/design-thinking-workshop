/**
 * Cancel first, or an in-flight refetch overwrites the change. Restore on
 * failure, then invalidate: the snapshot is only the dashboard's own last belief.
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type ListChange<T> = (current: readonly T[]) => T[];

export type OptimisticList<T> = {
  /** An object, so an undefined context means onMutate never ran. */
  apply: (change: ListChange<T>) => Promise<{ snapshot: T[] | undefined }>;
  rollback: (snapshot: T[] | undefined) => void;
  write: (change: ListChange<T>) => void;
};

export function optimisticList<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
): OptimisticList<T> {
  function write(change: ListChange<T>): void {
    queryClient.setQueryData<T[]>(queryKey, (current) =>
      current === undefined ? current : change(current),
    );
  }

  return {
    apply: async (change) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueryData<T[]>(queryKey);
      write(change);
      return { snapshot };
    },

    rollback: (snapshot) => {
      if (snapshot !== undefined) {
        queryClient.setQueryData<T[]>(queryKey, snapshot);
      }

      void queryClient.invalidateQueries({ queryKey });
    },

    write,
  };
}
