/**
 * Every cache key, in one module, so the stream never imports a query hook for
 * a string. The lists take no argument: each is held whole, with no filter or page.
 */

export const queryKeys = {
  signIn: ['signIn'] as const,
  applications: ['applications'] as const,
  stateChanges: ['stateChanges'] as const,
  categories: ['categories'] as const,
  staffMembers: ['staffMembers'] as const,
  applicationDocuments: (applicationId: string) =>
    ['applicationDocuments', applicationId] as const,
};
