import type { SignInFormProps } from './SignInForm';
import { SignInForm } from './SignInForm';

type LoginScreenProps = Pick<
  SignInFormProps,
  'onSignIn' | 'failure' | 'isSubmitting'
>;

export function LoginScreen(props: LoginScreenProps) {
  return (
    <main className="bg-primary text-primary flex min-h-dvh items-start justify-center px-4 py-12 sm:items-center sm:py-8">
      <SignInForm {...props} />
    </main>
  );
}
