// Holds the QueryClient; ApplicationsScreen stays testable through fixtures and props.

import { useApplications } from '@/queries/applications';
import { useCategories } from '@/queries/categories';
import { useOwners } from '@/queries/staffMembers';

import { ApplicationDocumentsContainer } from './ApplicationDocumentsContainer';
import { ApplicationsScreen } from './ApplicationsScreen';
import type { ApplicationFilters } from './filterApplications';
import { useApplicationWrites } from './useApplicationWrites';

type ApplicationsContainerProps = {
  now: Date;
  initialFilters?: Partial<ApplicationFilters>;
};

export function ApplicationsContainer({
  now,
  initialFilters,
}: ApplicationsContainerProps) {
  const applications = useApplications();
  const categories = useCategories();
  const owners = useOwners();
  const writes = useApplicationWrites(now);

  return (
    <ApplicationsScreen
      now={now}
      initialFilters={initialFilters}
      applications={applications}
      categories={categories}
      owners={owners}
      onEdit={writes.onEdit}
      onDiscard={writes.onDiscard}
      notes={writes.notes}
      renderDocuments={(applicationId) => (
        <ApplicationDocumentsContainer applicationId={applicationId} />
      )}
    />
  );
}
