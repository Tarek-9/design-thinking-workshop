/**
 * The Documents an Application carries (`API.md`, "Documents"). The list is a
 * read; the download is not a request from here at all. `documentPath` is the
 * `href` of a plain link, so the browser sends the Sign-in cookie itself and
 * the `Content-Disposition: attachment` header makes it a file save.
 */

import type { ApplicationDocument } from '@/domain/applicationDocument';

import { request, STAFF_API } from './transport';

type ApplicationDocumentWire = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
};

export async function fetchApplicationDocuments(
  applicationId: string,
): Promise<ApplicationDocument[]> {
  const { documents } = await request<{
    documents: ApplicationDocumentWire[];
  }>('GET', `/applications/${encodeURIComponent(applicationId)}/documents`);

  return documents.map((document) => ({
    id: document.id,
    fileName: document.fileName,
    contentType: document.contentType,
    sizeBytes: document.sizeBytes,
    uploadedAt: document.uploadedAt,
  }));
}

export function documentPath(
  applicationId: string,
  documentId: string,
): string {
  return `${STAFF_API}/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}`;
}
