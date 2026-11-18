import { describe, expect, it } from 'vitest';

import { formatFileSize } from './fileSize';

describe('formatFileSize', () => {
  it('reads a small file in whole kilobytes, never as zero', () => {
    expect(formatFileSize(1)).toBe('1 KB');
    expect(formatFileSize(183_402)).toBe('179 KB');
  });

  it('reads a file of a megabyte or more in megabytes with a German decimal comma', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1,5 MB');
  });
});
