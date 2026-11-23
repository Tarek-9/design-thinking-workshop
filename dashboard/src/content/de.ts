/** Every German string a Staff member reads, so the wording stays in one place. */

import type { FieldErrorCode, TopLevelErrorCode } from '@/domain/apiError';
import type {
  ApplicationStatus,
  ApplicationView,
  WeeklyTime,
} from '@/domain/application';
import {
  INTERNAL_NOTES_MAX_LENGTH,
  STALE_AFTER_DAYS,
} from '@/domain/application';
import {
  CATEGORY_DESCRIPTION_MAX_LENGTH,
  CATEGORY_NAME_MAX_LENGTH,
} from '@/domain/category';

export const de = {
  association: 'ichbinhier',

  /** No polling fallback: a silently stale list would look live. */
  dashboard: {
    loading: 'Anfragen werden geladen …',
    loadFailed: 'Die Anfragen konnten nicht geladen werden.',
    /** A list is still on screen here, so this one says "updating". */
    updateFailed:
      'Die Anfragen konnten nicht aktualisiert werden. Die Liste kann veraltet sein.',
    retry: 'Erneut versuchen',
    /** Visible text: a screen reader needs the label. */
    dismissFailure: 'Meldung ausblenden',
    live: 'Live',
    disconnected: 'Nicht verbunden',
    disconnectedHint: 'Die Liste kann veraltet sein. Bitte lade die Seite neu.',
  },

  overview: {
    welcome: (name: string) => `Willkommen, ${name}!`,
    subtitle:
      'Hier siehst du alle Anfragen zur Vereinsarbeit und sonstigen Anfragen auf einen Blick.',
    stats: {
      new: {
        title: 'Neue Anfragen',
        hint: 'Noch nicht bearbeitet',
      },
      unassigned: {
        title: 'Ohne Zuständigkeit',
        hint: 'Warten auf eine zuständige Person',
      },
      stale: {
        title: 'Lange offen',
        hint: (days: number) => `Länger als ${String(days)} Tage offen`,
      },
    },
    openApplications: {
      title: 'Offene Anfragen',
      searchPlaceholder: 'Name oder E-Mail suchen',
      ownerLabel: 'Zuständigkeit',
      allCategories: 'Alle Kategorien',
      allOwners: 'Alle Zuständigen',
      /** Worded from "offen": a Declined or Active Application is not open. */
      empty: 'Keine offenen Anfragen.',
      emptyHint:
        'Neue Anfragen aus dem Formular erscheinen hier, die neuesten zuerst.',
      noMatches: 'Keine passenden Anfragen.',
      noMatchesHint: 'Suche oder Filter zurücksetzen, um alle zu sehen.',
      count: (shown: number, total: number) =>
        `${String(shown)} von ${String(total)} offenen Anfragen`,
      viewAll: 'Alle offenen Anfragen ansehen',
    },
  },

  navigation: {
    label: 'Hauptnavigation',
    overview: 'Übersicht',
    applications: 'Anfragen',
    categories: 'Kategorien',
    discarded: 'Aussortiert',
    collapse: 'Navigation einklappen',
    expand: 'Navigation ausklappen',
    openMenu: 'Navigationsmenü öffnen',
    closeMenu: 'Navigationsmenü schließen',
  },

  account: {
    menu: 'Kontomenü',
    viewProfile: 'Profil ansehen',
    settings: 'Einstellungen',
    signOut: 'Abmelden',
  },

  auth: {
    title: 'Anmelden',
    subtitle: 'Melde dich an, um die Anfragen aus dem Formular zu sehen.',
    emailLabel: 'E-Mail',
    emailPlaceholder: 'name@ichbinhier.online',
    passwordLabel: 'Passwort',
    submit: 'Anmelden',

    /** Boot question: the Sign-in cookie is HttpOnly, so only GET /me can answer it. */
    checking: 'Anmeldung wird geprüft …',

    /** Says why the form is back, so "Anmelden" does not read as a fault. */
    expiredTitle: 'Anmeldung abgelaufen',
    expiredSubtitle:
      'Melde dich erneut an, um weiterzuarbeiten. Deine Eingaben bleiben erhalten.',

    /** Only these sit under a field: a rejected Sign-in names neither field. */
    emailRequired: 'Bitte gib deine E-Mail-Adresse ein.',
    emailInvalid: 'Diese E-Mail-Adresse ist unvollständig.',
    passwordRequired: 'Bitte gib dein Passwort ein.',

    /** Shown as text: there is no reset flow behind a link yet. */
    passwordResetHint:
      'Konten legt der Vorstand an, und er setzt auch Passwörter zurück.',
  },

  fields: {
    togglePassword: 'Passwort anzeigen oder verbergen',
    /** One wording for both capped fields, so the two countdowns cannot drift apart. */
    remaining: (count: number) => `Noch ${String(count)} Zeichen`,
  },

  /** Same wording in every dialog, so the way out is always recognisable. */
  confirm: {
    cancel: 'Abbrechen',
  },

  /** Unknown codes fall back to general, so a screen is never left wordless. */
  errors: {
    general: 'Das hat nicht geklappt. Bitte versuche es noch einmal.',

    codes: {
      VALIDATION_FAILED: 'Bitte prüfe die markierten Felder.',
      NOT_DISCARDED:
        'Diese Anfrage ist nicht aussortiert. Die Liste wurde neu geladen.',
      /** Same for a wrong password and an unknown address: the Sign-in must not say which. */
      INVALID_CREDENTIALS: 'E-Mail-Adresse oder Passwort stimmt nicht.',
      UNAUTHENTICATED:
        'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.',
      NOT_FOUND:
        'Diesen Eintrag gibt es nicht mehr. Die Liste wurde neu geladen.',
      CATEGORY_IN_USE:
        'Diese Kategorie wird noch von Anfragen genutzt. Deaktiviere sie stattdessen.',
      RATE_LIMITED:
        'Zu viele Versuche. Bitte warte einen Moment und versuche es dann erneut.',
      INTERNAL_ERROR:
        'Beim Server ist etwas schiefgegangen. Bitte versuche es noch einmal.',
    } satisfies Record<TopLevelErrorCode, string>,

    /** The limits are the constants the inputs count down from. */
    fields: {
      STATUS_UNKNOWN: 'Diesen Status gibt es nicht.',
      OWNER_UNKNOWN: 'Diese zuständige Person gibt es nicht mehr.',
      NOTES_TOO_LONG: `Die Notiz ist zu lang. Höchstens ${String(INTERNAL_NOTES_MAX_LENGTH)} Zeichen.`,
      CATEGORY_NAME_REQUIRED: 'Bitte einen Namen angeben.',
      CATEGORY_NAME_TOO_LONG: `Der Name ist zu lang. Höchstens ${String(CATEGORY_NAME_MAX_LENGTH)} Zeichen.`,
      CATEGORY_NAME_TAKEN: 'Es gibt bereits eine Kategorie mit diesem Namen.',
      CATEGORY_DESCRIPTION_TOO_LONG: `Die Beschreibung ist zu lang. Höchstens ${String(CATEGORY_DESCRIPTION_MAX_LENGTH)} Zeichen.`,
      ORDER_INCOMPLETE:
        'Die Reihenfolge ließ sich nicht speichern. Die Liste wurde neu geladen.',
      IMMUTABLE_FIELD: 'Dieses Feld lässt sich nicht ändern.',
    } satisfies Record<FieldErrorCode, string>,
  },

  applications: {
    eyebrow: 'Engagement',
    title: 'Anfragen',
    subtitle: 'Anfragen aus dem Formular, nach Eingang sortiert.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} Anfragen`,
    /** The button only moves the row; the name tells the rows apart. */
    discardOne: (name: string) => `Anfrage von ${name} aussortieren`,
    discard: 'Aussortieren',
    discardSelected: (count: number) =>
      count === 0 ? 'Aussortieren' : `Aussortieren (${String(count)})`,
    /** Only the bulk action asks: a single row is undone on the fourth screen. */
    confirmDiscardSelected: (count: number) =>
      count === 1
        ? '1 markierte Anfrage aussortieren?'
        : `${String(count)} markierte Anfragen aussortieren?`,
    confirmDiscardSelectedHint: (count: number) =>
      count === 1
        ? 'Die Anfrage wandert mit Status, Zuständigkeit und Kategorie nach „Aussortiert“ und lässt sich von dort wiederherstellen.'
        : 'Die Anfragen wandern mit Status, Zuständigkeit und Kategorie nach „Aussortiert“ und lassen sich von dort wiederherstellen.',

    /** The backend starts empty, so this shows until the first submission. */
    empty: 'Noch keine Anfrage eingegangen.',
    emptyHint:
      'Sobald jemand das Formular abschickt, erscheint die Anfrage hier, ohne Neuladen.',
    noMatches: 'Keine Anfrage in dieser Ansicht.',
    noMatchesHint:
      'Andere Ansicht wählen oder Suche und Filter zurücksetzen. Aussortierte Anfragen liegen unter „Aussortiert“.',
  },

  discarded: {
    eyebrow: 'Ablage',
    title: 'Aussortierte Anfragen',
    subtitle:
      'Anfragen, die aus der Arbeitsliste aussortiert wurden. Sie bleiben mit Status, Zuständigkeit und Kategorie auf Ablage, bis sie wiederhergestellt oder endgültig gelöscht werden.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} aussortierten Anfragen`,

    restore: 'Wiederherstellen',
    restoreOne: (name: string) => `Anfrage von ${name} wiederherstellen`,
    restoreSelected: (count: number) =>
      count === 0 ? 'Wiederherstellen' : `Wiederherstellen (${String(count)})`,

    erase: 'Endgültig löschen',
    eraseOne: (name: string) => `Anfrage von ${name} endgültig löschen`,
    eraseSelected: (count: number) =>
      count === 0
        ? 'Endgültig löschen'
        : `Endgültig löschen (${String(count)})`,
    /** Both questions share one consequence line: erasing has no undo. */
    confirmEraseOne: (name: string) => `Anfrage von ${name} endgültig löschen?`,
    confirmEraseSelected: (count: number) =>
      count === 1
        ? '1 markierte Anfrage endgültig löschen?'
        : `${String(count)} markierte Anfragen endgültig löschen?`,
    eraseWarning:
      'Das Geschriebene wird gelöscht, mit Status, Zuständigkeit und Notizen. Das lässt sich nicht rückgängig machen.',

    empty: 'Nichts aussortiert.',
    emptyHint:
      'Hier liegen die Anfragen, die in „Anfragen“ aussortiert wurden.',
    noMatches: 'Keine aussortierte Anfrage entspricht dieser Suche.',
    noMatchesHint:
      'Suche zurücksetzen, um alle aussortierten Anfragen zu sehen.',
  },

  categories: {
    eyebrow: 'Formular',
    title: 'Kategorien',
    subtitle:
      'Die Auswahl, die Interessierte im Formular sehen. Eine Änderung hier wirkt sofort auf das Formular.',
    count: (shown: number, total: number) =>
      `${String(shown)} von ${String(total)} Kategorien`,

    summary: {
      total: 'Kategorien insgesamt',
      totalHint: 'Angelegt, aktiv oder nicht',
      active: 'Im Formular wählbar',
      activeHint: 'Aktive Kategorien',
      unused: 'Ohne Anfragen',
      unusedHint: 'Bisher nie ausgewählt',
    },

    views: {
      all: 'Alle',
      active: 'Aktiv',
      inactive: 'Inaktiv',
    },

    columns: {
      order: 'Reihenfolge',
      name: 'Kategorie',
      status: 'Im Formular',
      usage: 'Anfragen',
      actions: 'Aktionen',
    },

    tableTitle: 'Reihenfolge im Formular',
    tableDescription:
      'Interessierte sehen die aktiven Kategorien in genau dieser Reihenfolge.',

    add: 'Kategorie hinzufügen',
    edit: 'Bearbeiten',
    editOne: (name: string) => `${name} bearbeiten`,
    delete: 'Löschen',
    deleteOne: (name: string) => `${name} löschen`,
    confirmDelete: (name: string) => `Kategorie „${name}“ wirklich löschen?`,
    /** Only offered when no Application names the Category. */
    confirmDeleteHint:
      'Die Kategorie verschwindet aus dem Formular. Das lässt sich nicht rückgängig machen. Sie müsste neu angelegt werden.',

    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    moveUpOne: (name: string) => `${name} nach oben schieben`,
    moveDownOne: (name: string) => `${name} nach unten schieben`,
    /** Reordering needs the whole list; search and the tabs hide part of it. */
    moveBlocked: 'Reihenfolge nur in der Ansicht „Alle“ ohne Suche änderbar',

    active: 'Aktiv',
    inactive: 'Inaktiv',
    toggleOne: (name: string) => `${name} im Formular anzeigen`,

    noDescription: 'Keine Beschreibung',
    usageCount: (count: number) =>
      count === 1 ? '1 Anfrage' : `${String(count)} Anfragen`,
    /** A Category in use is deactivated, never deleted. */
    deleteBlocked: (count: number) =>
      count === 1
        ? 'Nicht löschbar: 1 Anfrage nutzt diese Kategorie. Stattdessen deaktivieren.'
        : `Nicht löschbar: ${String(count)} Anfragen nutzen diese Kategorie. Stattdessen deaktivieren.`,

    empty: 'Noch keine Kategorie angelegt.',
    emptyHint:
      'Lege die erste Kategorie an, damit das Formular eine Auswahl anbieten kann.',
    noMatches: 'Keine Kategorie entspricht dieser Auswahl.',
    noMatchesHint: 'Andere Ansicht wählen oder die Suche zurücksetzen.',

    dialog: {
      createTitle: 'Neue Kategorie',
      createSubtitle:
        'Sobald sie aktiv ist, erscheint sie unten im Formular zur Auswahl.',
      editTitle: 'Kategorie bearbeiten',
      editSubtitle:
        'Änderungen gelten für das Formular und für alle bestehenden Anfragen.',
      name: 'Name',
      namePlaceholder: 'z. B. Social Media',
      nameHint: 'So steht die Kategorie im Formular.',
      description: 'Beschreibung',
      descriptionPlaceholder: 'Kurz erklärt, wofür diese Kategorie steht.',
      descriptionHint: 'Optional, eine Zeile unter dem Namen.',
      activeLabel: 'Im Formular anzeigen',
      activeHint:
        'Inaktive Kategorien bleiben erhalten, sind aber nicht wählbar.',
      preview: 'So sieht es im Formular aus',
      previewInactive: 'Inaktiv, im Formular derzeit ausgeblendet.',
      create: 'Anlegen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      close: 'Schließen',
      // The name checks are worded once, in errors.fields.
    },
  },

  /** Read from here, so no English default reaches a Staff member. */
  pagination: {
    previous: 'Zurück',
    next: 'Weiter',
    /** One sentence: the pager styles both numbers. */
    position: 'Seite {page} von {total}',
    page: (page: number) => `Seite ${String(page)}`,
  },

  views: {
    all: 'Alle',
    unassigned: 'Nicht zugewiesen',
    stale: `Älter als ${String(STALE_AFTER_DAYS)} Tage`,
  } satisfies Record<ApplicationView, string>,

  filters: {
    search: 'Suche',
    category: 'Kategorie',
    status: 'Status',
    all: 'Alle',
    filter: 'Filter',
    apply: 'Anwenden',
    reset: 'Filter zurücksetzen',
  },

  columns: {
    submittedAt: 'Eingegangen',
    name: 'Name',
    email: 'E-Mail',
    category: 'Kategorie',
    weeklyTime: 'Verfügbarkeit',
    status: 'Status',
    owner: 'Zuständig',
    actions: 'Aktionen',
  },

  statuses: {
    NEW: 'Neu',
    IN_REVIEW: 'In Prüfung',
    INTRO_BOOKED: 'Info-Runde gebucht',
    ACTIVE: 'Aktiv',
    WAITLISTED: 'Warteliste',
    DECLINED: 'Abgelehnt',
  } satisfies Record<ApplicationStatus, string>,

  /** As the public form words them. IRREGULAR is no quantity, so no "pro Woche". */
  weeklyTimes: {
    HOURS_1_2: '1 bis 2 Stunden',
    HOURS_3_5: '3 bis 5 Stunden',
    HOURS_5_PLUS: 'mehr als 5 Stunden',
    IRREGULAR: 'unregelmäßig, projektweise',
  } satisfies Record<WeeklyTime, string>,

  application: {
    unassigned: 'Nicht zugewiesen',
    daysAgo: (days: number) =>
      days === 0
        ? 'Heute'
        : days === 1
          ? 'Gestern'
          : `vor ${String(days)} Tagen`,
  },

  detail: {
    title: 'Anfrage',
    close: 'Schließen',
    workflow: 'Workflow',
    about: 'Nachricht',
    internalNotes: 'Interne Notizen',
    /** Kept as a hint: placeholder text disappears on the first keystroke. */
    notesHint: 'Nur für Mitarbeitende sichtbar',
    notesPlaceholder: 'Notiz hinzufügen …',
    documents: 'Unterlagen',
    documentsLoading: 'Unterlagen werden geladen …',
    documentsFailed: 'Die Unterlagen konnten nicht geladen werden.',
    documentsEmpty: 'Keine Unterlagen hochgeladen.',
    documentDownload: 'Herunterladen',
    documentUploadedAt: (date: string) => `hochgeladen am ${date}`,
    consent: 'Einwilligung',
    consentAt: 'Erteilt am',
    consentTextVersion: 'Datenschutzerklärung',
    consentTextVersionValue: (version: string) => `Version ${version}`,
    owner: 'Zuständig',
    status: 'Status',
    writeMail: 'E-Mail schreiben',
    copyMail: 'E-Mail-Adresse kopieren',
    /** Visible label only: copyMail stays the accessible name. */
    copyMailShort: 'Kopieren',
    copied: 'Kopiert',
  },
} as const;
