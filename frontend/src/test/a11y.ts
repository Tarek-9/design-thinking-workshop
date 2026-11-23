import axe, { type Result } from 'axe-core';

// axe-core is used directly: the vitest-axe matcher never registers.
// color-contrast is off: jsdom computes no colour, so it would pass vacuously.
export async function expectNoA11yViolations(
  container: HTMLElement,
): Promise<void> {
  const { violations } = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });

  if (violations.length === 0) return;

  throw new Error(
    `${String(violations.length)} accessibility violation(s):\n\n${violations
      .map(describe)
      .join('\n\n')}`,
  );
}

function describe(violation: Result): string {
  const nodes = violation.nodes.map((node) => `    ${node.html}`).join('\n');

  return [
    `  [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}`,
    `  ${violation.helpUrl}`,
    nodes,
  ].join('\n');
}
