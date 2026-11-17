/**
 * One Application's Documents, read when its drawer opens. No stream event
 * exists for them, so `staleTime: 0` refetches on every open: a file attached
 * after load shows up without a reload.
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
