import { type ChangeEvent, type SubmitEvent, useRef, useState } from 'react';

import { Button } from '../../components/ui/Button/Button';
import { Field } from '../../components/ui/Field/Field';
import { FormCard } from '../../components/ui/FormCard/FormCard';
import type { Content } from '../../content/types';
import { uploadDocuments } from './api';
import styles from './ApplicationForm.module.css';
import { toErrorText } from './fieldProps';

/** The picker only narrows the choice: the backend checks the bytes and has the last word. */
const ACCEPTED_KINDS = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

interface DocumentUploadProps {
  applicationId: string;
  content: Content;
  onDone: () => void;
}

/** The application already exists, so a failed upload loses nothing the applicant entered. */
export function DocumentUpload({
  applicationId,
  content,
  onDone,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isUploadingRef = useRef(false);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setFieldError(undefined);
    setUploadFailed(false);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploadingRef.current || files.length === 0) return;
    void upload();
  }

  async function upload() {
    isUploadingRef.current = true;
    setIsUploading(true);
    setFieldError(undefined);
    setUploadFailed(false);

    const result = await uploadDocuments(applicationId, files);

    isUploadingRef.current = false;
    setIsUploading(false);

    if (result.status === 'success') {
      onDone();
      return;
    }

    const refusal =
      result.status === 'field-errors'
        ? result.errors.find((entry) => entry.field === 'files')
        : undefined;
    if (refusal) {
      setFieldError(toErrorText(refusal.code, content));
      return;
    }

    setUploadFailed(true);
  }

  return (
    <FormCard>
      <h1 className={styles.title}>{content.documents.title}</h1>
      <p className={styles.subtitle}>{content.documents.subtitle}</p>
      <hr className={styles.divider} />
      <form noValidate onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <Field
            error={fieldError}
            hint={content.documents.hint}
            label={content.documents.label}
          >
            {(aria) => (
              <input
                accept={ACCEPTED_KINDS}
                className={styles.fileInput}
                disabled={isUploading}
                multiple
                onChange={handleFilesChange}
                type="file"
                {...aria}
              />
            )}
          </Field>

          <div className={styles.uploadActions}>
            <Button
              disabled={files.length === 0}
              isLoading={isUploading}
              loadingLabel={content.documents.loadingLabel}
              type="submit"
              width="full"
            >
              {content.documents.submit}
            </Button>
            <Button
              disabled={isUploading}
              onClick={onDone}
              type="button"
              variant="secondary"
              width="full"
            >
              {content.documents.skip}
            </Button>
          </div>

          {uploadFailed ? (
            <p className={styles.error} role="alert">
              {content.documents.uploadFailed}
            </p>
          ) : null}
        </div>
      </form>
    </FormCard>
  );
}
