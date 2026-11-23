/** Writes wait for the server: it mints the ids and no stream event echoes them. */

import type { Category, CategoryDraft } from '@/domain/category';

import { request, requestNoContent } from './transport';

type CategoryWire = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

function toCategory(wire: CategoryWire): Category {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    active: wire.active,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const { categories } = await request<{ categories: CategoryWire[] }>(
    'GET',
    '/categories',
  );

  return categories.map(toCategory);
}

/** The dialog checks names too, but the server decides: this list may be stale. */
export async function createCategory(draft: CategoryDraft): Promise<Category> {
  return toCategory(await request<CategoryWire>('POST', '/categories', draft));
}

export async function patchCategory(
  id: string,
  change: Partial<CategoryDraft>,
): Promise<Category> {
  return toCategory(
    await request<CategoryWire>(
      'PATCH',
      `/categories/${encodeURIComponent(id)}`,
      change,
    ),
  );
}

/** 409 CATEGORY_IN_USE while any Application names it, discarded ones included. */
export async function deleteCategory(id: string): Promise<void> {
  await requestNoContent('DELETE', `/categories/${encodeURIComponent(id)}`);
}

/** Sends the whole order, so two quick reorders cannot leave two Categories on one position. */
export async function putCategoryOrder(
  ids: readonly string[],
): Promise<Category[]> {
  const { categories } = await request<{ categories: CategoryWire[] }>(
    'PUT',
    '/categories/order',
    { ids },
  );

  return categories.map(toCategory);
}
