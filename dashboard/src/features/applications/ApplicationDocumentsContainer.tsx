/**
 * The drawer's Documents section: reads one Application's files and hands the
 * state down to `ApplicationDocuments`. It sits in the drawer's slot, which the
 * screens above it receive as a render function, so the screens never touch
 * the cache (ADR-0006).
 */

import { documentPath } from '@/api/documents';
import { useApplicationDocuments } from '@/queries/documents';

import { ApplicationDocuments } from './ApplicationDocuments';

type ApplicationDocumentsContainerProps = {
  applicationId: string;
};

export function ApplicationDocumentsContainer({
  applicationId,
}: ApplicationDocumentsContainerProps) {
  const query = useApplicationDocuments(applicationId);

  /**
   * A refetch that fails after a list has loaded keeps the list on screen:
   * "failed" is only what a Staff member sees when there is nothing to show.
   */
  const status = query.data ? 'loaded' : query.isError ? 'failed' : 'loading';

  return (
    <ApplicationDocuments
      status={status}
      documents={(query.data ?? []).map((document) => ({
        ...document,
        href: documentPath(applicationId, document.id),
      }))}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
