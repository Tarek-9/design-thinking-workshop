import { describe, expect, it } from 'vitest';

import { activeSignIn, expireSignIn, NO_SIGN_IN } from './signIn';
import type { StaffMember } from './staffMember';

const staffMember: StaffMember = {
  id: 'staff-1',
  name: 'Ashton Blackwell',
  email: 'ashton.blackwell@ichbinhier.online',
};

/** A 401 must neither invent a Sign-in nor re-decide one that is gone. */
describe('expireSignIn', () => {
  it('expires an active Sign-in, keeping the Staff member', () => {
    expect(expireSignIn(activeSignIn(staffMember))).toEqual({
      kind: 'expired',
      staffMember,
    });
  });

  it('leaves an expired Sign-in as it is', () => {
    const expired = expireSignIn(activeSignIn(staffMember));

    expect(expireSignIn(expired)).toEqual(expired);
  });

  it('does not invent a Sign-in where there is none', () => {
    expect(expireSignIn(NO_SIGN_IN)).toEqual(NO_SIGN_IN);
  });
});
