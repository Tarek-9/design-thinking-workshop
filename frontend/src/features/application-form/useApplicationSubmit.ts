import { useRef, useState } from 'react';
import type { UseFormSetError, UseFormSetValue } from 'react-hook-form';

import { type Category, submitApplication } from './api';
import { formFieldFor } from './errors';
import { asApplicationValues, type FormValues } from './schema';

/** The category list can go stale, so this local check is only a courtesy; the server check decides. */
export function useApplicationSubmit(
  setError: UseFormSetError<FormValues>,
  setValue: UseFormSetValue<FormValues>,
  categoriesById: Map<string, Category>,
  retryCategories: () => void,
) {
  const submissionId = useRef(crypto.randomUUID());
  // Back-to-back clicks must see the flag before the next render, so it is a ref.
  const isSubmittingRef = useRef(false);
  const [confirmed, setConfirmed] = useState<{
    applicationId: string;
    email: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrorCode, setSubmitErrorCode] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    if (isSubmittingRef.current) return;

    const applicationValues = asApplicationValues(values);
    if (!applicationValues) return;

    if (!categoriesById.has(applicationValues.route)) {
      setError('route', { message: 'CATEGORY_UNKNOWN', type: 'validate' });
      return;
    }

    isSubmittingRef.current = true;
    setSubmitErrorCode(null);
    setIsSubmitting(true);
    const result = await submitApplication(
      applicationValues,
      submissionId.current,
    );
    isSubmittingRef.current = false;
    setIsSubmitting(false);

    if (result.status === 'success') {
      setConfirmed({
        applicationId: result.applicationId,
        email: applicationValues.email,
      });
      return;
    }

    if (result.status === 'field-errors') {
      for (const fieldError of result.errors) {
        const formField = formFieldFor(fieldError.field);
        if (!formField) continue;
        setError(formField, { message: fieldError.code, type: 'server' });

        // The picked category was deactivated after load. Only that answer is
        // cleared; the rest of the form stays.
        if (fieldError.code === 'CATEGORY_UNAVAILABLE') {
          setValue('route', '');
          retryCategories();
        }
      }
      return;
    }

    setSubmitErrorCode(result.code);
  }

  return { onSubmit, confirmed, isSubmitting, submitErrorCode };
}
