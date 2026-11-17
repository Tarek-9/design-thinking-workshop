import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { validationProblem } from '../../mocks/handlers';
import { server } from '../../mocks/server';
import { countUploadedFiles } from '../../test/multipart';
import { fetchCategories, uploadDocuments } from './api';

const APPLICATION_ID = '55555555-5555-4555-8555-555555555555';

function pdf(name = 'lebenslauf.pdf'): File {
  return new File(['%PDF-1.4'], name, { type: 'application/pdf' });
}

describe('uploadDocuments', () => {
  it('sends every file as a multipart part named files, against the application', async () => {
    let path = '';
    let parts = 0;
    server.use(
      http.post(
        '*/api/v1/applications/:applicationId/documents',
        async ({ request, params }) => {
          path = String(params.applicationId);
          parts = await countUploadedFiles(request);
          return new HttpResponse(null, { status: 201 });
        },
      ),
    );

    const result = await uploadDocuments(APPLICATION_ID, [
      pdf('a.pdf'),
      pdf('b.pdf'),
    ]);

    expect(result).toEqual({ status: 'success' });
    expect(path).toBe(APPLICATION_ID);
    expect(parts).toBe(2);
  });

  it('returns the field errors the backend names, for the form to place', async () => {
    server.use(
      http.post('*/api/v1/applications/:applicationId/documents', () =>
        validationProblem([{ field: 'files', code: 'DOCUMENT_TOO_LARGE' }]),
      ),
    );

    const result = await uploadDocuments(APPLICATION_ID, [pdf()]);

    expect(result).toEqual({
      status: 'field-errors',
      errors: [{ field: 'files', code: 'DOCUMENT_TOO_LARGE' }],
    });
  });

  it('reports a proxy 413 as an oversized file', async () => {
    server.use(
      http.post(
        '*/api/v1/applications/:applicationId/documents',
        () => new HttpResponse(null, { status: 413 }),
      ),
    );

    const result = await uploadDocuments(APPLICATION_ID, [pdf()]);

    expect(result).toEqual({
      status: 'field-errors',
      errors: [{ field: 'files', code: 'DOCUMENT_TOO_LARGE' }],
    });
  });

  it('fails without field errors on a server error', async () => {
    server.use(
      http.post(
        '*/api/v1/applications/:applicationId/documents',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const result = await uploadDocuments(APPLICATION_ID, [pdf()]);

    expect(result).toEqual({ status: 'failed' });
  });

  it('fails when the request never reaches the backend', async () => {
    server.use(
      http.post('*/api/v1/applications/:applicationId/documents', () =>
        HttpResponse.error(),
      ),
    );

    const result = await uploadDocuments(APPLICATION_ID, [pdf()]);

    expect(result).toEqual({ status: 'failed' });
  });
});

describe('fetchCategories', () => {
  it('fails to load when a category id is not shaped like a UUID', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [{ id: 'not-a-uuid', label: 'Social Media' }],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({ status: 'failed' });
  });

  it('fails to load when a category label is empty after trimming', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            { id: '11111111-1111-4111-8111-111111111111', label: '   ' },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({ status: 'failed' });
  });

  it('fails to load when a category label exceeds 120 characters after trimming', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              label: `  ${'a'.repeat(121)}  `,
            },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({ status: 'failed' });
  });

  it('accepts a category label that is exactly 120 characters after trimming', async () => {
    const label = 'a'.repeat(120);
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              label: `  ${label}  `,
            },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({
      status: 'success',
      categories: [{ id: '11111111-1111-4111-8111-111111111111', label }],
    });
  });

  it('fails to load when two categories share an id, regardless of letter case', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              label: 'Social Media',
            },
            {
              id: '11111111-1111-4111-8111-111111111111'.toUpperCase(),
              label: 'Redaktion',
            },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({ status: 'failed' });
  });

  it('trims surrounding whitespace from an otherwise valid label', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              label: '  Social Media  ',
            },
          ],
        }),
      ),
    );

    const result = await fetchCategories();

    expect(result).toEqual({
      status: 'success',
      categories: [
        { id: '11111111-1111-4111-8111-111111111111', label: 'Social Media' },
      ],
    });
  });

  it('warns with the reason when it rejects a malformed category', async () => {
    server.use(
      http.get('*/api/v1/categories', () =>
        HttpResponse.json({
          categories: [{ id: 'not-a-uuid', label: 'Social Media' }],
        }),
      ),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await fetchCategories();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-uuid'));
    warn.mockRestore();
  });
});
