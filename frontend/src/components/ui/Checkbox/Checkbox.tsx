import { type InputHTMLAttributes, type ReactNode, useId } from 'react';

import { cx } from '../../../lib/cx';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'children' | 'type'
> {
  children: ReactNode;
}

/** The label arrives as children, so no applicant copy lives in this component. */
export function Checkbox({
  children,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  ...inputProps
}: CheckboxProps) {
  const generatedId = useId();
  const labelId = useId();
  const inputId = id ?? generatedId;
  const labelledBy = cx(ariaLabelledBy, labelId);
  const classNames = cx(styles.checkbox, className);

  return (
    <div className={styles.container}>
      <input
        {...inputProps}
        aria-labelledby={labelledBy}
        className={classNames}
        id={inputId}
        type="checkbox"
      />
      <span className={styles.label} id={labelId}>
        {children}
      </span>
    </div>
  );
}
