import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';

import type { ApplicationDocumentEntry } from './ApplicationDocuments';
import { ApplicationDocuments } from './ApplicationDocuments';

const LEBENSLAUF: ApplicationDocumentEntry = {
  id: 'b7e2c4d0-1a2b-4c3d-8e9f-0a1b2c3d4e5f',
  fileName: 'Lebenslauf.pdf',
  contentType: 'application/pdf',
  sizeBytes: 183402,
  uploadedAt: '2026-11-16T09:12:04Z',
  href: '/api/v1/staff/applications/a1/documents/b7e2c4d0',
};

const ANSCHREIBEN: ApplicationDocumentEntry = {
  ...LEBENSLAUF,
  id: 'c1d2e3f4-0000-4000-8000-000000000000',
  fileName: 'Anschreiben.docx',
  sizeBytes: 1.5 * 1024 * 1024,
  href: '/api/v1/staff/applications/a1/documents/c1d2e3f4',
};

describe('ApplicationDocuments', () => {
  it('lists every document as a link to its attachment download', () => {
    render(
      <ApplicationDocuments
        status="loaded"
        documents={[LEBENSLAUF, ANSCHREIBEN]}
        onRetry={() => undefined}
      />,
    );

    const link = screen.getByRole('link', {
      name: 'Lebenslauf.pdf: Herunterladen',
    });
    expect(link).toHaveAttribute(
      'href',
      '/api/v1/staff/applications/a1/documents/b7e2c4d0',
    );
    expect(
      screen.getByRole('link', { name: 'Anschreiben.docx: Herunterladen' }),
    ).toHaveAttribute(
      'href',
      '/api/v1/staff/applications/a1/documents/c1d2e3f4',
    );
  });

  it("states each file's size and upload date beside its name", () => {
    render(
      <ApplicationDocuments
        status="loaded"
        documents={[LEBENSLAUF, ANSCHREIBEN]}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText(/179 KB/)).toBeInTheDocument();
    expect(screen.getByText(/1,5 MB/)).toBeInTheDocument();
    expect(
      screen.getAllByText(/hochgeladen am 16\.11\.2026/).length,
    ).toBeGreaterThan(0);
  });

  it('says so when nothing was attached', () => {
    render(
      <ApplicationDocuments
        status="loaded"
        documents={[]}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText(de.detail.documentsEmpty)).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the loading sentence while the list is on its way', () => {
    render(
      <ApplicationDocuments
        status="loading"
        documents={[]}
        onRetry={() => undefined}
      />,
    );

    expect(screen.getByText(de.detail.documentsLoading)).toBeVisible();
  });

  it('offers a retry when the list could not be read', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ApplicationDocuments status="failed" documents={[]} onRetry={onRetry} />,
    );

    expect(screen.getByText(de.detail.documentsFailed)).toBeVisible();
    await user.click(screen.getByRole('button', { name: de.dashboard.retry }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
