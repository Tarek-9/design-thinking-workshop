import type { ReactNode } from 'react';

import styles from './FormCard.module.css';

interface FormCardProps {
  children: ReactNode;
}

export function FormCard({ children }: FormCardProps) {
  return <div className={styles.card}>{children}</div>;
}
