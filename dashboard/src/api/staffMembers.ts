/** Names and ids only: addresses are personal data the selector does not need. */

import type { Owner } from '@/domain/application';

import { request } from './transport';

type StaffMemberWire = {
  id: string;
  name: string;
};

export async function fetchStaffMembers(): Promise<Owner[]> {
  const { members } = await request<{ members: StaffMemberWire[] }>(
    'GET',
    '/members',
  );

  return members.map((member) => ({ id: member.id, name: member.name }));
}
