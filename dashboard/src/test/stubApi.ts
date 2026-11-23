/**
 * The backend, stubbed at `fetch` and `EventSource`. It is stateful:
 * after sign-out, `GET /me` must answer 401, or the test signs straight back in.
 */

import { vi } from 'vitest';

import {
  createMockApplications,
  mockCategories,
  mockOwners,
  mockStaffMember,
} from '@/data/mockApplications';
import type { Application, Owner } from '@/domain/application';
import type { ApplicationDocument } from '@/domain/applicationDocument';
import type { Category } from '@/domain/category';
import type { StaffMember } from '@/domain/staffMember';
import type { StateChange } from '@/domain/stateChange';

// Inert until a test calls fireOpen, so tests that ignore the stream get no refetch.
export class StubEventSource {
  static latest: StubEventSource | null = null;

  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  closed = false;
  // A dropped connection stays CONNECTING and the browser repairs it. A 502 or
  // 401 leaves it CLOSED for good, so the hook must reopen it itself.
  readyState: number = StubEventSource.CONNECTING;

  private readonly listeners = new Map<string, Set<EventListener>>();

  constructor(readonly url: string) {
    StubEventSource.latest = this;
  }

  addEventListener(type: string, listener: EventListener): void {
    const forType = this.listeners.get(type) ?? new Set<EventListener>();
    forType.add(listener);
    this.listeners.set(type, forType);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  close(): void {
    this.closed = true;
    this.readyState = StubEventSource.CLOSED;
  }

  fireOpen(): void {
    this.readyState = StubEventSource.OPEN;
    this.onopen?.(new Event('open'));
  }

  fireError(): void {
    this.readyState = StubEventSource.CONNECTING;
    this.onerror?.(new Event('error'));
  }

  fireErrorAndClose(): void {
    this.readyState = StubEventSource.CLOSED;
    this.closed = true;
    this.onerror?.(new Event('error'));
  }

  emit(type: string, application: Application): void {
    const event = new MessageEvent(type, {
      data: JSON.stringify(application),
    });

    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

export type StubbedApi = {
  signedIn: boolean;
  applications: Application[];
  categories: Category[];
  owners: Owner[];
  changes: StateChange[];
  documents: Record<string, ApplicationDocument[]>;
  documentsFailure: { status: number; code: string } | null;
  staffMember: StaffMember;
  signInFailure: { status: number; code: string } | null;
  signInCheckFailure: { status: number; code: string } | null;
  writeFailure: { status: number; code: string } | null;
  // Fails the four reads but not GET /me, so the Sign-in holds and only the lists fail.
  readFailure: { status: number; code: string } | null;
  stream: () => StubEventSource | null;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function problem(status: number, code: string): Response {
  return new Response(JSON.stringify({ status, code }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

const NO_CONTENT = () => new Response(null, { status: 204 });

export const REFERENCE_DATE = new Date('2026-09-08T09:00:00Z');

export function stubApi(overrides: Partial<StubbedApi> = {}): StubbedApi {
  const api: StubbedApi = {
    signedIn: true,
    applications: createMockApplications(REFERENCE_DATE),
    categories: [...mockCategories],
    owners: [...mockOwners],
    changes: [],
    documents: {},
    documentsFailure: null,
    staffMember: mockStaffMember,
    signInFailure: null,
    signInCheckFailure: null,
    writeFailure: null,
    readFailure: null,
    stream: () => StubEventSource.latest,
    ...overrides,
  };

  StubEventSource.latest = null;
  vi.stubGlobal('EventSource', StubEventSource);

  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(
        typeof input === 'string' || input instanceof URL ? input : input.url,
      );
      const method = init?.method ?? 'GET';

      const body = ((): Record<string, unknown> =>
        typeof init?.body === 'string'
          ? (JSON.parse(init.body) as Record<string, unknown>)
          : {})();
      const path = url.slice(url.indexOf('/staff') + '/staff'.length);

      if (path === '/session' && method === 'POST') {
        if (api.signInFailure !== null) {
          return Promise.resolve(
            problem(api.signInFailure.status, api.signInFailure.code),
          );
        }
        api.signedIn = true;
        return Promise.resolve(json(api.staffMember));
      }

      if (path === '/session' && method === 'DELETE') {
        api.signedIn = false;
        return Promise.resolve(NO_CONTENT());
      }

      if (!api.signedIn) {
        return Promise.resolve(problem(401, 'UNAUTHENTICATED'));
      }

      if (method !== 'GET' && api.writeFailure !== null) {
        return Promise.resolve(
          problem(api.writeFailure.status, api.writeFailure.code),
        );
      }

      if (path === '/me') {
        if (api.signInCheckFailure !== null) {
          return Promise.resolve(
            problem(api.signInCheckFailure.status, api.signInCheckFailure.code),
          );
        }
        return Promise.resolve(json(api.staffMember));
      }

      if (method === 'GET' && api.readFailure !== null) {
        return Promise.resolve(
          problem(api.readFailure.status, api.readFailure.code),
        );
      }

      if (path.startsWith('/applications/changes')) {
        return Promise.resolve(json({ changes: api.changes }));
      }

      if (path === '/applications') {
        return Promise.resolve(json({ applications: api.applications }));
      }

      if (path === '/members') {
        return Promise.resolve(
          json({
            members: api.owners.map((owner) => ({
              id: owner.id,
              name: owner.name,
            })),
          }),
        );
      }

      // The wire sends `discarded` as a boolean; the row keeps a timestamp.
      const patched = /^\/applications\/([^/]+)$/.exec(path);
      if (patched !== null && method === 'PATCH') {
        const id = patched[1];
        const application = api.applications.find((row) => row.id === id);

        if (application === undefined) {
          return Promise.resolve(problem(404, 'NOT_FOUND'));
        }

        const { discarded, ...edit } = body;
        const updated: Application = {
          ...application,
          ...(edit as Partial<Application>),
          ...(discarded === undefined
            ? {}
            : {
                discardedAt:
                  discarded === true ? REFERENCE_DATE.toISOString() : null,
              }),
        };

        api.applications = api.applications.map((row) =>
          row.id === id ? updated : row,
        );
        return Promise.resolve(json(updated));
      }

      const erased = /^\/applications\/([^/]+)\/permanently$/.exec(path);
      if (erased !== null && method === 'DELETE') {
        const id = erased[1];
        const application = api.applications.find((row) => row.id === id);

        if (application === undefined) {
          return Promise.resolve(problem(404, 'NOT_FOUND'));
        }

        if (application.discardedAt === null) {
          return Promise.resolve(problem(400, 'NOT_DISCARDED'));
        }

        api.applications = api.applications.filter((row) => row.id !== id);
        api.changes = api.changes.filter(
          (change) => change.applicationId !== id,
        );
        return Promise.resolve(NO_CONTENT());
      }

      const documentsOf = /^\/applications\/([^/]+)\/documents$/.exec(path);
      if (documentsOf !== null && method === 'GET') {
        const id = documentsOf[1] ?? '';
        if (!api.applications.some((row) => row.id === id)) {
          return Promise.resolve(problem(404, 'NOT_FOUND'));
        }
        if (api.documentsFailure !== null) {
          return Promise.resolve(
            problem(api.documentsFailure.status, api.documentsFailure.code),
          );
        }
        return Promise.resolve(json({ documents: api.documents[id] ?? [] }));
      }

      if (path === '/categories' && method === 'GET') {
        return Promise.resolve(json({ categories: api.categories }));
      }

      // The server mints the id, so the client has to wait for it.
      if (path === '/categories' && method === 'POST') {
        const created: Category = {
          id: crypto.randomUUID(),
          name: typeof body.name === 'string' ? body.name : '',
          description:
            typeof body.description === 'string' ? body.description : '',
          active: body.active !== false,
        };

        api.categories = [...api.categories, created];
        return Promise.resolve(json(created, 201));
      }

      if (path === '/categories/order' && method === 'PUT') {
        const ids = body.ids as string[];
        const byId = new Map(api.categories.map((row) => [row.id, row]));

        if (
          ids.length !== api.categories.length ||
          ids.some((id) => !byId.has(id))
        ) {
          return Promise.resolve(problem(400, 'VALIDATION_FAILED'));
        }

        api.categories = ids.flatMap((id) => {
          const category = byId.get(id);
          return category === undefined ? [] : [category];
        });
        return Promise.resolve(json({ categories: api.categories }));
      }

      const category = /^\/categories\/([^/]+)$/.exec(path);
      if (category !== null) {
        const id = category[1];
        const existing = api.categories.find((row) => row.id === id);

        if (existing === undefined) {
          return Promise.resolve(problem(404, 'NOT_FOUND'));
        }

        if (method === 'PATCH') {
          const updated = { ...existing, ...(body as Partial<Category>) };
          api.categories = api.categories.map((row) =>
            row.id === id ? updated : row,
          );
          return Promise.resolve(json(updated));
        }

        if (method === 'DELETE') {
          const named = api.applications.some((row) => row.categoryId === id);

          if (named) {
            return Promise.resolve(problem(409, 'CATEGORY_IN_USE'));
          }

          api.categories = api.categories.filter((row) => row.id !== id);
          return Promise.resolve(NO_CONTENT());
        }
      }

      return Promise.resolve(problem(404, 'NOT_FOUND'));
    }),
  );

  return api;
}
