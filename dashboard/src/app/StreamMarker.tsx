/** No polling fallback, so a lost connection must be visible; left-aligned, as the drawer covers the right end. */

import { de } from '@/content/de';
import { cx } from '@/utils/cx';

import { DRAWER_RESERVE } from './strip';

type StreamMarkerProps = {
  connected: boolean;
};

export function StreamMarker({ connected }: StreamMarkerProps) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cx(
        'text-tertiary flex flex-wrap items-center gap-1.5 text-xs',
        DRAWER_RESERVE,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'size-1.5 rounded-full',
          connected ? 'bg-utility-green-500' : 'bg-utility-red-500',
        )}
      />
      {connected ? (
        de.dashboard.live
      ) : (
        <>
          <span className="font-medium">{de.dashboard.disconnected}</span>
          <span>{de.dashboard.disconnectedHint}</span>
        </>
      )}
    </p>
  );
}
