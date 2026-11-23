import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import { mockStaffMember } from '@/data/mockApplications';
import { renderApp, renderSignedIn } from '@/test/renderApp';
import type { StubbedApi } from '@/test/stubApi';
import { REFERENCE_DATE, stubApi } from '@/test/stubApi';

import { DRAWER_RESERVE } from './strip';

describe('App', () => {
  let api: StubbedApi;

  beforeEach(() => {
    api = stubApi();
  });

  afterEach(() => {
    window.location.hash = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function calls(method: string, path: string) {
    return vi
      .mocked(fetch)
      .mock.calls.filter(
        ([url, init]) =>
          typeof url === 'string' &&
          url.includes(path) &&
          (init?.method ?? 'GET') === method,
      );
  }

  it('opens the sign-in screen when GET /me finds no Sign-in', async () => {
    api.signedIn = false;

    renderApp();

    expect(
      await screen.findByRole('heading', { name: de.auth.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: de.navigation.label }),
    ).not.toBeInTheDocument();
  });

  it('opens the dashboard when GET /me answers with a Staff member', async () => {
    await renderSignedIn();

    expect(screen.getByText(mockStaffMember.email)).toBeInTheDocument();
    expect(screen.getByText('Mara Weber')).toBeInTheDocument();
  });

  it('signs out from the account menu, back to the sign-in screen', async () => {
    const user = userEvent.setup();

    await renderSignedIn();

    await user.click(screen.getByRole('button', { name: de.account.menu }));
    await user.click(
      screen.getByRole('menuitem', { name: de.account.signOut }),
    );

    // `DELETE /session` clears the cookie, so `GET /me` now answers `401`.
    expect(
      await screen.findByRole('heading', { name: de.auth.title }),
    ).toBeInTheDocument();
    expect(api.signedIn).toBe(false);
  });

  it('opens on the Applications screen', async () => {
    await renderSignedIn();

    expect(
      screen.getByRole('navigation', { name: de.navigation.label }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(de.overview.welcome(mockStaffMember.name)),
    ).not.toBeInTheDocument();
  });

  it('shows the four screens in the sidebar, Anfragen current', async () => {
    await renderSignedIn();

    const sidebar = screen.getByRole('navigation', {
      name: de.navigation.label,
    });

    expect(
      within(sidebar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      de.navigation.overview,
      de.navigation.applications,
      de.navigation.categories,
      // In the footer: the only screen that can erase.
      de.navigation.discarded,
    ]);

    expect(
      within(sidebar).getByRole('link', { name: de.navigation.applications }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('opens the account menu from the profile card', async () => {
    const user = userEvent.setup();

    await renderSignedIn();

    await user.click(screen.getByRole('button', { name: de.account.menu }));

    expect(
      screen.getByRole('menuitem', { name: de.account.signOut }),
    ).toBeInTheDocument();
  });

  it('collapses the desktop sidebar to its icon navigation', async () => {
    const user = userEvent.setup();

    await renderSignedIn();

    await user.click(
      screen.getByRole('button', { name: de.navigation.collapse }),
    );

    const toggle = screen.getByRole('button', { name: de.navigation.expand });

    expect(toggle).toBeInTheDocument();
    expect(toggle.closest('nav')).toBeInTheDocument();
    expect(toggle).toHaveClass('peer/toggle');
    expect(toggle).toHaveClass('lg:left-1/2', '-translate-x-1/2');
    expect(
      screen.getByRole('navigation', { name: de.navigation.label }),
    ).toHaveClass('lg:transition-[width]', 'duration-200');
    expect(
      screen.getByRole('link', { name: de.navigation.applications }),
    ).not.toHaveClass('lg:justify-center');
    expect(
      screen.getByRole('link', { name: de.navigation.applications }).lastChild,
    ).toHaveClass('lg:max-w-0', 'lg:[clip-path:inset(0_100%_0_0)]');
    expect(toggle).not.toHaveClass('bg-primary');
    expect(toggle).toHaveClass('hover:bg-primary_hover');
    expect(toggle.querySelector('svg')).toHaveClass(
      'lg:group-hover:opacity-100',
    );
    const compactWordmarks = Array.from(
      document.querySelectorAll('img[src="/Rectangle.png"]'),
    );
    const sidebarCompactWordmark = compactWordmarks.find((wordmark) =>
      wordmark.classList.contains('lg:opacity-100'),
    );

    expect(sidebarCompactWordmark).toHaveClass('opacity-0', 'lg:opacity-100');
    expect(
      sidebarCompactWordmark?.parentElement?.parentElement,
    ).not.toHaveClass('lg:opacity-0');
    expect(sidebarCompactWordmark?.parentElement?.parentElement).toHaveClass(
      'lg:left-1/2',
      'lg:-translate-x-1/2',
      'lg:peer-hover/toggle:opacity-0',
    );
    expect(screen.getByRole('button', { name: de.account.menu })).toHaveClass(
      'rounded-full',
    );
  });

  it('switches the active sidebar link and shows the welcome headline', async () => {
    const user = userEvent.setup();

    await renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.overview }),
    );

    expect(
      screen.getByRole('link', { name: de.navigation.overview }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByText(de.overview.welcome(mockStaffMember.name)),
    ).toBeInTheDocument();
  });

  it('carries a Category renamed on Kategorien over to Anfragen', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.categories }),
    );

    await user.click(
      screen.getByRole('button', {
        name: de.categories.editOne('Rechtliche Unterstützung'),
      }),
    );

    const field = screen.getByRole('textbox', { name: /^Name/ });
    await user.clear(field);
    await user.type(field, 'Rechtsberatung');
    await user.click(
      screen.getByRole('button', { name: de.categories.dialog.save }),
    );

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    await waitFor(() => {
      expect(screen.getAllByText('Rechtsberatung').length).toBeGreaterThan(0);
    });
  });

  it('discards an Application to the fourth screen and restores it', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(
      screen.getByRole('button', {
        name: de.applications.discardOne('Mara Weber'),
      }),
    );

    expect(screen.queryByText('Mara Weber')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.discarded }),
    );

    expect(screen.getByText('Mara Weber')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: de.discarded.restoreOne('Mara Weber'),
      }),
    );

    expect(screen.getByText(de.discarded.empty)).toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    expect(screen.getByText('Mara Weber')).toBeInTheDocument();
  });

  it('erases a discarded Application, with no way back to Anfragen', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(
      screen.getByRole('button', {
        name: de.applications.discardOne('Mara Weber'),
      }),
    );
    await user.click(
      screen.getByRole('link', { name: de.navigation.discarded }),
    );
    await user.click(
      screen.getByRole('button', {
        name: de.discarded.eraseOne('Mara Weber'),
      }),
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: de.discarded.erase,
      }),
    );

    expect(screen.getByText(de.discarded.empty)).toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    expect(screen.queryByText('Mara Weber')).not.toBeInTheDocument();
  });

  it('shares an edit on an Application between Übersicht and Anfragen', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.overview }),
    );

    // "Jonas Krüger" is one of the five oldest open Applications, unlike
    // "Mara Weber" (arrived today), which the panel's five-row cap excludes.
    const overviewPanel = screen.getByRole('region', {
      name: de.overview.openApplications.title,
    });
    await waitFor(() =>
      expect(
        within(overviewPanel).getByText('Jonas Krüger'),
      ).toBeInTheDocument(),
    );
    await user.click(within(overviewPanel).getByText('Jonas Krüger'));
    await user.selectOptions(screen.getByLabelText('Status'), 'In Prüfung');
    await user.click(screen.getByRole('button', { name: de.detail.close }));

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    await user.click(screen.getByRole('button', { name: de.filters.filter }));

    await user.selectOptions(
      screen.getByLabelText(de.filters.status),
      screen.getByRole('option', { name: de.statuses.IN_REVIEW }),
    );

    await waitFor(() =>
      expect(screen.getByText('Jonas Krüger')).toBeInTheDocument(),
    );
  });

  /** The link carries the Sign-in: a plain navigation, no request from this app. */
  describe('the documents of an Application', () => {
    const LEBENSLAUF = {
      id: 'b7e2c4d0-1a2b-4c3d-8e9f-0a1b2c3d4e5f',
      fileName: 'Lebenslauf.pdf',
      contentType: 'application/pdf',
      sizeBytes: 183402,
      uploadedAt: '2026-09-07T09:12:04Z',
    };

    function maraId(): string {
      const mara = api.applications.find((row) => row.name === 'Mara Weber');
      if (mara === undefined) throw new Error('fixture has no Mara Weber');
      return mara.id;
    }

    it('lists the files of the open Application, each linked to its download', async () => {
      const user = userEvent.setup();
      const id = maraId();
      api.documents = { [id]: [LEBENSLAUF] };
      await renderSignedIn();

      await user.click(screen.getByText('Mara Weber'));

      const link = await screen.findByRole('link', {
        name: 'Lebenslauf.pdf: Herunterladen',
      });
      expect(link).toHaveAttribute(
        'href',
        `/api/v1/staff/applications/${id}/documents/${LEBENSLAUF.id}`,
      );
      expect(calls('GET', `/applications/${id}/documents`)).toHaveLength(1);
    });

    it('says so when the Application carries no files', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(screen.getByText('Mara Weber'));

      expect(await screen.findByText(de.detail.documentsEmpty)).toBeVisible();
    });

    it('offers a retry when the list cannot be read, and shows it once it can', async () => {
      const user = userEvent.setup();
      const id = maraId();
      api.documents = { [id]: [LEBENSLAUF] };
      api.documentsFailure = { status: 500, code: 'INTERNAL_ERROR' };
      await renderSignedIn();

      await user.click(screen.getByText('Mara Weber'));
      expect(await screen.findByText(de.detail.documentsFailed)).toBeVisible();

      api.documentsFailure = null;
      await user.click(
        screen.getByRole('button', { name: de.dashboard.retry }),
      );

      expect(
        await screen.findByRole('link', {
          name: 'Lebenslauf.pdf: Herunterladen',
        }),
      ).toBeVisible();
    });
  });

  describe('the writes', () => {
    it('sends a Status change as a PATCH of that one field', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(screen.getByText('Mara Weber'));
      await user.selectOptions(
        screen.getByLabelText(de.detail.status),
        de.statuses.IN_REVIEW,
      );

      await waitFor(() => {
        expect(calls('PATCH', '/staff/applications/')).toHaveLength(1);
      });
      expect(calls('PATCH', '/staff/applications/')[0]?.[1]?.body).toBe(
        '{"status":"IN_REVIEW"}',
      );
    });

    /** An absent `ownerId` leaves the Owner alone; only an explicit `null` clears it. */
    it('clears an Owner with an explicit null', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      const owned = api.applications.find(
        (application) => application.ownerId !== null,
      );
      expect(owned).toBeDefined();

      await user.click(screen.getByText(owned!.name));
      await user.click(screen.getByRole('button', { name: de.detail.owner }));
      await user.click(
        screen.getByRole('option', { name: de.application.unassigned }),
      );

      await waitFor(() => {
        expect(calls('PATCH', '/staff/applications/')).toHaveLength(1);
      });
      expect(calls('PATCH', '/staff/applications/')[0]?.[1]?.body).toBe(
        '{"ownerId":null}',
      );
    });

    /** A bulk action is N single requests; there is no bulk endpoint. */
    it('discards a checked selection as one request per Application', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      const rows = screen.getAllByRole('checkbox').slice(1, 3);
      for (const row of rows) {
        await user.click(row);
      }
      await user.click(
        screen.getByRole('button', {
          name: de.applications.discardSelected(2),
        }),
      );
      await user.click(
        within(
          screen.getByRole('alertdialog', {
            name: de.applications.confirmDiscardSelected(2),
          }),
        ).getByRole('button', { name: de.applications.discard }),
      );

      await waitFor(() => {
        expect(calls('PATCH', '/staff/applications/')).toHaveLength(2);
      });
      expect(
        calls('PATCH', '/staff/applications/').map(([, init]) => init?.body),
      ).toEqual(['{"discarded":true}', '{"discarded":true}']);
    });

    /** The row comes back; the failure is worded once, above the screens, since a write has no retry panel. */
    it('rolls a failed discard back and words it once', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      api.writeFailure = { status: 500, code: 'INTERNAL_ERROR' };

      await user.click(
        screen.getByRole('button', {
          name: de.applications.discardOne('Mara Weber'),
        }),
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        de.errors.codes.INTERNAL_ERROR,
      );
      await waitFor(() => {
        expect(screen.getByText('Mara Weber')).toBeInTheDocument();
      });
      expect(screen.getAllByRole('alert')).toHaveLength(1);
    });

    it('sends the internal note once typing pauses, and keeps it when it fails', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      api.writeFailure = { status: 500, code: 'INTERNAL_ERROR' };

      await user.click(screen.getByText('Mara Weber'));
      await user.type(
        screen.getByLabelText(de.detail.internalNotes),
        'Rückruf',
      );

      await waitFor(
        () => {
          expect(calls('PATCH', '/staff/applications/')).toHaveLength(1);
        },
        { timeout: 3000 },
      );
      expect(calls('PATCH', '/staff/applications/')[0]?.[1]?.body).toBe(
        '{"internalNotes":"Rückruf"}',
      );
      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );
    });

    it('erases through the permanently path, after the server has', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(
        screen.getByRole('button', {
          name: de.applications.discardOne('Mara Weber'),
        }),
      );
      await user.click(
        screen.getByRole('link', { name: de.navigation.discarded }),
      );
      await user.click(
        screen.getByRole('button', {
          name: de.discarded.eraseOne('Mara Weber'),
        }),
      );
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: de.discarded.erase,
        }),
      );

      await waitFor(() => {
        expect(calls('DELETE', '/permanently')).toHaveLength(1);
      });
      expect(api.applications.some((row) => row.name === 'Mara Weber')).toBe(
        false,
      );
    });

    /** Waits for the server: it mints the id and owns name uniqueness, so the row is refetched. */
    it('creates a Category the server minted the id for', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(
        screen.getByRole('link', { name: de.navigation.categories }),
      );
      await user.click(screen.getByRole('button', { name: de.categories.add }));
      await user.type(
        screen.getByRole('textbox', { name: /^Name/ }),
        'Fundraising',
      );
      await user.click(
        screen.getByRole('button', { name: de.categories.dialog.create }),
      );

      await waitFor(() => {
        expect(calls('POST', '/staff/categories')).toHaveLength(1);
      });
      expect(await screen.findByText('Fundraising')).toBeInTheDocument();
      expect(
        api.categories.find((category) => category.name === 'Fundraising')?.id,
      ).toBeDefined();
    });

    /** The endpoint takes the whole order as ids, so every move sends all of them. */
    it('sends the whole order when a Category moves', async () => {
      const user = userEvent.setup();
      await renderSignedIn();
      const [first, second] = api.categories;
      expect(second).toBeDefined();

      await user.click(
        screen.getByRole('link', { name: de.navigation.categories }),
      );
      await user.click(
        screen.getByRole('button', {
          name: de.categories.moveUpOne(second!.name),
        }),
      );

      await waitFor(() => {
        expect(calls('PUT', '/staff/categories/order')).toHaveLength(1);
      });
      expect(calls('PUT', '/staff/categories/order')[0]?.[1]?.body).toContain(
        `["${second!.id}","${first!.id}"`,
      );
    });
  });

  /** The cover sits over the dashboard, so nothing may unmount: the drawer, filters and typed note survive the sign-in. */
  describe('an expired Sign-in', () => {
    /** The required marker is part of the label under jsdom, so match loosely. */
    function coverField(label: string): HTMLElement {
      return screen.getByLabelText(label, {
        exact: false,
        selector: 'input',
      });
    }

    async function typeANoteAndLetTheSignInExpire(
      user: ReturnType<typeof userEvent.setup>,
    ): Promise<void> {
      await user.click(screen.getByText('Mara Weber'));
      await user.type(
        screen.getByLabelText(de.detail.internalNotes),
        'Rückruf',
      );

      api.signedIn = false;

      await waitFor(
        () => {
          expect(calls('PATCH', '/staff/applications/')).toHaveLength(1);
        },
        { timeout: 3000 },
      );
    }

    it('covers the dashboard and keeps the work when a write answers 401', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndLetTheSignInExpire(user);

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();

      const shell = screen.getByRole('navigation', {
        name: de.navigation.label,
      });
      expect(shell).toBeInTheDocument();
      expect(shell.closest('[inert]')).not.toBeNull();
      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );

      /** The cover is the sentence; the write notice does not repeat it. */
      expect(screen.queryByText(de.errors.general)).not.toBeInTheDocument();
      expect(
        screen.queryByText(de.dashboard.loadFailed),
      ).not.toBeInTheDocument();
    });

    it('drops the cover and leaves the Staff member where they were', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndLetTheSignInExpire(user);
      await screen.findByRole('heading', { name: de.auth.expiredTitle });

      expect(coverField(de.auth.emailLabel)).toHaveValue(mockStaffMember.email);
      await user.type(coverField(de.auth.passwordLabel), 'geheim');
      await user.click(screen.getByRole('button', { name: de.auth.submit }));

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: de.auth.expiredTitle }),
        ).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );
      expect(
        screen.getByRole('navigation', { name: de.navigation.label }),
      ).not.toHaveAttribute('inert');
    });

    /** The cache holds Applicants' personal data and an unsent note, so another person starts clean. */
    it('drops the work when somebody else signs in at the cover', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndLetTheSignInExpire(user);
      await screen.findByRole('heading', { name: de.auth.expiredTitle });

      api.staffMember = {
        id: 'staff-other',
        name: 'Rosalie Bergmann',
        email: 'rosalie.bergmann@ichbinhier.online',
      };

      await user.clear(coverField(de.auth.emailLabel));
      await user.type(coverField(de.auth.emailLabel), api.staffMember.email);
      await user.type(coverField(de.auth.passwordLabel), 'geheim');
      await user.click(screen.getByRole('button', { name: de.auth.submit }));

      expect(
        await screen.findByText(api.staffMember.email),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(de.detail.internalNotes),
      ).not.toBeInTheDocument();
    });

    /** An `EventSource` reports only `error`: repeated failures ask `GET /me`, and only a 401 there puts the cover up. */
    it('asks whether the Sign-in is still there after repeated stream failures', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;

      api.signedIn = false;

      act(() => {
        api.stream()?.fireError();
        api.stream()?.fireError();
        api.stream()?.fireError();
      });

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();
      expect(calls('GET', '/me')).toHaveLength(asked + 1);
      expect(api.stream()?.closed).toBe(true);
    });

    /** A response (nginx's 502, or the 401) closes the source for good, so the question is asked at once. */
    it('asks at once when a response closed the stream for good', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;

      api.signedIn = false;

      act(() => {
        api.stream()?.fireErrorAndClose();
      });

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();
      expect(calls('GET', '/me')).toHaveLength(asked + 1);
    });

    it('keeps checking a closed stream until it can identify an expired Sign-in', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;

      /** nginx can answer before the restarted backend can answer `GET /me`. */
      api.signInCheckFailure = { status: 502, code: 'UPSTREAM_UNAVAILABLE' };

      act(() => {
        api.stream()?.fireErrorAndClose();
      });

      await waitFor(() => {
        expect(calls('GET', '/me')).toHaveLength(asked + 1);
      });
      expect(
        screen.queryByRole('heading', { name: de.auth.expiredTitle }),
      ).not.toBeInTheDocument();

      api.signInCheckFailure = null;
      api.signedIn = false;

      expect(calls('GET', '/me')).toHaveLength(asked + 1);
      expect(
        await screen.findByRole(
          'heading',
          { name: de.auth.expiredTitle },
          { timeout: 6_000 },
        ),
      ).toBeInTheDocument();
      expect(calls('GET', '/me')).toHaveLength(asked + 2);
    }, 8_000);

    it('reopens the stream when the later Sign-in check succeeds', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;
      const dropped = api.stream();

      api.signInCheckFailure = { status: 502, code: 'UPSTREAM_UNAVAILABLE' };

      act(() => {
        dropped?.fireErrorAndClose();
      });

      await waitFor(() => {
        expect(calls('GET', '/me')).toHaveLength(asked + 1);
      });

      api.signInCheckFailure = null;

      await waitFor(
        () => {
          expect(api.stream()).not.toBe(dropped);
        },
        { timeout: 6_000 },
      );

      expect(calls('GET', '/me')).toHaveLength(asked + 2);
      expect(
        screen.queryByRole('heading', { name: de.auth.expiredTitle }),
      ).not.toBeInTheDocument();
    }, 8_000);

    /** A closed `EventSource` stays closed, so the hook reopens it: one 502 during a restart would otherwise leave a stale list all day. */
    it('opens a fresh stream after the browser has closed one', async () => {
      await renderSignedIn();
      const dropped = api.stream();
      expect(dropped).not.toBeNull();

      vi.useFakeTimers();

      try {
        await act(async () => {
          dropped?.fireErrorAndClose();
          await Promise.resolve();
        });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(5_000);
        });

        expect(api.stream()).not.toBe(dropped);
        expect(
          screen.queryByRole('heading', { name: de.auth.expiredTitle }),
        ).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('leaves the dashboard alone while the Sign-in holds, and asks again', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;

      act(() => {
        api.stream()?.fireError();
        api.stream()?.fireError();
        api.stream()?.fireError();
      });

      await waitFor(() => {
        expect(calls('GET', '/me')).toHaveLength(asked + 1);
      });

      expect(
        screen.queryByRole('heading', { name: de.auth.expiredTitle }),
      ).not.toBeInTheDocument();

      /** Keeps asking while failures continue: the first question can land while the backend is still down. */
      api.signedIn = false;

      act(() => {
        api.stream()?.fireError();
        api.stream()?.fireError();
        api.stream()?.fireError();
      });

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();
      expect(calls('GET', '/me')).toHaveLength(asked + 2);
    });
  });

  /** A read that fails after the list arrived is shown as a notice, so the drawer and typed note stay mounted. */
  describe('a refetch that failed', () => {
    async function typeANoteAndRestartTheBackend(
      user: ReturnType<typeof userEvent.setup>,
    ): Promise<void> {
      await user.click(screen.getByText('Mara Weber'));
      await user.type(
        screen.getByLabelText(de.detail.internalNotes),
        'Rückruf',
      );

      api.readFailure = { status: 502, code: 'BAD_GATEWAY' };

      /** Every `open` refetches, which is where the restart is noticed. */
      act(() => {
        api.stream()?.fireOpen();
      });
    }

    it('words the stale list once and leaves the work standing', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndRestartTheBackend(user);

      expect(
        await screen.findByText(de.dashboard.updateFailed),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );
      expect(screen.getAllByText('Mara Weber')).toHaveLength(2);

      /** The panel's wording belongs to a dashboard with nothing to show. */
      expect(
        screen.queryByText(de.dashboard.loadFailed),
      ).not.toBeInTheDocument();
    });

    /** The retry the panel has, over exactly the queries that failed. */
    it('asks again from the notice', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndRestartTheBackend(user);
      await screen.findByText(de.dashboard.updateFailed);

      api.readFailure = null;
      const asked = calls('GET', '/staff/applications').length;

      await user.click(
        screen.getByRole('button', { name: de.dashboard.retry }),
      );

      await waitFor(() => {
        expect(
          screen.queryByText(de.dashboard.updateFailed),
        ).not.toBeInTheDocument();
      });
      expect(calls('GET', '/staff/applications').length).toBeGreaterThan(asked);
    });

    /** The 502 is one sentence; the 401 that follows covers the work, which stays mounted. */
    it('lets the 401 behind it cover the same work', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndRestartTheBackend(user);
      await screen.findByText(de.dashboard.updateFailed);

      /** The backend is back, but the Sign-in did not survive the restart. */
      api.readFailure = null;
      api.signedIn = false;

      act(() => {
        api.stream()?.fireErrorAndClose();
      });

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );
      expect(
        screen.queryByText(de.dashboard.loadFailed),
      ).not.toBeInTheDocument();
    });
  });

  /** jsdom has no layout, so these check the strip's classes only. */
  describe('the strip under an open drawer', () => {
    it("leaves the notice's retry clear of the drawer", async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(screen.getByText('Mara Weber'));
      api.readFailure = { status: 502, code: 'BAD_GATEWAY' };
      act(() => {
        api.stream()?.fireOpen();
      });

      const sentence = await screen.findByText(de.dashboard.updateFailed);
      /** The drawer really is over the strip while that is read. */
      expect(
        screen.getByLabelText(de.detail.internalNotes),
      ).toBeInTheDocument();

      const retry = screen.getByRole('button', { name: de.dashboard.retry });
      const dismiss = screen.getByRole('button', {
        name: de.dashboard.dismissFailure,
      });

      /* A row of its own, so the buttons do not move with the sentence's length. */
      const actions = retry.parentElement;
      expect(actions).toBe(dismiss.parentElement);
      expect(actions).not.toContainElement(sentence);
      expect(sentence.nextElementSibling).toBe(actions);
      expect(actions).not.toHaveClass('justify-end');
      expect(actions).not.toHaveClass('ml-auto');

      /* At 1024px the buttons stack: 189px is left where 322px are needed. */
      expect(actions).toHaveClass('flex-wrap');

      /* Contents keep out of the drawer's column; the border spans main. */
      const contents = actions?.parentElement;
      expect(contents).toHaveClass('flex-col');
      expect(contents).toHaveClass('items-start');
      expect(contents?.className).toContain(DRAWER_RESERVE);
      expect(contents?.parentElement?.className).not.toContain(DRAWER_RESERVE);
      expect(contents?.parentElement).toHaveClass('border');

      /** No icon in the button: its label is what gets read out. */
      expect(dismiss).toHaveTextContent(de.dashboard.dismissFailure);
      expect(dismiss.querySelector('svg')).toBeNull();
    });

    /** The hint must be readable too: the marker exists for "Nicht verbunden". */
    it('reads the disconnected wording clear of the drawer', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(screen.getByText('Mara Weber'));

      const marker = screen
        .getByText(de.dashboard.disconnected)
        .closest('[role="status"]');

      expect(
        screen.getByLabelText(de.detail.internalNotes),
      ).toBeInTheDocument();
      expect(marker).not.toBeNull();
      expect(marker).not.toHaveClass('justify-end');
      /** The hint says what to do, so it wraps. */
      expect(marker).toHaveClass('flex-wrap');
      expect(marker?.className).toContain(DRAWER_RESERVE);
    });
  });

  /** Events apply without a request; every open refetches, since the server keeps no replay buffer. */
  describe('the live stream', () => {
    function submitted(name: string) {
      const at = REFERENCE_DATE.toISOString();

      return {
        id: 'application-live',
        categoryId: 'social-media',
        name,
        email: 'live@example.org',
        weeklyTime: 'HOURS_1_2' as const,
        about: null,
        status: 'NEW' as const,
        ownerId: null,
        internalNotes: '',
        discardedAt: null,
        consentAt: at,
        consentTextVersion: '2026-09',
        submittedAt: at,
      };
    }

    it('shows an Application submitted while the dashboard is open', async () => {
      await renderSignedIn();

      expect(screen.queryByText('Ida Lindqvist')).not.toBeInTheDocument();

      const requests = vi.mocked(fetch).mock.calls.length;
      act(() => {
        api.stream()?.emit('application.created', submitted('Ida Lindqvist'));
      });

      expect(await screen.findByText('Ida Lindqvist')).toBeInTheDocument();
      // Applied from the event itself: the row cost no request.
      expect(vi.mocked(fetch).mock.calls).toHaveLength(requests);
    });

    it('drops an erased Application on application.deleted', async () => {
      await renderSignedIn();

      const [first] = api.applications;
      expect(first).toBeDefined();

      act(() => {
        api.stream()?.emit('application.deleted', first!);
      });

      await waitFor(() => {
        expect(screen.queryByText(first!.name)).not.toBeInTheDocument();
      });
    });

    it('refetches the list on every open, including a reconnect', async () => {
      await renderSignedIn();

      api.applications = [submitted('Ida Lindqvist'), ...api.applications];

      act(() => {
        api.stream()?.fireOpen();
      });

      expect(await screen.findByText('Ida Lindqvist')).toBeInTheDocument();
    });

    it('says whether the dashboard is live', async () => {
      await renderSignedIn();

      expect(screen.getByText(de.dashboard.disconnected)).toBeInTheDocument();

      act(() => {
        api.stream()?.fireOpen();
      });

      expect(await screen.findByText(de.dashboard.live)).toBeInTheDocument();
    });
  });
});
