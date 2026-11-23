import { useEffect, useId, useRef, useState } from 'react';

import logo from '../../../assets/icons/ibh-logo.png';
import { cx } from '../../../lib/cx';
import { Button } from '../Button/Button';
import styles from './Header.module.css';

type Language = 'de' | 'en';

export interface HeaderNavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  logoAlt: string;
  homeHref: string;
  navItems: HeaderNavItem[];
  donateLabel: string;
  donateHref: string;
  searchLabel: string;
  menuLabel: string;
  menuCloseLabel: string;
  language: Language;
  languageLabel: string;
  onLanguageChange: (language: Language) => void;
}

/** Smaller moves are wheel or trackpad jitter that would fight the CSS transition. */
const SCROLL_DIRECTION_THRESHOLD = 24;

const SCROLL_TOP_THRESHOLD = 10;

/** Compares against the last flip, so per-frame sub-pixel jitter cannot toggle the state. */
function useIsScrolled(): boolean {
  const [isScrolled, setIsScrolled] = useState(false);
  const lastFlipScrollY = useRef(0);
  const ticking = useRef(false);
  const committed = useRef(false);

  useEffect(() => {
    lastFlipScrollY.current = window.scrollY;

    function flip(target: boolean) {
      if (target === committed.current) return;
      committed.current = target;
      setIsScrolled(target);
    }

    function updateScrollState() {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= SCROLL_TOP_THRESHOLD) {
        flip(false);
        lastFlipScrollY.current = currentScrollY;
      } else if (
        currentScrollY - lastFlipScrollY.current >
        SCROLL_DIRECTION_THRESHOLD
      ) {
        flip(true);
        lastFlipScrollY.current = currentScrollY;
      } else if (
        lastFlipScrollY.current - currentScrollY >
        SCROLL_DIRECTION_THRESHOLD
      ) {
        flip(false);
        lastFlipScrollY.current = currentScrollY;
      }

      ticking.current = false;
    }

    function onScroll() {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollState);
        ticking.current = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return isScrolled;
}

/** The in-flow spacer keeps the page height fixed, so shrinking the header cannot move scrollY. */
export function Header({
  logoAlt,
  homeHref,
  navItems,
  donateLabel,
  donateHref,
  searchLabel,
  menuLabel,
  menuCloseLabel,
  language,
  languageLabel,
  onLanguageChange,
}: HeaderProps) {
  const isScrolled = useIsScrolled();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  const headerClassName = cx(
    styles.header,
    isScrolled ? styles.scrolled : null,
  );

  return (
    <>
      <header className={headerClassName}>
        <div className={styles.inner}>
          <a className={styles.logoLink} href={homeHref}>
            <img alt={logoAlt} className={styles.logo} src={logo} />
          </a>

          <div
            className={cx(styles.right, isMenuOpen ? styles.menuOpen : null)}
            id={menuId}
          >
            <nav className={styles.nav}>
              {navItems.map((item) => (
                <a
                  className={styles.navLink}
                  href={item.href}
                  key={item.href}
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                >
                  {item.label}
                </a>
              ))}
              <div
                aria-label={languageLabel}
                className={styles.languageSwitcher}
              >
                <button
                  aria-pressed={language === 'de'}
                  className={styles.languageButton}
                  onClick={() => {
                    onLanguageChange('de');
                    setIsMenuOpen(false);
                  }}
                  type="button"
                >
                  DE
                </button>
                <button
                  aria-pressed={language === 'en'}
                  className={styles.languageButton}
                  onClick={() => {
                    onLanguageChange('en');
                    setIsMenuOpen(false);
                  }}
                  type="button"
                >
                  EN
                </button>
              </div>
            </nav>

            <div className={styles.actions}>
              <Button
                className={styles.donateButton}
                href={donateHref}
                variant="secondary"
              >
                {donateLabel}
              </Button>
              <button
                aria-label={searchLabel}
                className={styles.iconButton}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className={styles.searchIcon}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="5.625"
                    stroke="currentColor"
                    strokeWidth="2.25"
                  />
                  <path
                    d="M13.5 13.5L19.5 19.5"
                    stroke="currentColor"
                    strokeWidth="2.25"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button
            aria-controls={menuId}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? menuCloseLabel : menuLabel}
            className={styles.menuButton}
            onClick={() => {
              setIsMenuOpen((open) => !open);
            }}
            type="button"
          >
            <svg
              aria-hidden="true"
              className={styles.icon}
              fill="none"
              viewBox="0 0 24 24"
            >
              <rect
                fill="currentColor"
                height="2"
                rx="1"
                width="20"
                x="2"
                y="5"
              />
              <rect
                fill="currentColor"
                height="2"
                rx="1"
                width="20"
                x="2"
                y="12"
              />
              <rect
                fill="currentColor"
                height="2"
                rx="1"
                width="20"
                x="2"
                y="19"
              />
            </svg>
          </button>
        </div>
      </header>
      <div aria-hidden="true" className={styles.spacer} />
    </>
  );
}
