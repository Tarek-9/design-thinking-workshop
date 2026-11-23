import { Mail01 } from '@untitledui/icons';
import { useRef, useState } from 'react';

import { problemCode } from '@/api/problem';
import type { Credentials } from '@/api/session';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { de } from '@/content/de';
import { errorMessage } from '@/content/errorMessage';

import type { CredentialIssue } from './validateCredentials';
import { validateCredentials } from './validateCredentials';

type Field = 'email' | 'password';

type FieldError = {
  field: Field;
  message: string;
};

const fieldErrors: Record<CredentialIssue, FieldError> = {
  'email-required': { field: 'email', message: de.auth.emailRequired },
  'email-invalid': { field: 'email', message: de.auth.emailInvalid },
  'password-required': { field: 'password', message: de.auth.passwordRequired },
};

// Prop-driven: the mutation lives in App, so tests need no QueryClient or fetch.
export type SignInFormProps = {
  onSignIn: (credentials: Credentials) => void;
  // A network failure has no problem code, so errorMessage falls back to the general wording.
  failure?: unknown;
  isSubmitting?: boolean;
  title?: string;
  subtitle?: string;
  // Prefilled by the cover after an expired Sign-in; the user may still change it.
  initialEmail?: string;
};

export function SignInForm({
  onSignIn,
  failure = null,
  isSubmitting = false,
  title = de.auth.title,
  subtitle = de.auth.subtitle,
  initialEmail = '',
}: SignInFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  // Validated on submit: an address is still incomplete while it is typed.
  const [error, setError] = useState<FieldError | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // A field error outranks the last rejection, which was about credentials that
  // have since changed. Rejections read above the fields: no field is to blame.
  const submissionFailure =
    error === null && failure !== null && failure !== undefined
      ? errorMessage(problemCode(failure))
      : null;

  function submit(): void {
    const check = validateCredentials(email, password);

    if (check.ok) {
      setError(null);
      onSignIn(check.credentials);
      return;
    }

    const fieldError = fieldErrors[check.issue];
    setError(fieldError);
    (fieldError.field === 'email' ? emailRef : passwordRef).current?.focus();
  }

  return (
    <Card className="w-full max-w-md gap-5">
      <CardHeader className="flex flex-col gap-1.5">
        <CardTitle className="tracking-heading text-2xl">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="flex flex-col gap-4"
        >
          {submissionFailure !== null && (
            <p
              role="alert"
              className="border-utility-red-200 bg-bg-error-primary text-text-error-primary rounded-lg border px-3.5 py-3 text-sm"
            >
              {submissionFailure}
            </p>
          )}

          <Input
            ref={emailRef}
            type="email"
            name="email"
            size="md"
            label={de.auth.emailLabel}
            placeholder={de.auth.emailPlaceholder}
            icon={Mail01}
            autoComplete="email"
            // The cover is a modal over an inert dashboard, so the email field may take focus.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            isRequired
            hideRequiredIndicator
            isInvalid={error?.field === 'email'}
            hint={error?.field === 'email' ? error.message : undefined}
            value={email}
            onChange={setEmail}
          />

          <Input
            ref={passwordRef}
            type="password"
            name="password"
            size="md"
            label={de.auth.passwordLabel}
            autoComplete="current-password"
            isRequired
            hideRequiredIndicator
            isInvalid={error?.field === 'password'}
            hint={error?.field === 'password' ? error.message : undefined}
            value={password}
            onChange={setPassword}
          />

          <Button
            type="submit"
            size="lg"
            className="mt-1 w-full"
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {de.auth.submit}
          </Button>

          <p className="text-tertiary text-sm">{de.auth.passwordResetHint}</p>
        </form>
      </CardContent>
    </Card>
  );
}
