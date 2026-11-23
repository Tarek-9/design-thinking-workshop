/** Shared by all four screens, so their headers cannot drift apart. */

import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  const heading = (
    <>
      <p className="text-text-tertiary text-[11px] font-semibold tracking-[0.06em] uppercase">
        {eyebrow}
      </p>
      <h1 className="text-text-primary text-page-title tracking-heading mt-2 font-semibold">
        {title}
      </h1>
      <p className="text-text-tertiary mt-2 max-w-[700px] text-sm leading-relaxed sm:text-base">
        {subtitle}
      </p>
    </>
  );

  if (action === undefined) {
    return <header>{heading}</header>;
  }

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">{heading}</div>
      {action}
    </header>
  );
}
