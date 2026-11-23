import { ArrowDown, ArrowUp, Edit01, Trash01 } from '@untitledui/icons';
import type { ComponentType, ReactNode } from 'react';

import { Table, TableCard } from '@/components/application/table/table';
import { Toggle } from '@/components/base/toggle/toggle';
import { de } from '@/content/de';
import type { Category } from '@/domain/category';
import { cx } from '@/utils/cx';

type CategoriesTableProps = {
  categories: readonly Category[];
  usage: ReadonlyMap<string, number>;
  // Includes discarded Applications, because the delete guard must see them.
  namedBy: ReadonlyMap<string, number>;
  // Positions come from the full list, so filtered rows keep the form's numbering.
  allCategories: readonly Category[];
  // Only true with every row on screen, so a move stays predictable.
  canReorder: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleActive: (category: Category, active: boolean) => void;
  onMove: (category: Category, direction: -1 | 1) => void;
  emptyState: ReactNode;
};

const PERCENT = 100;

function maxUsage(usage: ReadonlyMap<string, number>): number {
  return Math.max(1, ...usage.values());
}

export function CategoriesTable({
  categories,
  usage,
  namedBy,
  allCategories,
  canReorder,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
  emptyState,
}: CategoriesTableProps) {
  const scale = maxUsage(usage);

  return (
    <TableCard.Root>
      <TableCard.Header
        title={de.categories.tableTitle}
        description={de.categories.tableDescription}
        badge={de.categories.count(categories.length, allCategories.length)}
      />

      <Table aria-label={de.categories.title}>
        <Table.Header>
          <Table.Head id="order" label={de.categories.columns.order} />
          <Table.Head
            id="name"
            label={de.categories.columns.name}
            isRowHeader
            className="w-full max-w-full md:min-w-64"
          />
          <Table.Head id="status" label={de.categories.columns.status} />
          <Table.Head id="usage" label={de.categories.columns.usage} />
          <Table.Head id="actions" aria-label={de.categories.columns.actions} />
        </Table.Header>

        {/* React Aria caches rows by item, so anything read from outside the item
            (position, usage, arrow state) must be listed as a dependency. */}
        <Table.Body
          items={categories}
          dependencies={[allCategories, usage, namedBy, canReorder]}
          renderEmptyState={() => emptyState}
        >
          {(category) => {
            const position = allCategories.findIndex(
              (candidate) => candidate.id === category.id,
            );
            const isFirst = position <= 0;
            const isLast = position === allCategories.length - 1;
            const count = usage.get(category.id) ?? 0;
            const blocking = namedBy.get(category.id) ?? 0;

            return (
              <Table.Row id={category.id}>
                <Table.Cell>
                  <div className="flex items-center gap-1">
                    <span className="text-quaternary w-5 text-xs tabular-nums">
                      {position + 1}
                    </span>
                    <MoveButton
                      icon={ArrowUp}
                      label={de.categories.moveUpOne(category.name)}
                      isDisabled={!canReorder || isFirst}
                      title={
                        canReorder
                          ? de.categories.moveUp
                          : de.categories.moveBlocked
                      }
                      onClick={() => {
                        onMove(category, -1);
                      }}
                    />
                    <MoveButton
                      icon={ArrowDown}
                      label={de.categories.moveDownOne(category.name)}
                      isDisabled={!canReorder || isLast}
                      title={
                        canReorder
                          ? de.categories.moveDown
                          : de.categories.moveBlocked
                      }
                      onClick={() => {
                        onMove(category, 1);
                      }}
                    />
                  </div>
                </Table.Cell>

                <Table.Cell>
                  {/* The name is the edit affordance, so no small icon needs aiming at. */}
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(category);
                    }}
                    className="outline-focus-ring group/name -mx-1 block max-w-full cursor-pointer rounded-md px-1 py-1 text-left focus-visible:outline-2"
                  >
                    <span
                      className={cx(
                        'block text-sm font-medium underline decoration-transparent underline-offset-3 transition-colors duration-150 group-hover/name:decoration-current',
                        category.active ? 'text-primary' : 'text-tertiary',
                      )}
                    >
                      {category.name}
                    </span>
                    <span className="text-tertiary mt-0.5 block max-w-[46ch] text-xs leading-relaxed">
                      {category.description === ''
                        ? de.categories.noDescription
                        : category.description}
                    </span>
                  </button>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center gap-2.5">
                    <Toggle
                      isSelected={category.active}
                      aria-label={de.categories.toggleOne(category.name)}
                      onChange={(active) => {
                        onToggleActive(category, active);
                      }}
                    />
                    {/* The word is for colour-blind readers; the switch alone is only a colour. */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        'text-sm whitespace-nowrap',
                        category.active ? 'text-secondary' : 'text-quaternary',
                      )}
                    >
                      {category.active
                        ? de.categories.active
                        : de.categories.inactive}
                    </span>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex min-w-24 flex-col gap-1.5">
                    <span className="text-secondary text-sm tabular-nums">
                      {de.categories.usageCount(count)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="bg-tertiary block h-1 w-20 overflow-hidden rounded-full"
                    >
                      <span
                        // eslint-disable-next-line no-restricted-syntax -- the bar's width is a share of the largest count, known only at render
                        style={{
                          width: `${String((count / scale) * PERCENT)}%`,
                        }}
                        className="bg-fuut-purple/60 block h-full rounded-full transition-[width] duration-200 ease-out"
                      />
                    </span>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center justify-end gap-1">
                    <RowActionButton
                      icon={Edit01}
                      label={de.categories.editOne(category.name)}
                      title={de.categories.edit}
                      onClick={() => {
                        onEdit(category);
                      }}
                    />
                    <RowActionButton
                      icon={Trash01}
                      label={de.categories.deleteOne(category.name)}
                      title={
                        blocking > 0
                          ? de.categories.deleteBlocked(blocking)
                          : de.categories.delete
                      }
                      isDisabled={blocking > 0}
                      destructive
                      onClick={() => {
                        onDelete(category);
                      }}
                    />
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          }}
        </Table.Body>
      </Table>
    </TableCard.Root>
  );
}

type IconButtonProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  title: string;
  isDisabled?: boolean;
  onClick: () => void;
};

// Stays in the DOM when disabled, so the column does not shift at the ends.
function MoveButton({
  icon: Icon,
  label,
  title,
  isDisabled,
  onClick,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      disabled={isDisabled}
      onClick={onClick}
      className="text-fg-quaternary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary flex size-8 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function RowActionButton({
  icon: Icon,
  label,
  title,
  isDisabled,
  destructive,
  onClick,
}: IconButtonProps & { destructive?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      disabled={isDisabled}
      onClick={onClick}
      className={cx(
        'text-fg-quaternary outline-focus-ring hover:bg-primary_hover flex size-8 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        destructive
          ? 'hover:text-fg-error-primary'
          : 'hover:text-fg-secondary_hover',
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
