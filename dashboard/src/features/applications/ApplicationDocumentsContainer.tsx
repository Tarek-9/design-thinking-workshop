// Lives in the drawer slot so the screens above never touch the query cache.

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

  // A failed refetch keeps a loaded list on screen; "failed" shows only when
  // there is nothing to show.
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
