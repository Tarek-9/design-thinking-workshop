import type { ReactNode } from 'react';

import { PageHeader } from '@/components/shared/page-header';
import { de } from '@/content/de';
import type {
  Application,
  ApplicationEdit,
  Category,
  Owner,
} from '@/domain/application';
import type { StateChange } from '@/domain/stateChange';
import type { NotesField } from '@/features/applications/useNotesDraft';

import { OpenApplicationsPanel } from './OpenApplicationsPanel';
import { OverviewStats } from './OverviewStats';

type OverviewScreenProps = {
  staffName: string;
  applications: readonly Application[];
  stateChanges: readonly StateChange[];
  onEdit: (id: string, change: ApplicationEdit) => void;
  onDiscard: (ids: ReadonlySet<string>) => void;
  categories: readonly Category[];
  owners: readonly Owner[];
  now: Date;
  notes: NotesField;
  renderDocuments: (applicationId: string) => ReactNode;
};

export function OverviewScreen({
  staffName,
  applications,
  stateChanges,
  onEdit,
  onDiscard,
  categories,
  owners,
  now,
  notes,
  renderDocuments,
}: OverviewScreenProps) {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={de.navigation.overview}
          title={de.overview.welcome(staffName)}
          subtitle={de.overview.subtitle}
        />
        <OverviewStats
          applications={applications}
          stateChanges={stateChanges}
          now={now}
        />
      </div>

      <OpenApplicationsPanel
        applications={applications}
        onEdit={onEdit}
        onDiscard={onDiscard}
        categories={categories}
        owners={owners}
        now={now}
        notes={notes}
        renderDocuments={renderDocuments}
      />
    </div>
  );
}
