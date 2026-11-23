/** Covers the still-mounted dashboard, so filters, drawer and notes survive the sign-in. */

import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import type { SignInFormProps } from '@/features/auth/SignInForm';
import { SignInForm } from '@/features/auth/SignInForm';

type SignInCoverProps = Pick<
  SignInFormProps,
  'onSignIn' | 'failure' | 'isSubmitting'
> & {
  staffMember: StaffMember;
};

export function SignInCover({ staffMember, ...form }: SignInCoverProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={de.auth.expiredTitle}
      className="bg-overlay/70 fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-12 backdrop-blur-sm sm:items-center sm:py-8"
    >
      <SignInForm
        {...form}
        title={de.auth.expiredTitle}
        subtitle={de.auth.expiredSubtitle}
        initialEmail={staffMember.email}
      />
    </div>
  );
}
