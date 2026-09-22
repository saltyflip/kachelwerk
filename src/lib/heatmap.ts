import type { AnzahlKarte, Habit } from '../types/models';
import { ausSchluessel, heute, verschiebeTage, wochenStart, wochenTage } from './dates';
import { fortschritt as tagesFortschritt, istGeplant, startTag } from './streak';

export type Stufe = 0 | 1 | 2 | 3 | 4;

export interface Kachel {
  datum: string;
  anzahl: number;
  /** 0..1 */
  fortschritt: number;
  stufe: Stufe;
  geplant: boolean;
  zukunft: boolean;
  vorStart: boolean;
}

export interface GitterOptionen {
  /** Anzahl der Wochenspalten (aelteste links). */
  wochen: number;
  heuteSchluessel?: string;
}

export function zuStufe(wert: number): Stufe {
  if (wert <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil(wert * 4))) as Stufe;
}

function ersterWochenStart(heuteSchluessel: string, wochen: number): string {
  return verschiebeTage(wochenStart(heuteSchluessel), -(wochen - 1) * 7);
}

/**
 * Gitter aus `wochen` Spalten zu je sieben Zeilen (Montag oben).
 * Die letzte Spalte ist die laufende Woche.
 */
export function baueGitter(habit: Habit, karte: AnzahlKarte, optionen: GitterOptionen): Kachel[][] {
  const heuteSchluessel = optionen.heuteSchluessel ?? heute();
  const start = startTag(habit, karte);
  const ersteWoche = ersterWochenStart(heuteSchluessel, optionen.wochen);

  return Array.from({ length: optionen.wochen }, (_, spalte) => {
    const wochenBeginn = verschiebeTage(ersteWoche, spalte * 7);
    return wochenTage(wochenBeginn).map((datum) => {
      const anzahl = karte.get(datum) ?? 0;
      const wert = tagesFortschritt(habit, datum, karte);
      return {
        datum,
        anzahl,
        fortschritt: wert,
        stufe: zuStufe(wert),
        geplant: istGeplant(habit.frequenz, datum),
        zukunft: datum > heuteSchluessel,
        vorStart: datum < start,
      } satisfies Kachel;
    });
  });
}

/**
 * Gitter ueber mehrere Habits hinweg: `werte` enthaelt je Tag die Anzahl
 * erledigter Habits, `hoechstwert` die Zahl aktiver Habits.
 */
export function baueSammelGitter(
  werte: ReadonlyMap<string, number>,
  hoechstwert: number,
  optionen: GitterOptionen,
): Kachel[][] {
  const heuteSchluessel = optionen.heuteSchluessel ?? heute();
  const ersteWoche = ersterWochenStart(heuteSchluessel, optionen.wochen);
  const nenner = Math.max(1, hoechstwert);

  return Array.from({ length: optionen.wochen }, (_, spalte) => {
    const wochenBeginn = verschiebeTage(ersteWoche, spalte * 7);
    return wochenTage(wochenBeginn).map((datum) => {
      const anzahl = werte.get(datum) ?? 0;
      const wert = Math.min(1, anzahl / nenner);
      return {
        datum,
        anzahl,
        fortschritt: wert,
        stufe: zuStufe(wert),
        geplant: true,
        zukunft: datum > heuteSchluessel,
        vorStart: false,
      } satisfies Kachel;
    });
  });
}

export interface Monatsmarke {
  spalte: number;
  kuerzel: string;
}

const MONATS_KUERZEL = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
];

/** Monatsbeschriftungen fuer die Jahres-Heatmap: je Monatswechsel eine Marke. */
export function monatsMarken(gitter: Kachel[][]): Monatsmarke[] {
  const marken: Monatsmarke[] = [];
  let letzterMonat = -1;
  gitter.forEach((woche, spalte) => {
    const monat = ausSchluessel(woche[0].datum).getMonth();
    if (monat !== letzterMonat) {
      marken.push({ spalte, kuerzel: MONATS_KUERZEL[monat] });
      letzterMonat = monat;
    }
  });
  return marken;
}
