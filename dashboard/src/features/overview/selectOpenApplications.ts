import type { Application } from '@/domain/application';
import {
  COMPLETED_APPLICATION_STATUSES,
  isDiscarded,
} from '@/domain/application';
import type { OwnerFilter } from '@/features/applications/filterApplications';
import {
  matchesOwner,
  matchesSearch,
} from '@/features/applications/filterApplications';

export type OpenApplicationsFilters = {
  search: string;
  categoryId: string | null;
  ownerId: OwnerFilter;
};

export const EMPTY_OPEN_APPLICATIONS_FILTERS: OpenApplicationsFilters = {
  search: '',
  categoryId: null,
  ownerId: null,
};

// Proposed panel size. The client set no number.
export const OPEN_APPLICATIONS_LIMIT = 5;

// Newest first, so the five-row cap never hides new arrivals.
// The "of" count in the panel is this array's length, taken before the cap.
export function selectOpenApplications(
  applications: readonly Application[],
  filters: OpenApplicationsFilters,
): Application[] {
  return applications
    .filter(
      (application) =>
        !isDiscarded(application) &&
        !COMPLETED_APPLICATION_STATUSES.includes(application.status) &&
        matchesSearch(application, filters.search) &&
        (filters.categoryId === null ||
          application.categoryId === filters.categoryId) &&
        matchesOwner(application, filters.ownerId),
    )
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
}
