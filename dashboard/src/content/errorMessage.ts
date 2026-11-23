/** Plain string: the wire can send any code. Unknown codes get the general wording. */

import { de } from './de';

const codes: Record<string, string> = de.errors.codes;
const fieldCodes: Record<string, string> = de.errors.fields;

export function errorMessage(code: string | undefined): string {
  return (code === undefined ? undefined : codes[code]) ?? de.errors.general;
}

export function fieldErrorMessage(code: string | undefined): string {
  return (
    (code === undefined ? undefined : fieldCodes[code]) ?? de.errors.general
  );
}
