/** An Error subclass, so TanStack Query and stack traces both work. */

export type ApiFieldProblem = {
  field: string;
  code: string;
};

export class ApiProblem extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly errors: readonly ApiFieldProblem[];
  /** Taken from the Retry-After header. */
  readonly retryAfterSeconds: number | undefined;

  constructor(init: {
    status: number;
    code?: string;
    errors?: readonly ApiFieldProblem[];
    retryAfterSeconds?: number;
  }) {
    super(`${String(init.status)} ${init.code ?? 'unknown'}`);
    this.name = 'ApiProblem';
    this.status = init.status;
    this.code = init.code;
    this.errors = init.errors ?? [];
    this.retryAfterSeconds = init.retryAfterSeconds;
  }

  fieldCode(field: string): string | undefined {
    return this.errors.find((entry) => entry.field === field)?.code;
  }
}

export function isApiProblem(failure: unknown): failure is ApiProblem {
  return failure instanceof ApiProblem;
}

/** No code when the network never delivered the request: the dashboard does not know what happened. */
export function problemCode(failure: unknown): string | undefined {
  return isApiProblem(failure) ? failure.code : undefined;
}

/** Used by the session query and the sign-in cover. */
export function isUnauthenticated(failure: unknown): boolean {
  return isApiProblem(failure) && failure.code === 'UNAUTHENTICATED';
}
