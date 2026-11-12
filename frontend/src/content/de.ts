import type { ErrorCode } from '../features/application-form/errors';
import type {
  FixedRoute,
  WeeklyTime,
} from '../features/application-form/routes';
import type { Content } from './types';

export const de = {
  nav: {
    items: [
      'Über uns',
      'Engagement',
      'Bildung',
      'Neuigkeiten',
      'Veranstaltungen',
    ],
    donate: 'Spende',
    menuLabel: 'Menü öffnen',
    menuCloseLabel: 'Menü schließen',
    searchLabel: 'Suche',
    languageLabel: 'Sprache',
    logoAlt: 'ichbinhier e.V.',
  },

  hero: {
    tagline: 'ichbinhier, damit Liebe lauter ist',
  },

  page: {
    title: 'ichbinhier lebt vom Mitmachen.',
    subtitle:
      'Sag uns in zwei Minuten, wie du dabei sein möchtest. Deine Bestätigung mit allen weiteren Infos kommt sofort per E-Mail, kein „wir melden uns“.',
  },

  routeField: {
    label: 'Wie möchtest du uns helfen?',
    placeholder: 'Bitte wählen …',
    hint: 'Danach zeigen wir dir nur, was für deinen Weg wirklich nötig ist.',
  },

  routeLabels: {
    COMMUNITY: 'Bei #ichbinhier mitmachen (Aktionsgruppe)',
    SUPPORTING_MEMBER: 'Fördermitglied werden',
  } satisfies Record<FixedRoute, string>,

  categoriesField: {
    loadingOption: 'Lädt …',
    errorOption: 'Nicht verfügbar',
    error:
      'Die Bereiche für Vereinsarbeit konnten nicht geladen werden. Bitte versuche es noch einmal.',
    retry: 'Erneut versuchen',
    empty: 'Aktuell keine offenen Bereiche für Vereinsarbeit.',
  },

  fields: {
    name: {
      label: 'Name',
    },
    email: {
      label: 'E-Mail',
    },
    weeklyTime: {
      label: 'Zeit pro Woche',
      placeholder: 'Bitte wählen …',
    },
    about: {
      label: 'Erzähl uns kurz von dir',
      placeholder: 'Was bringst du mit, und was motiviert dich?',
      hint: 'Vier Sätze reichen. Wir lesen jede Bewerbung.',
    },
    consent: {
      before:
        'Ich bin damit einverstanden, dass ichbinhier e.V. meine Angaben zur Bearbeitung meiner Bewerbung speichert. ',
      linkLabel: 'Datenschutzerklärung',
      after: '',
    },
  },

  weeklyTimeLabels: {
    HOURS_1_2: '1 bis 2 Stunden',
    HOURS_3_5: '3 bis 5 Stunden',
    HOURS_5_PLUS: 'mehr als 5 Stunden',
    IRREGULAR: 'unregelmäßig, projektweise',
  } satisfies Record<WeeklyTime, string>,

  submit: {
    label: 'Bewerbung abschicken',
    loadingLabel: 'Wird abgeschickt …',
    helper:
      'Du erhältst sofort eine Bestätigungs-E-Mail mit allen weiteren Infos.',
  },

  actions: {
    next: 'Weiter',
  },

  communityPanel: {
    title: 'Du bist sofort dabei.',
    body: 'Kein Warten und keine Rückmeldung nötig: Tritt der Aktionsgruppe bei, lies die Regeln und wähle deinen ersten Thread. Beim ersten Mal antwortest du gemeinsam mit anderen, nie allein.',
    cta: 'Zur Aktionsgruppe',
  },

  supportingMemberPanel: {
    title: 'Du unterstützt uns direkt.',
    body: 'Ohne Bewerbung und ohne Wartezeit: Wenn du Fördermitglied werden möchtest, findest du hier alle Informationen und den kurzen Antrag. So hilfst du, digitale Zivilcourage langfristig möglich zu machen.',
    cta: 'Zum Fördermitgliedsantrag',
  },

  confirmation: {
    title: 'Deine Bewerbung ist da!',
    bodyBefore:
      'Wir haben deine Angaben erhalten. Eine Bestätigungs-E-Mail mit allen weiteren Infos ist bereits unterwegs an ',
    bodyAfter: '.',
    closing: 'Vielen Dank für dein Interesse!',
  },

  errors: {
    ROUTE_REQUIRED: 'Bitte wähle aus, wie du uns helfen möchtest',
    CATEGORY_REQUIRED: 'Bitte wähle aus, wie du uns helfen möchtest',
    CATEGORY_UNKNOWN:
      'Diese Auswahl kennen wir nicht. Bitte wähle einen der Punkte aus der Liste',
    CATEGORY_UNAVAILABLE:
      'Dieser Bereich ist inzwischen nicht mehr verfügbar. Bitte wähle einen anderen Punkt aus der aktualisierten Liste.',
    NAME_REQUIRED: 'Bitte sag uns, wie wir dich ansprechen sollen',
    NAME_TOO_LONG: 'Bitte kürze deinen Namen auf 120 Zeichen',
    EMAIL_REQUIRED:
      'Bitte gib eine E-Mail-Adresse ein, an die wir dir antworten können',
    EMAIL_INVALID:
      'Bitte gib eine E-Mail-Adresse ein, an die wir dir antworten können',
    EMAIL_TOO_LONG:
      'Diese E-Mail-Adresse ist zu lang. Bitte prüfe sie noch einmal',
    WEEKLY_TIME_REQUIRED:
      'Bitte wähle aus, wie viel Zeit du pro Woche einbringen kannst',
    WEEKLY_TIME_UNKNOWN:
      'Diese Auswahl kennen wir nicht. Bitte wähle einen der Punkte aus der Liste',
    ABOUT_TOO_LONG: 'Bitte kürze deinen Text auf 2000 Zeichen',
    CONSENT_REQUIRED:
      'Ohne deine Einwilligung können wir deine Bewerbung nicht speichern',
    RATE_LIMITED:
      'Es kamen gerade sehr viele Bewerbungen an. Bitte versuche es in einer Minute noch einmal. Deine Angaben bleiben stehen.',
    INTERNAL_ERROR:
      'Das Abschicken hat gerade nicht funktioniert. Bitte versuche es noch einmal. Deine Angaben bleiben stehen.',
  } satisfies Record<ErrorCode, string>,

  unknownError:
    'Das Abschicken hat gerade nicht funktioniert. Bitte versuche es noch einmal. Deine Angaben bleiben stehen.',

  a11y: {
    submitting: 'Deine Bewerbung wird abgeschickt.',
    honeypotLabel: 'Dieses Feld bitte leer lassen',
  },

  footer: {
    kontakt: {
      title: 'Kontakt',
      talkToUs: 'Sprich mit uns',
      address: ['Postfach 25588', '10129 Berlin', 'info@ichbinhier.online'],
    },
    rechtliches: {
      title: 'Rechtliches',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
    },
    donateLabel: 'SPENDE HIER',
    socialLabels: {
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      bluesky: 'Bluesky',
      tiktok: 'TikTok',
    },
    copyright: 'Copyright 2026 ichbinhier e.V. Alle Rechte vorbehalten.',
    backToTopLabel: 'Nach oben',
  },
} as const satisfies Content;

export function errorText(code: string): string {
  return code in de.errors ? de.errors[code as ErrorCode] : de.unknownError;
}
