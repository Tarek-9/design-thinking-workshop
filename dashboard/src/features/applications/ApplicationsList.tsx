import { Archive } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { ApplicationTable } from '@/components/application/application-table/application-table';
import { de } from '@/content/de';
import type { Application, Category, Owner } from '@/domain/application';

type ApplicationsListProps = {
  applications: readonly Application[];
  categories: readonly Category[];
  owners: readonly Owner[];
  now: Date;
  oldestFirst?: boolean;
  // Übersicht's panel is already cut to five rows by its caller.
  paginated?: boolean;
  ariaLabel: string;
  onSelect: (application: Application) => void;
  // Lifted so the screen's bulk discard button reads the same set.
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (ids: ReadonlySet<string>) => void;
  onDiscard: (application: Application) => void;
  activeId?: string | null;
  toolbar?: ReactNode;
  // Übersicht's panel shows its empty state above the list, since its filter bar
  // would be in the way.
  emptyState?: ReactNode;
};

export function ApplicationsList({
  applications,
  categories,
  owners,
  now,
  oldestFirst,
  paginated,
  ariaLabel,
  onSelect,
  selectedIds,
  onSelectedIdsChange,
  onDiscard,
  activeId,
  toolbar,
  emptyState,
}: ApplicationsListProps) {
  const rowActions = useMemo(
    () => [
      {
        // Discarding is reversible, so the row asks nothing and is not destructive.
        id: 'discard',
        icon: Archive,
        label: (application: Application) =>
          de.applications.discardOne(application.name),
        onAction: onDiscard,
      },
    ],
    [onDiscard],
  );

  const table = (
    <ApplicationTable
      applications={applications}
      categories={categories}
      owners={owners}
      now={now}
      oldestFirst={oldestFirst}
      paginated={paginated}
      onSelect={onSelect}
      selectedIds={selectedIds}
      onSelectedIdsChange={onSelectedIdsChange}
      rowActions={rowActions}
      activeId={activeId}
      ariaLabel={ariaLabel}
      emptyState={emptyState}
    />
  );

  if (toolbar === undefined) {
    return table;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
        {toolbar}
      </div>
      {table}
    </div>
  );
}
