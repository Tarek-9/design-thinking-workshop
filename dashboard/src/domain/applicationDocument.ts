/**
 * A file an Applicant attached to an Application (`API.md`, "Documents"). The
 * list carries metadata only; the bytes come from the download, which is a
 * plain link and not something this application fetches.
 */
export type ApplicationDocument = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** Server-stamped, an ISO timestamp. */
  uploadedAt: string;
};
