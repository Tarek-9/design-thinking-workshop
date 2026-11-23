import { Plus, Tag01 } from '@untitledui/icons';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/base/buttons/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { TabStrip } from '@/components/shared/tab-strip';
import { de } from '@/content/de';
import type { Application } from '@/domain/application';
import { isDiscarded } from '@/domain/application';
import type { Category, CategoryDraft, CategoryView } from '@/domain/category';
import {
  CATEGORY_VIEWS,
  countApplicationsPerCategory,
  moveCategory,
} from '@/domain/category';
import { SearchField } from '@/features/applications/SearchField';
import { useSearchShortcut } from '@/hooks/use-search-shortcut';

import { CategoriesTable } from './CategoriesTable';
import { CategoryDialog } from './CategoryDialog';

type CategoriesScreenProps = {
  // Owned by App, so a rename here shows on the other screens too.
  categories: readonly Category[];
  onCreate: (draft: CategoryDraft) => void;
  onEdit: (id: string, draft: CategoryDraft) => void;
  onSetActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: readonly string[]) => void;
  applications: readonly Application[];
};

type Editing = Category | 'new' | null;

function matchesView(category: Category, view: CategoryView): boolean {
  return (
    view === 'all' ||
    (view === 'active' && category.active) ||
    (view === 'inactive' && !category.active)
  );
}

function matchesSearch(category: Category, search: string): boolean {
  const needle = search.trim().toLocaleLowerCase('de');

  if (needle === '') {
    return true;
  }

  return (
    category.name.toLocaleLowerCase('de').includes(needle) ||
    category.description.toLocaleLowerCase('de').includes(needle)
  );
}

export function CategoriesScreen({
  categories,
  onCreate,
  onEdit,
  onSetActive,
  onDelete,
  onReorder,
  applications,
}: CategoriesScreenProps) {
  const [view, setView] = useState<CategoryView>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchRef);

  // The column skips discarded Applications; the delete guard counts them, because
  // a restored one must not point at a deleted Category.
  const usage = useMemo(
    () =>
      countApplicationsPerCategory(
        applications.filter((application) => !isDiscarded(application)),
      ),
    [applications],
  );

  const namedBy = useMemo(
    () => countApplicationsPerCategory(applications),
    [applications],
  );

  const visible = useMemo(
    () =>
      categories.filter(
        (category) =>
          matchesView(category, view) && matchesSearch(category, search),
      ),
    [categories, view, search],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORY_VIEWS.map((candidate) => [
          candidate,
          categories.filter(
            (category) =>
              matchesView(category, candidate) &&
              matchesSearch(category, search),
          ).length,
        ]),
      ) as Record<CategoryView, number>,
    [categories, search],
  );

  const activeCount = categories.filter((category) => category.active).length;
  // A discarded Application still counts as a choice here.
  const unusedCount = categories.filter(
    (category) => (namedBy.get(category.id) ?? 0) === 0,
  ).length;

  // Swapping with a neighbour only makes sense while every row is on screen.
  const canReorder = view === 'all' && search.trim() === '';

  function save(draft: CategoryDraft): void {
    if (editing === null) {
      return;
    }

    if (editing === 'new') {
      onCreate(draft);
    } else {
      onEdit(editing.id, draft);
    }

    setEditing(null);
  }

  function remove(category: Category): void {
    // The row button is disabled too; this check guards the data rule.
    if ((namedBy.get(category.id) ?? 0) > 0) {
      return;
    }

    setDeleting(category);
  }

  const summary = [
    {
      label: de.categories.summary.total,
      hint: de.categories.summary.totalHint,
      value: categories.length,
    },
    {
      label: de.categories.summary.active,
      hint: de.categories.summary.activeHint,
      value: activeCount,
    },
    {
      label: de.categories.summary.unused,
      hint: de.categories.summary.unusedHint,
      value: unusedCount,
    },
  ];

  const isSearching = search.trim() !== '' || view !== 'all';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={de.categories.eyebrow}
        title={de.categories.title}
        subtitle={de.categories.subtitle}
        action={
          <Button
            size="md"
            color="primary"
            iconLeading={Plus}
            onClick={() => {
              setEditing('new');
            }}
          >
            {de.categories.add}
          </Button>
        }
      />

      <div className="border-border-secondary bg-bg-primary grid grid-cols-1 overflow-hidden rounded-xl border sm:grid-cols-3">
        {summary.map((cell, index) => (
          <div
            key={cell.label}
            className={
              index === 0
                ? 'flex flex-col gap-1 p-5'
                : 'border-border-secondary flex flex-col gap-1 border-t p-5 sm:border-t-0 sm:border-l'
            }
          >
            <p className="text-text-secondary text-sm font-medium">
              {cell.label}
            </p>
            <p className="text-text-tertiary text-xs leading-5">{cell.hint}</p>
            <p className="text-text-primary tracking-heading mt-2 text-(length:--text-metric) font-semibold tabular-nums">
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
          <div className="flex min-w-0 flex-1 flex-wrap gap-3">
            <TabStrip
              ariaLabel={de.categories.title}
              views={CATEGORY_VIEWS}
              labels={de.categories.views}
              counts={counts}
              current={view}
              onChange={setView}
            />
          </div>

          <SearchField ref={searchRef} value={search} onChange={setSearch} />
        </div>

        <CategoriesTable
          categories={visible}
          allCategories={categories}
          usage={usage}
          namedBy={namedBy}
          canReorder={canReorder}
          onEdit={setEditing}
          onDelete={remove}
          onToggleActive={(category, active) => {
            onSetActive(category.id, active);
          }}
          onMove={(category, direction) => {
            onReorder(moveCategory(categories, category.id, direction));
          }}
          emptyState={
            <EmptyState
              icon={Tag01}
              title={
                isSearching ? de.categories.noMatches : de.categories.empty
              }
              hint={
                isSearching
                  ? de.categories.noMatchesHint
                  : de.categories.emptyHint
              }
              action={
                isSearching ? undefined : (
                  <Button
                    size="md"
                    color="secondary"
                    iconLeading={Plus}
                    onClick={() => {
                      setEditing('new');
                    }}
                  >
                    {de.categories.add}
                  </Button>
                )
              }
            />
          }
        />
      </div>

      {deleting === null ? null : (
        <ConfirmDialog
          title={de.categories.confirmDelete(deleting.name)}
          description={de.categories.confirmDeleteHint}
          confirmLabel={de.categories.delete}
          onConfirm={() => {
            onDelete(deleting.id);
            setDeleting(null);
          }}
          onCancel={() => {
            setDeleting(null);
          }}
        />
      )}

      {editing !== null && (
        <CategoryDialog
          // Keyed so a second edit starts from fresh draft state.
          key={editing === 'new' ? 'new' : editing.id}
          category={editing === 'new' ? null : editing}
          categories={categories}
          onSubmit={save}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
