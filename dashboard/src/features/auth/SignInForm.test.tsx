import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiProblem } from '@/api/problem';
import { de } from '@/content/de';
import { mockStaffMember } from '@/data/mockApplications';

import { SignInForm } from './SignInForm';

// jsdom keeps the required marker in the label ("E-Mail *"), so match the
// label copy alone; `selector` keeps the password toggle out.
function field(label: string): HTMLElement {
  return screen.getByLabelText(label, { exact: false, selector: 'input' });
}

async function submitCredentials(
  email: string,
  password: string,
): Promise<void> {
  const user = userEvent.setup();

  if (email !== '') {
    await user.type(field(de.auth.emailLabel), email);
  }
  if (password !== '') {
    await user.type(field(de.auth.passwordLabel), password);
  }

  await user.click(screen.getByRole('button', { name: de.auth.submit }));
}

describe('SignInForm', () => {
  it('hands the credentials up, with the address trimmed', async () => {
    const onSignIn = vi.fn();

    render(<SignInForm onSignIn={onSignIn} />);

    await submitCredentials(`  ${mockStaffMember.email}  `, 'geheim');

    expect(onSignIn).toHaveBeenCalledWith({
      email: mockStaffMember.email,
      password: 'geheim',
    });
  });

  it('says nothing until the form is submitted', async () => {
    const user = userEvent.setup();

    render(<SignInForm onSignIn={vi.fn()} />);

    await user.type(field(de.auth.emailLabel), 'not-an-email');

    expect(screen.queryByText(de.auth.emailInvalid)).not.toBeInTheDocument();
  });

  it('flags an unfinished address and puts focus back in the field', async () => {
    const onSignIn = vi.fn();

    render(<SignInForm onSignIn={onSignIn} />);

    await submitCredentials('not-an-email', 'geheim');

    expect(screen.getByText(de.auth.emailInvalid)).toBeInTheDocument();
    expect(field(de.auth.emailLabel)).toHaveFocus();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('flags a missing password on the password field', async () => {
    render(<SignInForm onSignIn={vi.fn()} />);

    await submitCredentials(mockStaffMember.email, '');

    expect(screen.getByText(de.auth.passwordRequired)).toBeInTheDocument();
    expect(field(de.auth.passwordLabel)).toHaveFocus();
  });

  // INVALID_CREDENTIALS names no field, by design: it must not reveal which addresses exist.
  it('words a rejected Sign-in above the form, not under a field', () => {
    render(
      <SignInForm
        onSignIn={vi.fn()}
        failure={new ApiProblem({ status: 401, code: 'INVALID_CREDENTIALS' })}
      />,
    );

    const alert = screen.getByRole('alert');
    const email = field(de.auth.emailLabel);

    expect(alert).toHaveTextContent(de.errors.codes.INVALID_CREDENTIALS);
    expect(alert.closest('form')).toBe(email.closest('form'));
    expect(email).not.toHaveAttribute('aria-invalid', 'true');
    expect(field(de.auth.passwordLabel)).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.queryByText(/Konto/)).not.toBeInTheDocument();
  });

  it('words a throttled address above the form too', () => {
    render(
      <SignInForm
        onSignIn={vi.fn()}
        failure={
          new ApiProblem({
            status: 429,
            code: 'RATE_LIMITED',
            retryAfterSeconds: 300,
          })
        }
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      de.errors.codes.RATE_LIMITED,
    );
  });

  // No problem code arrives, so only the general wording fits.
  it('words a request that never reached the backend generally', () => {
    render(
      <SignInForm onSignIn={vi.fn()} failure={new TypeError('offline')} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(de.errors.general);
  });

  it('drops the rejection once a field needs fixing again', async () => {
    render(
      <SignInForm
        onSignIn={vi.fn()}
        failure={new ApiProblem({ status: 401, code: 'INVALID_CREDENTIALS' })}
      />,
    );

    await submitCredentials('not-an-email', 'geheim');

    expect(screen.getByText(de.auth.emailInvalid)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cannot be submitted twice while the request is in flight', () => {
    render(<SignInForm onSignIn={vi.fn()} isSubmitting />);

    expect(screen.getByRole('button', { name: de.auth.submit })).toBeDisabled();
  });

  it('offers no password reset link and no stay-signed-in box', () => {
    render(<SignInForm onSignIn={vi.fn()} />);

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(de.auth.passwordResetHint)).toBeInTheDocument();
  });

  it('labels the password visibility toggle in German', () => {
    render(<SignInForm onSignIn={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: de.fields.togglePassword }),
    ).toBeInTheDocument();
  });

  // The cover fills the address in: the Staff member is signing in again.
  it('starts with the address it was given', () => {
    render(
      <SignInForm onSignIn={vi.fn()} initialEmail={mockStaffMember.email} />,
    );

    expect(field(de.auth.emailLabel)).toHaveValue(mockStaffMember.email);
  });

  it('takes the cover its own heading and reason', () => {
    render(
      <SignInForm
        onSignIn={vi.fn()}
        title={de.auth.expiredTitle}
        subtitle={de.auth.expiredSubtitle}
      />,
    );

    expect(
      screen.getByRole('heading', { name: de.auth.expiredTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(de.auth.expiredSubtitle)).toBeInTheDocument();
  });
});
