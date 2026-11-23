// Data is handed in: App owns the one list the four screens share.

import { Archive, Inbox01 } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/base/buttons/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { TabStrip } from '@/components/shared/tab-strip';
import { de } from '@/content/de';
import type {
  Application,
  ApplicationEdit,
  ApplicationView,
  Category,
  Owner,
} from '@/domain/application';
import { APPLICATION_VIEWS, isDiscarded } from '@/domain/application';

import { ApplicationDrawer } from './ApplicationDrawer';
import { ApplicationsList } from './ApplicationsList';
import { ApplicationsToolbar } from './ApplicationsToolbar';
import { DiscardSelectedDialog } from './DiscardSelectedDialog';
import type { ApplicationFilters } from './filterApplications';
import { EMPTY_FILTERS, filterApplications } from './filterApplications';
import { useApplicationActions } from './useApplicationActions';
import type { NotesField } from './useNotesDraft';
import { notesValueFor } from './useNotesDraft';

type ApplicationsScreenProps = {
  now: Date;
  initialFilters?: Partial<ApplicationFilters>;
  applications: readonly Application[];
  onEdit: (id: string, change: ApplicationEdit) => void;
  onDiscard: (ids: ReadonlySet<string>) => void;
  // Owned by Kategorien: a rename there shows in the filter, the list and the drawer.
  categories: readonly Category[];
  owners: readonly Owner[];
  // Held by the container: the note is not read from the cache while it is typed.
  notes: NotesField;
  // Built by the container, so this screen never reads the cache.
  renderDocuments: (applicationId: string) => ReactNode;
};

export function ApplicationsScreen({
  now,
  initialFilters,
  applications,
  onEdit,
  onDiscard,
  categories,
  owners,
  notes,
  renderDocuments,
}: ApplicationsScreenProps) {
  const [filters, setFilters] = useState<ApplicationFilters>(() => ({
    ...EMPTY_FILTERS,
    ...initialFilters,
  }));

  const actions = useApplicationActions({
    applications,
    onEdit,
    onDiscard,
  });

  const visible = useMemo(
    () => filterApplications(applications, filters, now),
    [applications, filters, now],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        APPLICATION_VIEWS.map((view) => [
          view,
          filterApplications(applications, { ...filters, view }, now).length,
        ]),
      ) as Record<ApplicationView, number>,
    [applications, filters, now],
  );

  // The "of" figure excludes discarded Applications.
  const workingCount = useMemo(
    () =>
      applications.filter((application) => !isDiscarded(application)).length,
    [applications],
  );

  const { selected } = actions;

  // An empty backend and an empty filter result need different copy: only the
  // second can be undone by changing the filters.
  const nothingAtAll = applications.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={de.applications.eyebrow}
        title={de.applications.title}
        subtitle={de.applications.subtitle}
      />

      <p className="text-secondary text-sm">
        {de.applications.count(visible.length, workingCount)}
      </p>

      <ApplicationsList
        applications={visible}
        categories={categories}
        owners={owners}
        now={now}
        oldestFirst={
          filters.view === 'stale' || filters.excludeCompleted === true
        }
        paginated
        ariaLabel={de.applications.title}
        onSelect={(application) => {
          actions.toggle(application.id);
        }}
        selectedIds={actions.selectedIds}
        onSelectedIdsChange={actions.setSelectedIds}
        activeId={actions.selectedId}
        onDiscard={(application) => {
          actions.discard(new Set([application.id]));
        }}
        emptyState={
          <EmptyState
            icon={Inbox01}
            title={
              nothingAtAll ? de.applications.empty : de.applications.noMatches
            }
            hint={
              nothingAtAll
                ? de.applications.emptyHint
                : de.applications.noMatchesHint
            }
          />
        }
        toolbar={
          <>
            <div className="flex min-w-0 flex-1 flex-wrap gap-3">
              <TabStrip
                ariaLabel={de.applications.title}
                views={APPLICATION_VIEWS}
                labels={de.views}
                counts={counts}
                current={filters.view}
                onChange={(view) => {
                  setFilters({ ...filters, view });
                }}
              />
            </div>

            <ApplicationsToolbar
              filters={filters}
              categories={categories}
              onChange={setFilters}
            />

            {/* Always shown, disabled while nothing is checked, so the toolbar does not shift. */}
            <Button
              size="md"
              color="secondary"
              iconLeading={Archive}
              isDisabled={actions.selectedIds.size === 0}
              onClick={actions.discardSelected}
            >
              {de.applications.discardSelected(actions.selectedIds.size)}
            </Button>
          </>
        }
      />

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
    </div>
  );
}
