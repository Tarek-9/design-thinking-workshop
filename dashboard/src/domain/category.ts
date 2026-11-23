/** Order is the array's own order: no position field, so "move" is a swap. */

export type Category = {
  id: string;
  name: string;
  /** One line under the name on the form. May be empty. */
  description: string;
  /** Whether the form offers this Category. Inactive ones stay on file. */
  active: boolean;
};

/** What the add dialog submits. The server mints the id. */
export type CategoryDraft = Omit<Category, 'id'>;

/** "Inaktiv" is a view. Deactivating replaces deleting. */
export const CATEGORY_VIEWS = ['all', 'active', 'inactive'] as const;

export type CategoryView = (typeof CATEGORY_VIEWS)[number];

export const CATEGORY_NAME_MAX_LENGTH = 60;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 140;

/** Case- and whitespace-insensitive. `exceptId` lets an edited Category keep its name. */
export function isCategoryNameTaken(
  categories: readonly Category[],
  name: string,
  exceptId?: string,
): boolean {
  const normalised = name.trim().toLocaleLowerCase('de');

  return categories.some(
    (category) =>
      category.id !== exceptId &&
      category.name.trim().toLocaleLowerCase('de') === normalised,
  );
}

/** Whole order as ids, so two reorders cannot share a position. Ends stay unchanged, so no guard is needed. */
export function moveCategory(
  categories: readonly Category[],
  id: string,
  direction: -1 | 1,
): string[] {
  const ids = categories.map((category) => category.id);
  const index = ids.indexOf(id);
  const target = index + direction;

  if (index === -1 || target < 0 || target >= ids.length) {
    return ids;
  }

  const moved = ids[index];
  const displaced = ids[target];

  if (moved === undefined || displaced === undefined) {
    return ids;
  }

  ids[index] = displaced;
  ids[target] = moved;
  return ids;
}

/** Takes bare categoryIds, so the Category domain does not import Application. */
export function countApplicationsPerCategory(
  applications: readonly { categoryId: string }[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const application of applications) {
    counts.set(
      application.categoryId,
      (counts.get(application.categoryId) ?? 0) + 1,
    );
  }

  return counts;
}
