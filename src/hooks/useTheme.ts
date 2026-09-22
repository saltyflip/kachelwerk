import { useCallback, useEffect, useState } from 'react';
import type { ThemeWahl } from '../types/models';
import { SCHLUESSEL_THEME, leseTheme, schreibeEinstellung } from '../db/repo';

/**
 * Das Theme liegt in der Datenbank (damit es im Export landet) und zusaetzlich
 * im localStorage, damit das Inline-Skript in index.html schon vor dem ersten
 * Rendern die richtige Klasse setzt und nichts aufblitzt.
 */
export const THEME_SPEICHER_KEY = 'kachelwerk-theme';

export function wendeThemeAn(wahl: ThemeWahl): void {
  const dunkel =
    wahl === 'dunkel' ||
    (wahl === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dunkel);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dunkel ? '#0b0d10' : '#f5f6f9');
}

export function useTheme() {
  const [wahl, setWahl] = useState<ThemeWahl>(() => {
    const gespeichert = localStorage.getItem(THEME_SPEICHER_KEY) as ThemeWahl | null;
    return gespeichert ?? 'dunkel';
  });

  // Einmalig den in der Datenbank hinterlegten Wert nachziehen
  useEffect(() => {
    let aktiv = true;
    void leseTheme().then((ausDb) => {
      if (aktiv) setWahl(ausDb);
    });
    return () => {
      aktiv = false;
    };
  }, []);

  useEffect(() => {
    wendeThemeAn(wahl);
    localStorage.setItem(THEME_SPEICHER_KEY, wahl);
    if (wahl !== 'system') return;

    const abfrage = window.matchMedia('(prefers-color-scheme: dark)');
    const reagiere = () => wendeThemeAn('system');
    abfrage.addEventListener('change', reagiere);
    return () => abfrage.removeEventListener('change', reagiere);
  }, [wahl]);

  const setzeTheme = useCallback((neu: ThemeWahl) => {
    setWahl(neu);
    void schreibeEinstellung(SCHLUESSEL_THEME, neu);
  }, []);

  return { theme: wahl, setzeTheme };
}
