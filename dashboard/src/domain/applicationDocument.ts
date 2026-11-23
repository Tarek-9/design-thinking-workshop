/** Metadata only: the bytes come from a plain download link. */
export type ApplicationDocument = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
};
