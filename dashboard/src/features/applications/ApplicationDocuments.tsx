/**
 * The Documents an Application carries, as the drawer lists them; prop-driven
 * (`ADR-0006`). Each file is a plain same-origin link, so the Sign-in cookie
 * travels and nothing here fetches the bytes.
 */

import { Download01 } from '@untitledui/icons';

import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import type { ApplicationDocument } from '@/domain/applicationDocument';
import { formatFileSize } from '@/utils/fileSize';

export type ApplicationDocumentEntry = ApplicationDocument & {
  /** The attachment endpoint for this file, as a same-origin path. */
  href: string;
};

type ApplicationDocumentsProps = {
  status: 'loading' | 'failed' | 'loaded';
  documents: readonly ApplicationDocumentEntry[];
  onRetry: () => void;
};

export function ApplicationDocuments({
  status,
  documents,
  onRetry,
}: ApplicationDocumentsProps) {
  if (status === 'loading') {
    return (
      <p className="text-tertiary text-sm">{de.detail.documentsLoading}</p>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-tertiary text-sm">{de.detail.documentsFailed}</p>
        <Button size="sm" color="secondary" onPress={onRetry}>
          {de.dashboard.retry}
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return <p className="text-tertiary text-sm">{de.detail.documentsEmpty}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {documents.map((document) => (
        <li
          key={document.id}
          className="border-secondary flex items-center gap-3 rounded-[10px] border px-3.5 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <p className="text-primary truncate text-sm font-medium">
              {document.fileName}
            </p>
            <p className="text-tertiary text-xs tabular-nums">
              {formatFileSize(document.sizeBytes)},{' '}
              {de.detail.documentUploadedAt(
                new Date(document.uploadedAt).toLocaleDateString('de-DE'),
              )}
            </p>
          </div>
          <a
            href={document.href}
            aria-label={`${document.fileName}: ${de.detail.documentDownload}`}
            className="text-secondary hover:text-primary outline-focus-ring inline-flex shrink-0 items-center gap-1.5 rounded text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Download01 aria-hidden="true" className="size-4" />
            {de.detail.documentDownload}
          </a>
        </li>
      ))}
    </ul>
  );
}
