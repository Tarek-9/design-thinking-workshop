/**
 * The Documents of one Application, read when its drawer opens. Unlike the
 * Application list there is no stream event for them, so the query does not
 * trust its cache: `staleTime: 0` refetches on every mount, which is every
 * time a Staff member opens the drawer, and a file an Applicant attached after
 * the list was loaded shows up without a reload.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchApplicationDocuments } from '@/api/documents';

import { queryKeys } from './keys';

export function applicationDocumentsQuery(applicationId: string) {
  return queryOptions({
    queryKey: queryKeys.applicationDocuments(applicationId),
    queryFn: () => fetchApplicationDocuments(applicationId),
    staleTime: 0,
  });
}

export function useApplicationDocuments(applicationId: string) {
  return useQuery(applicationDocumentsQuery(applicationId));
}
