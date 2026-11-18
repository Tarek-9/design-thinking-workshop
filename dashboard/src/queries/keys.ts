/**
 * Every cache key, in one module.
 *
 * The Applications key is read by its own query, by the live stream, and by
 * every write that touches the list — and a key spelled at each of those
 * places would have the stream importing a query hook for a string
 * (ADR-0006). The lists are flat and take no argument: the dashboard holds
 * each list whole, so there is no filter or page to key by (`API.md`, "Scope").
 * The one keyed entry is an Application's Documents, read one Application at a
 * time when its drawer opens, so it is keyed by that Application's id.
 */

export const queryKeys = {
  /** The current Sign-in: `GET /me`'s answer, plus whether it has expired. */
  signIn: ['signIn'] as const,
  applications: ['applications'] as const,
  /** The state history behind Übersicht's sparklines. */
  stateChanges: ['stateChanges'] as const,
  categories: ['categories'] as const,
  /** `GET /members` — the Owners an Application can be assigned to. */
  staffMembers: ['staffMembers'] as const,
  /** `GET …/applications/{id}/documents` — the files one Application carries. */
  applicationDocuments: (applicationId: string) =>
    ['applicationDocuments', applicationId] as const,
};
