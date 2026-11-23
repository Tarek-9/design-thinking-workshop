import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { cx } from '@/utils/cx';

const CHART_TOP_MARGIN = 4;
const AREA_SIDE_MARGIN = 2;
const AREA_MARGIN = {
  top: CHART_TOP_MARGIN,
  right: AREA_SIDE_MARGIN,
  bottom: 0,
  left: AREA_SIDE_MARGIN,
};
const BAR_MARGIN = { top: CHART_TOP_MARGIN, right: 0, bottom: 0, left: 0 };
const AREA_FILL_OPACITY = 0.05;
const ACTIVE_DOT_RADIUS = 3.5;
const CURSOR_STROKE_WIDTH = 1;
const CURSOR_DASH_ARRAY = '3 3';
const BAR_CORNER_RADIUS = 2;
const BAR_HOVER_OPACITY = 0.1;
const TOOLTIP_Z_INDEX = 50;

export type SparklineType = 'area' | 'bar';

type SparklinePoint = { index: number; value: number; label?: string };

function SparklineTooltipContent({
  active,
  payload,
  color,
}: {
  active?: boolean;
  payload?: readonly { value?: number; payload?: SparklinePoint }[];
  color: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const point = payload[0];
  if (!point) {
    return null;
  }
  const label = point.payload?.label;
  return (
    <div className="border-sd-border bg-sd-popover text-sd-popover-foreground flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md">
      {label && <span className="text-sd-muted-foreground">{label}</span>}
      <span
        className="font-semibold tabular-nums"
        // eslint-disable-next-line no-restricted-syntax -- the series colour arrives as a prop, so no class can name it
        style={{ color }}
      >
        {point.value}
      </span>
    </div>
  );
}

type SparklineProps = {
  id: string;
  type: SparklineType;
  color: string;
  data: readonly number[];
  /** Shown in the tooltip and as a row under the chart. Omit if points have no label. */
  labels?: readonly string[];
  className?: string;
  chartClassName?: string;
  strokeWidth?: number;
  labelClassName?: string;
};

export function Sparkline({
  id,
  type,
  color,
  data,
  labels,
  className,
  chartClassName = 'h-16',
  strokeWidth = 2,
  labelClassName = 'text-[10px]',
}: SparklineProps) {
  const points: SparklinePoint[] = data.map((value, index) => ({
    index,
    value,
    label: labels?.[index],
  }));

  /** Bars draw nothing at zero height, and an area line on the bottom edge reads as an alert. */
  const flat = data.every((value) => value === 0);

  return (
    <div
      data-sparkline={id}
      data-flat={flat ? 'true' : undefined}
      aria-hidden="true"
      className={cx('flex w-20 flex-col gap-1', className)}
    >
      <div
        data-slot="chart"
        className={cx('h-full w-full text-xs', chartClassName)}
      >
        {flat ? (
          <div className="flex h-full w-full items-end">
            <span className="bg-border-secondary h-px w-full rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer>
            {type === 'area' ? (
              <AreaChart data={points} margin={AREA_MARGIN}>
                <Area
                  dataKey="value"
                  type="linear"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  fill={color}
                  fillOpacity={AREA_FILL_OPACITY}
                  isAnimationActive={false}
                  activeDot={{
                    r: ACTIVE_DOT_RADIUS,
                    strokeWidth: 0,
                    fill: color,
                  }}
                />
                <Tooltip
                  cursor={{
                    stroke: color,
                    strokeWidth: CURSOR_STROKE_WIDTH,
                    strokeDasharray: CURSOR_DASH_ARRAY,
                  }}
                  content={<SparklineTooltipContent color={color} />}
                  wrapperStyle={{ outline: 'none', zIndex: TOOLTIP_Z_INDEX }}
                />
              </AreaChart>
            ) : (
              <BarChart data={points} margin={BAR_MARGIN}>
                <Bar
                  dataKey="value"
                  fill={color}
                  radius={[BAR_CORNER_RADIUS, BAR_CORNER_RADIUS, 0, 0]}
                  isAnimationActive={false}
                />
                <Tooltip
                  cursor={{ fill: color, opacity: BAR_HOVER_OPACITY }}
                  content={<SparklineTooltipContent color={color} />}
                  wrapperStyle={{ outline: 'none', zIndex: TOOLTIP_Z_INDEX }}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      {labels && (
        <div
          className={cx(
            'text-sd-muted-foreground flex justify-between leading-none',
            labelClassName,
          )}
        >
          {labels.map((label, index) => (
            <span key={`${label}-${String(index)}`}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
