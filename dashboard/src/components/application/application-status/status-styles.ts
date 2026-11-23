/** One palette for the table and the drawer, so a row and its drawer agree. */

import type { BadgeColor } from '@/components/base/badges/badges';
import type { ApplicationStatus } from '@/domain/application';

export const STATUS_BADGE_COLORS: Record<
  ApplicationStatus,
  BadgeColor<'pill-color'>
> = {
  NEW: 'brand',
  IN_REVIEW: 'warning',
  INTRO_BOOKED: 'blue',
  ACTIVE: 'success',
  WAITLISTED: 'gray',
  DECLINED: 'error',
};

/** Only the dot carries colour, so a status column stays calm. */
export const PLAIN_STATUS_BADGE_CLASSNAME =
  'gap-2 bg-transparent px-0 py-0 text-sm font-normal text-secondary ring-0';

/** The dot alone, for the drawer's select, where the label is the browser's own. */
export const STATUS_DOT_CLASSNAME: Record<ApplicationStatus, string> = {
  NEW: 'text-utility-brand-500',
  IN_REVIEW: 'text-utility-yellow-500',
  INTRO_BOOKED: 'text-utility-blue-500',
  ACTIVE: 'text-utility-green-500',
  WAITLISTED: 'text-utility-neutral-500',
  DECLINED: 'text-utility-red-500',
};
