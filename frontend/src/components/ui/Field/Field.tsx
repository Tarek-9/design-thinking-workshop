import { type ReactNode, useId } from 'react';

import styles from './Field.module.css';

/** Spread onto the control: it is what makes the label, hint and error announced. */
export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | undefined;
  'aria-required': boolean | undefined;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (control: FieldControlProps) => ReactNode;
}

/** Takes finished strings only, so the same field can serve the staff dashboard too. */
export function Field({
  label,
  hint,
  error,
  required = false,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null]
      .filter((value): value is string => value !== null)
      .join(' ') || undefined;

  return (
    <div className={styles.group}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>

      <div className={styles.control}>
        {children({
          id,
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
          'aria-required': required ? true : undefined,
        })}
      </div>

      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      {/* The error text says what to do: colour alone is not enough. */}
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
