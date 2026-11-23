import type { Credentials } from '@/api/session';

export type CredentialIssue =
  'email-required' | 'email-invalid' | 'password-required';

export type CredentialsCheck =
  | { ok: true; credentials: Credentials }
  | { ok: false; issue: CredentialIssue };

// Loose: a stricter pattern rejects valid addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(
  email: string,
  password: string,
): CredentialsCheck {
  const address = email.trim();

  if (address === '') {
    return { ok: false, issue: 'email-required' };
  }

  if (!EMAIL_PATTERN.test(address)) {
    return { ok: false, issue: 'email-invalid' };
  }

  if (password === '') {
    return { ok: false, issue: 'password-required' };
  }

  return { ok: true, credentials: { email: address, password } };
}
