const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export const MILLISECONDS_PER_DAY =
  HOURS_PER_DAY *
  MINUTES_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND;

/** Clamped at zero: a timestamp ahead of now means clock skew. */
export function daysSince(timestamp: string, now: Date): number {
  return Math.max(
    0,
    Math.floor(
      (now.getTime() - new Date(timestamp).getTime()) / MILLISECONDS_PER_DAY,
    ),
  );
}
