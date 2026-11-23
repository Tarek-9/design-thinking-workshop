import { describe, expect, it } from 'vitest';

import { validateCredentials } from './validateCredentials';

describe('validateCredentials', () => {
  it('hands the address on trimmed, and the password untouched', () => {
    expect(
      validateCredentials('  Ashton@ichbinhier.online  ', ' geheim '),
    ).toEqual({
      ok: true,
      credentials: { email: 'Ashton@ichbinhier.online', password: ' geheim ' },
    });
  });

  it('reports an empty address before it looks at the password', () => {
    expect(validateCredentials('   ', '')).toEqual({
      ok: false,
      issue: 'email-required',
    });
  });

  it('reports an address that is not finished', () => {
    expect(validateCredentials('ashton@ichbinhier', 'geheim')).toEqual({
      ok: false,
      issue: 'email-invalid',
    });
  });

  it('reports a missing password once the address is usable', () => {
    expect(validateCredentials('ashton@ichbinhier.online', '')).toEqual({
      ok: false,
      issue: 'password-required',
    });
  });

  // Whether an address has an account is the backend's answer, never this check's.
  it('accepts an address no Staff member has', () => {
    expect(validateCredentials('someone@example.org', 'geheim').ok).toBe(true);
  });
});
