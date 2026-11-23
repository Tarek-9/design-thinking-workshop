/** Owners change rarely, but they are server state, so they live in the cache. */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchStaffMembers } from '@/api/staffMembers';
import type { Owner } from '@/domain/application';

import { queryKeys } from './keys';

export const staffMembersQuery = queryOptions({
  queryKey: queryKeys.staffMembers,
  queryFn: () => fetchStaffMembers(),
});

const NO_OWNERS: readonly Owner[] = [];

export function useOwners(): readonly Owner[] {
  return useQuery(staffMembersQuery).data ?? NO_OWNERS;
}
