/**
 * Every write awaits the server, then invalidates: the server owns id and name
 * uniqueness, and no stream event echoes an optimistic guess.
 */

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  patchCategory,
  putCategoryOrder,
} from '@/api/categories';
import type { Category, CategoryDraft } from '@/domain/category';

import { queryKeys } from './keys';
import { useReportRequestFailure } from './requestFailures';

export const categoriesQuery = queryOptions({
  queryKey: queryKeys.categories,
  queryFn: () => fetchCategories(),
});

const NO_CATEGORIES: readonly Category[] = [];

export function useCategories(): readonly Category[] {
  return useQuery(categoriesQuery).data ?? NO_CATEGORIES;
}

function useCategoryWrite<Variables>(
  write: (variables: Variables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const report = useReportRequestFailure();

  return useMutation({
    mutationFn: write,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (failure) => {
      report(failure);
      // Also on failure: a refused rename means the list on screen is stale.
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useCreateCategory() {
  return useCategoryWrite((draft: CategoryDraft) => createCategory(draft));
}

export type CategoryEditVariables = {
  id: string;
  change: Partial<CategoryDraft>;
};

export function useEditCategory() {
  return useCategoryWrite(({ id, change }: CategoryEditVariables) =>
    patchCategory(id, change),
  );
}

export function useDeleteCategory() {
  return useCategoryWrite((id: string) => deleteCategory(id));
}

export function useReorderCategories() {
  return useCategoryWrite((orderedIds: readonly string[]) =>
    putCategoryOrder(orderedIds),
  );
}
