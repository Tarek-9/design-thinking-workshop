import { Archive, Inbox01 } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/base/buttons/button';
import { EmptyState } from '@/components/shared/empty-state';
import { de } from '@/content/de';
import type {
  Application,
  ApplicationEdit,
  Category,
  Owner,
} from '@/domain/application';
import { ApplicationDrawer } from '@/features/applications/ApplicationDrawer';
import { ApplicationsList } from '@/features/applications/ApplicationsList';
import { DiscardSelectedDialog } from '@/features/applications/DiscardSelectedDialog';
import { buildApplicationsHref } from '@/features/applications/filterApplications';
import { useApplicationActions } from '@/features/applications/useApplicationActions';
import type { NotesField } from '@/features/applications/useNotesDraft';
import { notesValueFor } from '@/features/applications/useNotesDraft';

import { OpenApplicationsFilterBar } from './OpenApplicationsFilterBar';
import type { OpenApplicationsFilters } from './selectOpenApplications';
import {
  EMPTY_OPEN_APPLICATIONS_FILTERS,
  OPEN_APPLICATIONS_LIMIT,
  selectOpenApplications,
} from './selectOpenApplications';

type OpenApplicationsPanelProps = {
  applications: readonly Application[];
  onEdit: (id: string, change: ApplicationEdit) => void;
  onDiscard: (ids: ReadonlySet<string>) => void;
  // Owned by Kategorien, so the filter and the rows read the edited list.
  categories: readonly Category[];
  owners: readonly Owner[];
  now: Date;
  notes: NotesField;
  renderDocuments: (applicationId: string) => ReactNode;
};

function hasActiveFilters(filters: OpenApplicationsFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.categoryId !== null ||
    filters.ownerId !== null
  );
}

export function OpenApplicationsPanel({
  applications,
  onEdit,
  onDiscard,
  categories,
  owners,
  now,
  notes,
  renderDocuments,
}: OpenApplicationsPanelProps) {
  const [filters, setFilters] = useState<OpenApplicationsFilters>(
    EMPTY_OPEN_APPLICATIONS_FILTERS,
  );

  const actions = useApplicationActions({
    applications,
    onEdit,
    onDiscard,
  });

  const anyOpen = useMemo(
    () =>
      selectOpenApplications(applications, EMPTY_OPEN_APPLICATIONS_FILTERS)
        .length > 0,
    [applications],
  );
  const matching = useMemo(
    () => selectOpenApplications(applications, filters),
    [applications, filters],
  );
  const visible = matching.slice(0, OPEN_APPLICATIONS_LIMIT);

  const { selected } = actions;

  const viewAllHref = buildApplicationsHref({
    excludeCompleted: true,
    search: filters.search,
    categoryId: filters.categoryId,
    ownerId: filters.ownerId,
  });

  const subtitle =
    anyOpen && matching.length > 0
      ? de.overview.openApplications.count(visible.length, matching.length)
      : null;

  return (
    <section
      aria-label={de.overview.openApplications.title}
      className="border-border-secondary bg-bg-primary flex flex-col gap-5 rounded-xl border p-6"
    >
      <div>
        <h2 className="text-text-primary tracking-heading text-xl leading-tight font-semibold">
          {de.overview.openApplications.title}
        </h2>
        {subtitle ? (
          <p className="text-text-tertiary mt-1 text-sm">{subtitle}</p>
        ) : null}

        {/* Shown while anything is open, not while a filter matches, so
            filtering down to nothing cannot hide the controls. */}
        {anyOpen ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <OpenApplicationsFilterBar
              filters={filters}
              categories={categories}
              owners={owners}
              onChange={setFilters}
            />
            <div className="flex flex-wrap items-center gap-3">
              {hasActiveFilters(filters) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters(EMPTY_OPEN_APPLICATIONS_FILTERS);
                  }}
                  className="text-fuut-purple text-sm font-medium hover:underline"
                >
                  {de.filters.reset}
                </button>
              )}

              {/* Always shown and disabled while nothing is checked, so ticking a row does not shift the bar. */}
              <Button
                size="md"
                color="secondary"
                iconLeading={Archive}
                isDisabled={actions.selectedIds.size === 0}
                onClick={actions.discardSelected}
              >
                {de.applications.discardSelected(actions.selectedIds.size)}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {!anyOpen ? (
        <EmptyState
          icon={Inbox01}
          title={de.overview.openApplications.empty}
          hint={de.overview.openApplications.emptyHint}
        />
      ) : matching.length === 0 ? (
        <EmptyState
          icon={Inbox01}
          title={de.overview.openApplications.noMatches}
          hint={de.overview.openApplications.noMatchesHint}
        />
      ) : (
        <>
          <ApplicationsList
            applications={visible}
            categories={categories}
            owners={owners}
            now={now}
            ariaLabel={de.overview.openApplications.title}
            onSelect={(application) => {
              actions.open(application.id);
            }}
            selectedIds={actions.selectedIds}
            onSelectedIdsChange={actions.setSelectedIds}
            activeId={actions.selectedId}
            onDiscard={(application) => {
              actions.discard(new Set([application.id]));
            }}
          />
          <div className="flex justify-end">
            <a
              href={viewAllHref}
              className="text-fuut-purple text-sm font-medium hover:underline"
            >
              {de.overview.openApplications.viewAll}
            </a>
          </div>
        </>
      )}

      {selected ? (
        <ApplicationDrawer
          application={selected}
          categories={categories}
          owners={owners}
          onClose={actions.close}
          onChange={(change) => {
            actions.update(selected.id, change);
          }}
          notesValue={notesValueFor(notes, selected)}
          onNotesChange={(text) => {
            notes.onChange(selected.id, text);
          }}
          documents={renderDocuments(selected.id)}
        />
      ) : null}

      {actions.discardConfirmOpen ? (
        <DiscardSelectedDialog
          count={actions.selectedIds.size}
          onConfirm={actions.confirmDiscardSelected}
          onCancel={actions.cancelDiscardSelected}
        />
      ) : null}
    </section>
  );
}
