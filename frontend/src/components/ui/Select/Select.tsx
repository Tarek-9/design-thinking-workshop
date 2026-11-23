import { type ReactNode, type SelectHTMLAttributes } from 'react';

import { cx } from '../../../lib/cx';
import { isAriaInvalid } from '../control';
import controlStyles from '../control.module.css';
import styles from './Select.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function Select({ children, className, ...selectProps }: SelectProps) {
  const isInvalid = isAriaInvalid(selectProps['aria-invalid']);
  const classNames = cx(
    controlStyles.control,
    controlStyles.singleLine,
    styles.select,
    isInvalid ? controlStyles.invalid : null,
    className,
  );

  return (
    <div className={styles.container}>
      <select {...selectProps} className={classNames}>
        {children}
      </select>
      <span aria-hidden="true" className={styles.indicator}>
        ▾
      </span>
    </div>
  );
}
