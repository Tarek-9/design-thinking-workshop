import { afterEach, describe, expect, it, vi } from 'vitest';

import { documentPath, fetchApplicationDocuments } from './documents';

const APPLICATION_ID = 'a3f1c0de-4cde-4d61-830b-4af475f5727b';
const DOCUMENT_ID = 'b7e2c4d0-1a2b-4c3d-8e9f-0a1b2c3d4e5f';

const wire = {
  id: DOCUMENT_ID,
  fileName: 'Lebenslauf.pdf',
  contentType: 'application/pdf',
  sizeBytes: 183402,
  uploadedAt: '2026-11-16T09:12:04Z',
};

function answer(body: unknown) {
  const mock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(
    () =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('fetchApplicationDocuments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the Documents of one Application out of their envelope', async () => {
    const mock = answer({ documents: [wire] });

    await expect(fetchApplicationDocuments(APPLICATION_ID)).resolves.toEqual([
      wire,
    ]);
    expect(mock.mock.calls[0]?.[0]).toBe(
      `/api/v1/staff/applications/${APPLICATION_ID}/documents`,
    );
  });

  it('answers an empty list when nothing was attached', async () => {
    answer({ documents: [] });

    await expect(fetchApplicationDocuments(APPLICATION_ID)).resolves.toEqual(
      [],
    );
  });

  it('drops a field the contract does not name', async () => {
    answer({ documents: [{ ...wire, storedName: 'never-exposed' }] });

    const [document] = await fetchApplicationDocuments(APPLICATION_ID);

    expect(document).not.toHaveProperty('storedName');
  });
});

describe('documentPath', () => {
  it('addresses the attachment endpoint of one document of one Application', () => {
    expect(documentPath(APPLICATION_ID, DOCUMENT_ID)).toBe(
      `/api/v1/staff/applications/${APPLICATION_ID}/documents/${DOCUMENT_ID}`,
    );
  });
});
