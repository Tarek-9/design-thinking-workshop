import { describe, expect, it } from 'vitest';

import { expectNoA11yViolations } from './a11y';

/** Checks that the helper still fails on a violation. */
describe('expectNoA11yViolations', () => {
  it('rejects a control with no label', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<input type="email" />';
    document.body.append(container);

    await expect(expectNoA11yViolations(container)).rejects.toThrow(
      /accessibility violation/,
    );
  });

  it('accepts a labelled control', async () => {
    const container = document.createElement('div');
    container.innerHTML =
      '<label for="a">E-Mail</label><input id="a" type="email" />';
    document.body.append(container);

    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
