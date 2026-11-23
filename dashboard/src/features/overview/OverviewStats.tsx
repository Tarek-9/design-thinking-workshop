import { Clock, Inbox01, User01 } from '@untitledui/icons';
import type { FC } from 'react';
import { useMemo } from 'react';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { SparklineType } from '@/components/ui/sparkline';
import { Sparkline } from '@/components/ui/sparkline';
import { de } from '@/content/de';
import type { Application } from '@/domain/application';
import { STALE_AFTER_DAYS } from '@/domain/application';
import type { StateChange } from '@/domain/stateChange';
import type { ApplicationFilters } from '@/features/applications/filterApplications';
import {
  EMPTY_FILTERS,
  filterApplications,
} from '@/features/applications/filterApplications';
import { cx } from '@/utils/cx';
import { MILLISECONDS_PER_DAY } from '@/utils/dates';

import { applicationsAsOf } from './applicationsAsOf';

type OverviewStatsProps = {
  applications: readonly Application[];
  stateChanges: readonly StateChange[];
  now: Date;
};

const HISTORY_DAYS = 7;
// The same 1.75 as the icons, so the whole surface keeps one stroke weight.
const SPARKLINE_STROKE_WIDTH = 1.75;
// getDay() counts from Sunday, so the labels start there.
const WEEKDAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

type DayAsOf = {
  day: Date;
  applications: readonly Application[];
};

function trailingDays(referenceDate: Date, days: number): Date[] {
  return Array.from(
    { length: days },
    (_, index) =>
      new Date(
        referenceDate.getTime() - (days - 1 - index) * MILLISECONDS_PER_DAY,
      ),
  );
}

// Built once for all cards. The last day is referenceDate, where nothing is
// undone, so a card's number and its sparkline end cannot disagree.
function weekAsOf(
  applications: readonly Application[],
  stateChanges: readonly StateChange[],
  referenceDate: Date,
): DayAsOf[] {
  return trailingDays(referenceDate, HISTORY_DAYS).map((day) => ({
    day,
    applications: applicationsAsOf(applications, stateChanges, day),
  }));
}

// Each day is aged against its own date, so the trend is real.
function historyFor(
  week: readonly DayAsOf[],
  filters: Partial<ApplicationFilters>,
): number[] {
  return week.map(
    (entry) =>
      filterApplications(
        entry.applications,
        { ...EMPTY_FILTERS, ...filters },
        entry.day,
      ).length,
  );
}

function weekdayLabelsFor(referenceDate: Date): string[] {
  return trailingDays(referenceDate, HISTORY_DAYS).map(
    (day) => WEEKDAY_LABELS[day.getDay()] ?? '',
  );
}

function hrefFor(filters: Partial<ApplicationFilters>): string {
  const params = new URLSearchParams();
  if (filters.view) {
    params.set('view', filters.view);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  return `#applications?${params.toString()}`;
}

type StatCard = {
  title: string;
  hint: string;
  icon: FC<{ className?: string; 'aria-hidden'?: 'true' }>;
  filters: Partial<ApplicationFilters>;
  chart: SparklineType;
  color: string;
  alert: boolean;
};

const STAT_CARDS: readonly StatCard[] = [
  {
    title: de.overview.stats.new.title,
    hint: de.overview.stats.new.hint,
    icon: Inbox01,
    filters: { view: 'all', status: 'NEW' },
    chart: 'bar',
    color: 'var(--color-trend-neutral)',
    alert: false,
  },
  {
    title: de.overview.stats.unassigned.title,
    hint: de.overview.stats.unassigned.hint,
    icon: User01,
    filters: { view: 'unassigned' },
    chart: 'area',
    color: 'var(--color-trend-accent)',
    alert: false,
  },
  {
    title: de.overview.stats.stale.title,
    hint: de.overview.stats.stale.hint(STALE_AFTER_DAYS),
    icon: Clock,
    filters: { view: 'stale' },
    chart: 'area',
    color: 'var(--color-utility-red-500)',
    alert: true,
  },
];

export function OverviewStats({
  applications,
  stateChanges,
  now,
}: OverviewStatsProps) {
  const weekdayLabels = weekdayLabelsFor(now);

  const week = useMemo(
    () => weekAsOf(applications, stateChanges, now),
    [applications, stateChanges, now],
  );

  const cards = STAT_CARDS.map((card) => ({
    ...card,
    value: filterApplications(
      applications,
      { ...EMPTY_FILTERS, ...card.filters },
      now,
    ).length,
    history: historyFor(week, card.filters),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <a
          key={card.title}
          href={hrefFor(card.filters)}
          className="group outline-focus-ring rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Card className="border-border-secondary group-hover:border-border-primary @container/card relative grid h-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 rounded-xl p-5 shadow-none transition-colors duration-150">
            <CardDescription className="text-text-secondary col-span-2 pr-7 text-sm font-medium">
              {card.title}
            </CardDescription>
            <card.icon
              aria-hidden="true"
              className={cx(
                'text-fg-quaternary absolute top-5 right-5 size-4.5',
                card.alert && 'text-utility-red-500',
              )}
            />
            <p className="text-text-tertiary col-span-2 text-xs leading-5">
              {card.hint}
            </p>
            <CardTitle
              className={cx(
                'tracking-heading text-text-primary mt-3 self-end text-(length:--text-metric) font-semibold tabular-nums',
                card.alert && 'text-utility-red-700',
              )}
            >
              {card.value}
            </CardTitle>
            <Sparkline
              id={card.title}
              type={card.chart}
              color={card.color}
              data={card.history}
              labels={weekdayLabels}
              chartClassName="h-10"
              strokeWidth={SPARKLINE_STROKE_WIDTH}
              labelClassName="text-[10px] @max-[20rem]/card:hidden"
              className="col-start-2 row-start-3 mt-3 w-16 self-end @[16rem]/card:w-24 @[20rem]/card:w-28"
            />
          </Card>
        </a>
      ))}
    </div>
  );
}
