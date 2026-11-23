import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { Content } from '../../content/types';
import type { FormValues } from './schema';

export function toErrorText(
  message: string | undefined,
  content: Content,
): string | undefined {
  return message
    ? message in content.errors
      ? content.errors[message as keyof typeof content.errors]
      : content.unknownError
    : undefined;
}

export function makeFieldProps(
  register: UseFormRegister<FormValues>,
  errors: FieldErrors<FormValues>,
  content: Content,
) {
  return function fieldProps<Name extends keyof FormValues>(name: Name) {
    return {
      ...register(name),
      error: toErrorText(errors[name]?.message, content),
    };
  };
}
