/** Selection, row actions and the pager are opt-in, so each screen enables only what it needs. */

import type { FC, Key, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { Selection, SortDescriptor } from 'react-aria-components';

import {
  PLAIN_STATUS_BADGE_CLASSNAME,
  STATUS_BADGE_COLORS,
} from '@/components/application/application-status/status-styles';
import { PaginationCardDefault } from '@/components/application/pagination/pagination';
import { Table, TableCard } from '@/components/application/table/table';
import { Avatar } from '@/components/base/avatar/avatar';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { de } from '@/content/de';
import type { Application, Category, Owner } from '@/domain/application';
import { isUnassigned, WEEKLY_TIMES } from '@/domain/application';
import { cx } from '@/utils/cx';
import { daysSince } from '@/utils/dates';
import { initialsOf } from '@/utils/initials';

export type ApplicationRowConfirmation = {
  title: string;
  description?: string;
  confirmLabel: string;
};

/** Each list words its own actions, so the wording stays with the screen. */
export type ApplicationRowAction = {
  id: string;
  icon: FC<{ className?: string }>;
  label: (application: Application) => string;
  /** Undoable actions ask nothing: restoring is one click from discarding again. */
  confirm?: (application: Application) => ApplicationRowConfirmation;
  destructive?: boolean;
  onAction: (application: Application) => void;
};

type ApplicationTableProps = {
  applications: readonly Application[];
  categories: readonly Category[];
  owners: readonly Owner[];
  now: Date;
  /** The "Lange offen" queue reads oldest-first. */
  oldestFirst?: boolean;
  /** Off in Übersicht, whose preview is already cut to five rows. */
  paginated?: boolean;
  /** Omitted where a row has no drawer, such as Aussortiert. */
  onSelect?: (application: Application) => void;
  /** Controlled by the screen, so the bulk buttons read the same set. */
  selectedIds?: ReadonlySet<string>;
  onSelectedIdsChange?: (ids: ReadonlySet<string>) => void;
  rowActions?: readonly ApplicationRowAction[];
  /** Off in Aussortiert, where the emphasis would point at nothing. */
  unreadState?: boolean;
  emptyState?: ReactNode;
  activeId?: string | null;
  ariaLabel: string;
};

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const PAGE_SIZE = 10;

export function ApplicationTable({
  applications,
  categories,
  owners,
  now,
  oldestFirst = false,
  paginated = false,
  onSelect,
  selectedIds,
  onSelectedIdsChange,
  rowActions = [],
  unreadState = true,
  emptyState,
  activeId = null,
  ariaLabel,
}: ApplicationTableProps) {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'submittedAt',
    direction: oldestFirst ? 'ascending' : 'descending',
  });

  /** One pending action per table, so two rows cannot ask at once. */
  const [pendingAction, setPendingAction] = useState<{
    action: ApplicationRowAction;
    application: Application;
  } | null>(null);

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const ownersById = useMemo(
    () => new Map(owners.map((owner) => [owner.id, owner])),
    [owners],
  );

  const sortValues = useMemo<
    Record<string, (application: Application) => string | number>
  >(
    () => ({
      name: (application) => application.name,
      email: (application) => application.email,
      category: (application) =>
        categoryNames.get(application.categoryId) ?? application.categoryId,
      // Sorts by WEEKLY_TIMES order: the labels do not sort.
      weeklyTime: (application) => WEEKLY_TIMES.indexOf(application.weeklyTime),
      status: (application) => de.statuses[application.status],
      submittedAt: (application) => new Date(application.submittedAt).getTime(),
      owner: (application) =>
        application.ownerId === null
          ? ''
          : (ownersById.get(application.ownerId)?.name ?? application.ownerId),
    }),
    [categoryNames, ownersById],
  );

  const sorted = useMemo(() => {
    const getSortValue = sortValues[String(sortDescriptor.column)];

    if (!getSortValue) {
      return [...applications];
    }

    return [...applications].sort((a, b) => {
      const first = getSortValue(a);
      const second = getSortValue(b);
      const result =
        typeof first === 'number' && typeof second === 'number'
          ? first - second
          : String(first).localeCompare(String(second), 'de');

      return sortDescriptor.direction === 'descending' ? -result : result;
    });
  }, [applications, sortDescriptor, sortValues]);

  const selectionEnabled = rowActions.length > 0;

  const [page, setPage] = useState(1);

  // A new set starts on page one. Adjusted during render, so no stale page flashes.
  const [pagedApplications, setPagedApplications] =
    useState<readonly Application[]>(applications);
  if (pagedApplications !== applications) {
    setPagedApplications(applications);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () =>
      paginated
        ? sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
        : sorted,
    [sorted, currentPage, paginated],
  );

  /** Only this page's ids reach the table; the rest of the selection is held aside. */
  const pageIds = useMemo(
    () => pageItems.map((application) => application.id),
    [pageItems],
  );
  const selectedOnPage = useMemo(
    () => new Set(pageIds.filter((id) => selectedIds?.has(id))),
    [pageIds, selectedIds],
  );

  return (
    <TableCard.Root>
      <Table
        aria-label={ariaLabel}
        selectionMode={selectionEnabled ? 'multiple' : 'none'}
        selectionBehavior="toggle"
        {...(selectionEnabled
          ? {
              selectedKeys: selectedOnPage,
              onSelectionChange: (keys: Selection) => {
                const next = new Set(selectedIds ?? []);
                // Replace this page's part of the selection; other pages stay checked.
                for (const id of pageIds) {
                  next.delete(id);
                }
                for (const key of keys === 'all' ? pageIds : keys) {
                  next.add(String(key));
                }
                onSelectedIdsChange?.(next);
              },
            }
          : {})}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        {...(onSelect
          ? {
              onRowAction: (key: Key) => {
                const application = applications.find(
                  (candidate) => candidate.id === String(key),
                );
                if (application) {
                  onSelect(application);
                }
              },
            }
          : {})}
      >
        <Table.Header>
          <Table.Head
            id="name"
            label={de.columns.name}
            isRowHeader
            allowsSorting
            className="w-full max-w-full md:min-w-52"
          />
          <Table.Head id="email" label={de.columns.email} allowsSorting />
          <Table.Head id="category" label={de.columns.category} allowsSorting />
          <Table.Head
            id="weeklyTime"
            label={de.columns.weeklyTime}
            allowsSorting
          />
          <Table.Head id="status" label={de.columns.status} allowsSorting />
          <Table.Head
            id="submittedAt"
            label={de.columns.submittedAt}
            allowsSorting
          />
          <Table.Head id="owner" label={de.columns.owner} allowsSorting />
          {selectionEnabled ? (
            <Table.Head id="actions" aria-label={de.columns.actions} />
          ) : null}
        </Table.Header>

        {/* activeId is read by the row renderer, not part of items: the collection must re-render when it moves. */}
        <Table.Body
          items={pageItems}
          dependencies={[activeId]}
          {...(emptyState === undefined
            ? {}
            : { renderEmptyState: () => emptyState })}
        >
          {(application) => {
            const unassigned = unreadState && isUnassigned(application);
            const owner =
              application.ownerId === null
                ? null
                : (ownersById.get(application.ownerId) ?? null);
            const ownerName =
              application.ownerId === null
                ? null
                : (owner?.name ?? application.ownerId);

            return (
              <Table.Row
                id={application.id}
                className={cx(
                  onSelect && 'cursor-pointer',
                  unassigned && 'bg-bg-unread',
                  // Sits on the first cell: a pseudo-element on a tr breaks the table.
                  application.id === activeId && 'row-rail',
                )}
              >
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {/* Decorative: the Owner column already says it in words. */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        'size-1.5 shrink-0 rounded-full',
                        unassigned ? 'bg-fuut-purple' : 'bg-transparent',
                      )}
                    />
                    <span aria-hidden="true" className="flex">
                      <Avatar
                        size="sm"
                        initials={initialsOf(application.name)}
                      />
                    </span>
                    <p
                      className={cx(
                        'text-sm whitespace-nowrap',
                        unassigned
                          ? 'text-primary font-semibold'
                          : 'text-secondary font-medium',
                      )}
                    >
                      {application.name}
                    </p>
                  </div>
                </Table.Cell>

                <Table.Cell className="whitespace-nowrap">
                  {application.email}
                </Table.Cell>

                <Table.Cell className="whitespace-nowrap">
                  {categoryNames.get(application.categoryId) ??
                    application.categoryId}
                </Table.Cell>

                <Table.Cell className="whitespace-nowrap">
                  {de.weeklyTimes[application.weeklyTime]}
                </Table.Cell>

                <Table.Cell>
                  <BadgeWithDot
                    size="sm"
                    type="pill-color"
                    color={STATUS_BADGE_COLORS[application.status]}
                    className={PLAIN_STATUS_BADGE_CLASSNAME}
                  >
                    {de.statuses[application.status]}
                  </BadgeWithDot>
                </Table.Cell>

                <Table.Cell className="whitespace-nowrap tabular-nums">
                  <time dateTime={application.submittedAt}>
                    {dateFormatter.format(new Date(application.submittedAt))}
                  </time>
                  <span className="text-tertiary block text-xs leading-5">
                    {de.application.daysAgo(
                      daysSince(application.submittedAt, now),
                    )}
                  </span>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center gap-2.5">
                    {/* Initials, or the empty glyph. alt="" because the name sits right beside it. */}
                    <Avatar
                      size="xs"
                      alt=""
                      initials={
                        ownerName === null ? undefined : initialsOf(ownerName)
                      }
                    />
                    <span
                      className={cx(
                        'whitespace-nowrap',
                        ownerName === null && 'text-quaternary',
                      )}
                    >
                      {ownerName ?? de.application.unassigned}
                    </span>
                  </div>
                </Table.Cell>

                {selectionEnabled ? (
                  <Table.Cell>
                    {/* 8px gap, so two adjacent actions cannot be mis-clicked. */}
                    <div className="flex items-center gap-2">
                      {rowActions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          aria-label={action.label(application)}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (action.confirm === undefined) {
                              action.onAction(application);
                              return;
                            }
                            setPendingAction({ action, application });
                          }}
                          className={cx(
                            'text-fg-quaternary outline-focus-ring hover:bg-primary_hover cursor-pointer rounded-md p-1.5 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2',
                            action.destructive
                              ? 'hover:text-fg-error-primary'
                              : 'hover:text-fg-brand-primary_alt',
                          )}
                        >
                          <action.icon className="size-4" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </Table.Cell>
                ) : null}
              </Table.Row>
            );
          }}
        </Table.Body>
      </Table>

      {/* No pager on an empty table: it would offer a page that does not exist. */}
      {paginated && sorted.length > 0 ? (
        <PaginationCardDefault
          page={currentPage}
          total={totalPages}
          onPageChange={setPage}
        />
      ) : null}

      {pendingAction === null ? null : (
        <RowActionConfirmation
          action={pendingAction.action}
          application={pendingAction.application}
          onSettled={() => {
            setPendingAction(null);
          }}
        />
      )}
    </TableCard.Root>
  );
}

/** Renders only with a confirmation, so the dialog never lacks its question. */
function RowActionConfirmation({
  action,
  application,
  onSettled,
}: {
  action: ApplicationRowAction;
  application: Application;
  onSettled: () => void;
}) {
  const confirmation = action.confirm?.(application);

  if (confirmation === undefined) {
    return null;
  }

  return (
    <ConfirmDialog
      title={confirmation.title}
      description={confirmation.description}
      confirmLabel={confirmation.confirmLabel}
      destructive={action.destructive ?? false}
      onConfirm={() => {
        action.onAction(application);
        onSettled();
      }}
      onCancel={onSettled}
    />
  );
}
