/** The Sign-in is an HttpOnly cookie: only `GET /me` can say whether one exists. */

import type { StaffMember } from '@/domain/staffMember';

import { request, requestNoContent } from './transport';

export type Credentials = {
  email: string;
  password: string;
};

/** No avatar: the screens render initials. */
type StaffMemberWire = {
  id: string;
  name: string;
  email: string;
};

function toStaffMember(wire: StaffMemberWire): StaffMember {
  return { id: wire.id, name: wire.name, email: wire.email };
}

/** Throws `UNAUTHENTICATED` when signed out; the session query maps that to "none". */
export async function fetchSignedInStaffMember(): Promise<StaffMember> {
  return toStaffMember(await request<StaffMemberWire>('GET', '/me'));
}

/** Wrong password and unknown address both answer 401, so the screen cannot reveal which addresses exist. */
export async function signIn(credentials: Credentials): Promise<StaffMember> {
  return toStaffMember(
    await request<StaffMemberWire>('POST', '/session', credentials),
  );
}

/** `204`, and `204` again when there was no Sign-in to end. */
export async function signOut(): Promise<void> {
  await requestNoContent('DELETE', '/session');
}
