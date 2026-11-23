import { type InputHTMLAttributes } from 'react';

import { cx } from '../../../lib/cx';
import { isAriaInvalid } from '../control';
import controlStyles from '../control.module.css';
import styles from './Input.module.css';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...inputProps }: InputProps) {
  const isInvalid = isAriaInvalid(inputProps['aria-invalid']);
  const classNames = cx(
    controlStyles.control,
    controlStyles.singleLine,
    styles.input,
    isInvalid ? controlStyles.invalid : null,
    className,
  );

  return <input {...inputProps} className={classNames} />;
}
