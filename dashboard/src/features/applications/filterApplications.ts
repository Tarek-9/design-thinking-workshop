// Pure, so the rules are tested without rendering a table.

import type {
  Application,
  ApplicationStatus,
  ApplicationView,
} from '@/domain/application';
import {
  APPLICATION_STATUSES,
  APPLICATION_VIEWS,
  COMPLETED_APPLICATION_STATUSES,
  isDiscarded,
  STALE_AFTER_DAYS,
} from '@/domain/application';
import { daysSince } from '@/utils/dates';

// 'unassigned' matches Applications without an owner; null matches all.
export type OwnerFilter = string | null;

export type ApplicationFilters = {
  view: ApplicationView;
  search: string;
  categoryId: string | null;
  status: ApplicationStatus | null;
  // Optional: set by the Übersicht panel only.
  ownerId?: OwnerFilter;
  // Set only by the Übersicht panel; applies on top of view and status.
  excludeCompleted?: boolean;
};

export const EMPTY_FILTERS: ApplicationFilters = {
  view: 'all',
  search: '',
  categoryId: null,
  status: null,
  ownerId: null,
  excludeCompleted: false,
};

function matchesView(
  application: Application,
  view: ApplicationView,
  now: Date,
): boolean {
  switch (view) {
    case 'all':
      return true;
    case 'unassigned':
      return application.ownerId === null;
    case 'stale':
      return daysSince(application.submittedAt, now) >= STALE_AFTER_DAYS;
  }
}

// Exported so the Übersicht panel counts search hits exactly like Anfragen.
export function matchesSearch(
  application: Application,
  search: string,
): boolean {
  const term = search.trim().toLowerCase();
  if (term === '') {
    return true;
  }
  return (
    application.name.toLowerCase().includes(term) ||
    application.email.toLowerCase().includes(term)
  );
}

export function matchesOwner(
  application: Application,
  ownerId: OwnerFilter | undefined,
): boolean {
  if (ownerId === undefined || ownerId === null) {
    return true;
  }
  if (ownerId === 'unassigned') {
    return application.ownerId === null;
  }
  return application.ownerId === ownerId;
}

// Unknown values are dropped, so the EMPTY_FILTERS spread supplies the default.
export function parseFiltersFromHash(
  hash: string,
): Partial<ApplicationFilters> {
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) {
    return {};
  }

  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const filters: Partial<ApplicationFilters> = {};

  const view = params.get('view');
  if (view && (APPLICATION_VIEWS as readonly string[]).includes(view)) {
    filters.view = view as ApplicationView;
  }

  const status = params.get('status');
  if (status && (APPLICATION_STATUSES as readonly string[]).includes(status)) {
    filters.status = status as ApplicationStatus;
  }

  const search = params.get('search');
  if (search !== null) {
    filters.search = search;
  }

  const categoryId = params.get('categoryId');
  if (categoryId !== null) {
    filters.categoryId = categoryId;
  }

  const ownerId = params.get('ownerId');
  if (ownerId !== null) {
    filters.ownerId = ownerId;
  }

  if (params.get('excludeCompleted') === '1') {
    filters.excludeCompleted = true;
  }

  return filters;
}

// Inverse of parseFiltersFromHash, so the query shape lives in one place.
export function buildApplicationsHref(
  filters: Partial<ApplicationFilters>,
): string {
  const params = new URLSearchParams();
  if (filters.view) {
    params.set('view', filters.view);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.categoryId) {
    params.set('categoryId', filters.categoryId);
  }
  if (filters.ownerId) {
    params.set('ownerId', filters.ownerId);
  }
  if (filters.excludeCompleted) {
    params.set('excludeCompleted', '1');
  }
  return `#applications?${params.toString()}`;
}

// Discarded Applications are hidden here and from the view counts; only the
// discarded screen shows them.
export function filterApplications(
  applications: readonly Application[],
  filters: ApplicationFilters,
  now: Date,
): Application[] {
  return applications.filter(
    (application) =>
      !isDiscarded(application) &&
      matchesView(application, filters.view, now) &&
      matchesSearch(application, filters.search) &&
      (filters.categoryId === null ||
        application.categoryId === filters.categoryId) &&
      (filters.status === null || application.status === filters.status) &&
      matchesOwner(application, filters.ownerId) &&
      (!filters.excludeCompleted ||
        !COMPLETED_APPLICATION_STATUSES.includes(application.status)),
  );
}
