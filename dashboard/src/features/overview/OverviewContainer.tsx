import { ApplicationDocumentsContainer } from '@/features/applications/ApplicationDocumentsContainer';
import { useApplicationWrites } from '@/features/applications/useApplicationWrites';
import { useApplications, useStateChanges } from '@/queries/applications';
import { useCategories } from '@/queries/categories';
import { useOwners } from '@/queries/staffMembers';

import { OverviewScreen } from './OverviewScreen';

type OverviewContainerProps = {
  staffName: string;
  now: Date;
};

export function OverviewContainer({ staffName, now }: OverviewContainerProps) {
  const applications = useApplications();
  const stateChanges = useStateChanges();
  const categories = useCategories();
  const owners = useOwners();
  const writes = useApplicationWrites(now);

  return (
    <OverviewScreen
      staffName={staffName}
      now={now}
      applications={applications}
      stateChanges={stateChanges}
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
