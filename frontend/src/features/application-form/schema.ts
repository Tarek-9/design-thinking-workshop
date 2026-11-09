import { z } from 'zod';

import { isUuid } from '../../lib/uuid';
import { isFixedRoute, WEEKLY_TIME_OPTIONS } from './routes';

export const NAME_MAX = 120;
export const EMAIL_MAX = 254;
export const ABOUT_MAX = 2000;

export const formSchema = z
  .object({
    route: z.literal('').or(z.string()),
    name: z.string().trim().max(NAME_MAX, 'NAME_TOO_LONG'),
    email: z.string().trim().max(EMAIL_MAX, 'EMAIL_TOO_LONG'),
    weeklyTime: z.literal('').or(z.enum(WEEKLY_TIME_OPTIONS)),
    about: z.string().trim().max(ABOUT_MAX, 'ABOUT_TOO_LONG'),
    privacyConsent: z.boolean(),
    website: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.route === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['route'],
        message: 'ROUTE_REQUIRED',
      });
      return;
    }

    if (isFixedRoute(values.route)) return;

    if (!isUuid(values.route)) {
      ctx.addIssue({
        code: 'custom',
        path: ['route'],
        message: 'CATEGORY_UNKNOWN',
      });
      return;
    }

    if (values.name.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: 'NAME_REQUIRED',
      });
    }

    if (values.email.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'EMAIL_REQUIRED',
      });
    } else if (!z.email().safeParse(values.email).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'EMAIL_INVALID',
      });
    }

    if (values.weeklyTime === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['weeklyTime'],
        message: 'WEEKLY_TIME_REQUIRED',
      });
    }

    if (!values.privacyConsent) {
      ctx.addIssue({
        code: 'custom',
        path: ['privacyConsent'],
        message: 'CONSENT_REQUIRED',
      });
    }
  });

export type FormValues = z.input<typeof formSchema>;

export const emptyFormValues: FormValues = {
  route: '',
  name: '',
  email: '',
  weeklyTime: '',
  about: '',
  privacyConsent: false,
  website: '',
};

export type ApplicationValues = FormValues & {
  route: string;
  weeklyTime: (typeof WEEKLY_TIME_OPTIONS)[number];
  privacyConsent: true;
};

export function asApplicationValues(
  values: FormValues,
): ApplicationValues | null {
  if (values.route === '' || isFixedRoute(values.route)) return null;
  if (values.weeklyTime === '') return null;
  if (!values.privacyConsent) return null;
  return {
    ...values,
    route: values.route,
    weeklyTime: values.weeklyTime,
    privacyConsent: true,
  };
}
