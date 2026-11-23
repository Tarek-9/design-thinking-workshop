/**
 * The only EventSource. Opened once from AppShell, so screen changes do not
 * reconnect. Every open refetches: the server keeps no replay buffer.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { isUnauthenticated } from '@/api/problem';
import { fetchSignedInStaffMember } from '@/api/session';
import { STAFF_API } from '@/api/transport';
import type { Application } from '@/domain/application';

import {
  APPLICATION_EVENT_TYPES,
  applyApplicationEvent,
  parseApplicationEvent,
} from './applicationEvents';
import { queryKeys } from './keys';
import { markSignInExpired } from './session';

/** How long a dropped connection may take to come back before it is reported. */
const DISCONNECTED_AFTER_MS = 3_000;

/**
 * Dropped connections before asking GET /me: EventSource repairs most drops on its
 * own, so only a run of them is worth a question.
 */
const FAILURES_BEFORE_ASKING = 3;

/** Gives a restarting backend time to come up; each reopen attempt also asks GET /me. */
const REOPEN_AFTER_MS = 5_000;

export type StreamConnection = {
  connected: boolean;
};

export type ApplicationStreamOptions = {
  /** False while the cover is up: no Sign-in to authenticate with, so it would only collect 403s. */
  enabled?: boolean;
};

export function useApplicationStream({
  enabled = true,
}: ApplicationStreamOptions = {}): StreamConnection {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  /** Bumped to open a fresh stream, since the effect owns the connection. */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const source = new EventSource(`${STAFF_API}/events`);
    let grace: ReturnType<typeof setTimeout> | undefined;
    let reopen: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    function cancelGrace(): void {
      if (grace !== undefined) {
        clearTimeout(grace);
        grace = undefined;
      }
    }

    /**
     * Not a query: it would overwrite the cover. Only a 403 says anything about the
     * Sign-in; a network failure says nothing.
     */
    async function askWhetherSignedIn(): Promise<boolean> {
      try {
        await fetchSignedInStaffMember();
        return false;
      } catch (failure) {
        if (isUnauthenticated(failure)) {
          markSignInExpired(queryClient);
          return true;
        }

        return false;
      }
    }

    source.onopen = () => {
      cancelGrace();
      failures = 0;
      setConnected(true);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.applications,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.stateChanges,
      });
    };

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        void askWhetherSignedIn();

        reopen ??= setTimeout(() => {
          void askWhetherSignedIn().then(
            (expired) => {
              if (!expired) {
                setAttempt((current) => current + 1);
              }
            },
            () => {
              setAttempt((current) => current + 1);
            },
          );
        }, REOPEN_AFTER_MS);
      } else {
        failures += 1;

        if (failures >= FAILURES_BEFORE_ASKING) {
          failures = 0;
          void askWhetherSignedIn();
        }
      }

      if (grace === undefined) {
        grace = setTimeout(() => {
          grace = undefined;
          setConnected(false);
        }, DISCONNECTED_AFTER_MS);
      }
    };

    /**
     * Events apply only once the list exists: a lone row written before the boot
     * fetch would show as the whole dashboard.
     */
    const listeners = APPLICATION_EVENT_TYPES.map((type) => {
      const listener = (message: Event) => {
        const event = parseApplicationEvent(
          type,
          (message as MessageEvent<string>).data,
        );

        if (event === null) {
          return;
        }

        queryClient.setQueryData<Application[]>(
          queryKeys.applications,
          (current) =>
            current === undefined
              ? current
              : applyApplicationEvent(current, event),
        );
      };

      source.addEventListener(type, listener);
      return { type, listener };
    });

    return () => {
      cancelGrace();
      clearTimeout(reopen);
      for (const { type, listener } of listeners) {
        source.removeEventListener(type, listener);
      }
      source.close();
      /** Closing the source ends the connection, so the marker must stop claiming it is live. */
      setConnected(false);
    };
  }, [queryClient, enabled, attempt]);

  return { connected };
}
