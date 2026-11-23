import { type TextareaHTMLAttributes } from 'react';

import { cx } from '../../../lib/cx';
import { isAriaInvalid } from '../control';
import controlStyles from '../control.module.css';
import styles from './Textarea.module.css';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...textareaProps }: TextareaProps) {
  const isInvalid = isAriaInvalid(textareaProps['aria-invalid']);
  const classNames = cx(
    controlStyles.control,
    styles.textarea,
    isInvalid ? controlStyles.invalid : null,
    className,
  );

  return <textarea {...textareaProps} className={classNames} />;
}
