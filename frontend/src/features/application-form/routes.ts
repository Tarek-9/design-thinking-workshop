/** These two end the form in a panel with an external link and never reach the applications endpoint. */
export const FIXED_ROUTES = ['COMMUNITY', 'SUPPORTING_MEMBER'] as const;

export type FixedRoute = (typeof FIXED_ROUTES)[number];

export function isFixedRoute(value: string): value is FixedRoute {
  return (FIXED_ROUTES as readonly string[]).includes(value);
}

export const WEEKLY_TIME_OPTIONS = [
  'HOURS_1_2',
  'HOURS_3_5',
  'HOURS_5_PLUS',
  'IRREGULAR',
] as const;

export type WeeklyTime = (typeof WEEKLY_TIME_OPTIONS)[number];

export type RouteOutcome = 'application' | 'community' | 'supporting-member';

export function outcomeOf(value: string): RouteOutcome {
  if (value === 'COMMUNITY') return 'community';
  if (value === 'SUPPORTING_MEMBER') return 'supporting-member';
  return 'application';
}

/** Bump when the consent sentence changes, so applications stay tied to the text they accepted. */
export const CONSENT_TEXT_VERSION = '2026-09';
