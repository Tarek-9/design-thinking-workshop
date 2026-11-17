/**
 * A file an Applicant attached (`API.md`, "Documents"); the list holds
 * metadata only, the bytes come from a plain download link.
 */
export type ApplicationDocument = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** Server-stamped, an ISO timestamp. */
  uploadedAt: string;
};
