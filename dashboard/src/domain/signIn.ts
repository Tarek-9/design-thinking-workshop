/** Expired is its own state: the dashboard stays mounted behind the cover, so unsent work survives. */

import type { StaffMember } from './staffMember';

export type SignIn =
  /** GET /me answered 401: the sign-in screen, nothing behind it. */
  | { kind: 'none' }
  | { kind: 'active'; staffMember: StaffMember }
  | { kind: 'expired'; staffMember: StaffMember };

export const NO_SIGN_IN: SignIn = { kind: 'none' };

export function activeSignIn(staffMember: StaffMember): SignIn {
  return { kind: 'active', staffMember };
}

/** Only an active Sign-in expires: a late 401, behind the cover or after sign-out, must not change what is shown. */
export function expireSignIn(signIn: SignIn): SignIn {
  return signIn.kind === 'active'
    ? { kind: 'expired', staffMember: signIn.staffMember }
    : signIn;
}
