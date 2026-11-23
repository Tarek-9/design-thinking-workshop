import { Archive, FlipBackward, Trash01, Trash03 } from '@untitledui/icons';
import { useMemo, useRef, useState } from 'react';

import type { ApplicationRowAction } from '@/components/application/application-table/application-table';
import { ApplicationTable } from '@/components/application/application-table/application-table';
import { Button } from '@/components/base/buttons/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { de } from '@/content/de';
import type { Application, Category, Owner } from '@/domain/application';
import { matchesSearch } from '@/features/applications/filterApplications';
import { SearchField } from '@/features/applications/SearchField';
import { useSearchShortcut } from '@/hooks/use-search-shortcut';

type DiscardedApplicationsScreenProps = {
  applications: readonly Application[];
  onRestore: (ids: ReadonlySet<string>) => void;
  onErase: (ids: ReadonlySet<string>) => void;
  categories: readonly Category[];
  owners: readonly Owner[];
  now: Date;
};

export function DiscardedApplicationsScreen({
  applications,
  onRestore,
  onErase,
  categories,
  owners,
  now,
}: DiscardedApplicationsScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  // A flag: the dialog asks about the selection as it stands.
  const [eraseConfirmOpen, setEraseConfirmOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchRef);

  const visible = useMemo(
    () =>
      applications.filter((application) => matchesSearch(application, search)),
    [applications, search],
  );

  function forget(ids: ReadonlySet<string>): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  }

  function restore(ids: ReadonlySet<string>): void {
    onRestore(ids);
    forget(ids);
  }

  function erase(ids: ReadonlySet<string>): void {
    onErase(ids);
    forget(ids);
  }

  const rowActions: ApplicationRowAction[] = [
    {
      id: 'restore',
      icon: FlipBackward,
      label: (application) => de.discarded.restoreOne(application.name),
      onAction: (application) => {
        restore(new Set([application.id]));
      },
    },
    {
      id: 'erase',
      icon: Trash03,
      label: (application) => de.discarded.eraseOne(application.name),
      confirm: (application) => ({
        title: de.discarded.confirmEraseOne(application.name),
        description: de.discarded.eraseWarning,
        confirmLabel: de.discarded.erase,
      }),
      destructive: true,
      onAction: (application) => {
        erase(new Set([application.id]));
      },
    },
  ];

  const isSearching = search.trim() !== '';

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={de.discarded.eyebrow}
        title={de.discarded.title}
        subtitle={de.discarded.subtitle}
      />

      <p className="text-secondary text-sm">
        {de.discarded.count(visible.length, applications.length)}
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 max-md:flex-col max-md:items-stretch">
          <div className="flex min-w-0 flex-1 flex-wrap gap-3">
            <SearchField ref={searchRef} value={search} onChange={setSearch} />
          </div>

          {/* Restore leads: the irreversible action sits after it in the danger colour. */}
          <Button
            size="md"
            color="secondary"
            iconLeading={FlipBackward}
            isDisabled={selectedIds.size === 0}
            onClick={() => {
              restore(selectedIds);
            }}
          >
            {de.discarded.restoreSelected(selectedIds.size)}
          </Button>

          <Button
            size="md"
            color="secondary-destructive"
            iconLeading={Trash01}
            isDisabled={selectedIds.size === 0}
            onClick={() => {
              if (selectedIds.size > 0) {
                setEraseConfirmOpen(true);
              }
            }}
          >
            {de.discarded.eraseSelected(selectedIds.size)}
          </Button>
        </div>

        <ApplicationTable
          applications={visible}
          categories={categories}
          owners={owners}
          now={now}
          paginated
          unreadState={false}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          rowActions={rowActions}
          ariaLabel={de.discarded.title}
          emptyState={
            <EmptyState
              icon={Archive}
              title={isSearching ? de.discarded.noMatches : de.discarded.empty}
              hint={
                isSearching
                  ? de.discarded.noMatchesHint
                  : de.discarded.emptyHint
              }
            />
          }
        />
      </div>

      {eraseConfirmOpen ? (
        <ConfirmDialog
          title={de.discarded.confirmEraseSelected(selectedIds.size)}
          description={de.discarded.eraseWarning}
          confirmLabel={de.discarded.erase}
          onConfirm={() => {
            erase(selectedIds);
            setEraseConfirmOpen(false);
          }}
          onCancel={() => {
            setEraseConfirmOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
