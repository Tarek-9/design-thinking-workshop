/** An Application carries only its current pair, so past values need this log. */
export const STATE_CHANGE_FIELDS = ['STATUS', 'OWNER', 'DISCARDED'] as const;

export type StateChangeField = (typeof STATE_CHANGE_FIELDS)[number];

export type StateChange = {
  applicationId: string;
  /** Server clock: the browser clock can be wrong. */
  at: string;
  field: StateChangeField;
  /** `true` means discarded: the PATCH boolean. */
  to: string | boolean | null;
};

/** The sparklines slice seven days themselves; 30 is the endpoint's default. */
export const STATE_CHANGE_WINDOW_DAYS = 30;
