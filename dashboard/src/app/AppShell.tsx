/** Owns the live stream, so screen switches do not reconnect; inert while the Sign-in is expired. */

import { Archive, BarChartSquare02, Inbox01, Tag01 } from '@untitledui/icons';
import type { ReactNode } from 'react';

import type { NavItemType } from '@/components/application/app-navigation/config';
import {
  SIDEBAR_GUTTER,
  SidebarNavigationSimple,
} from '@/components/application/app-navigation/sidebar-navigation/sidebar-simple';
import { de } from '@/content/de';
import type { StaffMember } from '@/domain/staffMember';
import { useApplicationStream } from '@/queries/useApplicationStream';

import { RequestFailureNotice } from './RequestFailures';
import { StreamMarker } from './StreamMarker';

export type Screen = 'overview' | 'applications' | 'categories' | 'discarded';

const navItems: (NavItemType & { id: Screen })[] = [
  {
    id: 'overview',
    label: de.navigation.overview,
    href: '#overview',
    icon: BarChartSquare02,
  },
  {
    id: 'applications',
    label: de.navigation.applications,
    href: '#applications',
    icon: Inbox01,
  },
  {
    id: 'categories',
    label: de.navigation.categories,
    href: '#categories',
    icon: Tag01,
  },
];

const footerNavItems: (NavItemType & { id: Screen })[] = [
  {
    id: 'discarded',
    label: de.navigation.discarded,
    href: '#discarded',
    icon: Archive,
  },
];

type AppShellProps = {
  current: Screen;
  account: StaffMember;
  onSignOut: () => void;
  signInExpired?: boolean;
  children: ReactNode;
};

export function AppShell({
  current,
  account,
  onSignOut,
  signInExpired = false,
  children,
}: AppShellProps) {
  const { connected } = useApplicationStream({ enabled: !signInExpired });

  return (
    <div
      inert={signInExpired}
      className="bg-primary text-primary flex min-h-screen flex-col lg:flex-row"
    >
      <SidebarNavigationSimple
        activeUrl={`#${current}`}
        items={navItems}
        footerItems={footerNavItems}
        account={account}
        onSignOut={onSignOut}
      />

      {/* The sidebar is fixed at SIDEBAR_GUTTER, so the padding must match it exactly. */}
      <main
        // eslint-disable-next-line no-restricted-syntax -- SIDEBAR_GUTTER is a JS value shared with the sidebar's position, so a class would duplicate it
        style={{ paddingInline: SIDEBAR_GUTTER }}
        className="bg-bg-canvas flex min-w-0 flex-1 flex-col gap-3 py-6"
      >
        {/* Keeps out of the right end: the drawer has no scrim and lies over it. */}
        <StreamMarker connected={connected} />
        <RequestFailureNotice />
        {children}
      </main>
    </div>
  );
}
