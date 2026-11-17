const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

/**
 * A file size for a Staff member to read: whole kilobytes below a megabyte,
 * one decimal in megabytes above it, German decimal comma. A non-empty file
 * never reads as zero kilobytes.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < BYTES_PER_MB) {
    return `${String(Math.max(1, Math.round(bytes / BYTES_PER_KB)))} KB`;
  }

  return `${(bytes / BYTES_PER_MB).toLocaleString('de-DE', {
    maximumFractionDigits: 1,
  })} MB`;
}
