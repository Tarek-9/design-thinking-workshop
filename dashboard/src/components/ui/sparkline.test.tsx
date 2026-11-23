/** jsdom cannot measure the chart, so only the flat-week switch is tested here. */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Sparkline } from './sparkline';

const LABELS = ['Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di'];

/** The chart is aria-hidden decoration, so it is found by attribute. */
function renderSparkline(data: number[]): HTMLElement {
  const { container } = render(
    <Sparkline
      id="trend"
      type="bar"
      color="var(--color-trend-neutral)"
      data={data}
      labels={LABELS}
    />,
  );

  const chart = container.querySelector<HTMLElement>(
    '[data-sparkline="trend"]',
  );
  expect(chart).not.toBeNull();
  return chart as HTMLElement;
}

describe('Sparkline', () => {
  it('draws one baseline instead of a chart when the whole week is zero', () => {
    const chart = renderSparkline([0, 0, 0, 0, 0, 0, 0]);

    // Bar and area charts disagree on a zero week, so the switch is pinned here.
    expect(chart).toHaveAttribute('data-flat', 'true');
    expect(chart.querySelector('.recharts-responsive-container')).toBeNull();
  });

  it('charts a week that left zero at any point', () => {
    const chart = renderSparkline([0, 0, 1, 0, 0, 0, 0]);

    expect(chart).not.toHaveAttribute('data-flat');
    expect(
      chart.querySelector('.recharts-responsive-container'),
    ).not.toBeNull();
  });

  it('keeps the weekday labels either way, so the seven days stay readable', () => {
    const chart = renderSparkline([0, 0, 0, 0, 0, 0, 0]);

    for (const label of LABELS) {
      expect(chart.textContent).toContain(label);
    }
  });
});
