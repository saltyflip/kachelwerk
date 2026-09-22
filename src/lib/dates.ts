import { addDays, format, getISODay, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import type { IsoWochentag } from '../types/models';

/**
 * Alle Datumsberechnungen laufen über lokale Datumsschlüssel im Format
 * YYYY-MM-DD. toISOString() wird bewusst nirgends verwendet - es rechnet in
 * UTC und wuerde abends den Folgetag liefern.
 *
 * Als Anker innerhalb eines Tages dient 12:00 Ortszeit. Dadurch sind alle
 * Tagesspruenge unempfindlich gegen Zeitumstellungen (23- bzw. 25-Stunden-Tage).
 */

export const SCHLUESSEL_FORMAT = 'yyyy-MM-dd';

export function datumsSchluessel(datum: Date): string {
  return format(datum, SCHLUESSEL_FORMAT);
}

export function ausSchluessel(schluessel: string): Date {
  const [jahr, monat, tag] = schluessel.split('-').map(Number);
  return new Date(jahr, monat - 1, tag, 12, 0, 0, 0);
}

export function heute(): string {
  return datumsSchluessel(new Date());
}

export function verschiebeTage(schluessel: string, tage: number): string {
  return datumsSchluessel(addDays(ausSchluessel(schluessel), tage));
}

/** Kalendertage zwischen zwei Schlüsseln (b - a). */
export function tagesDifferenz(a: string, b: string): number {
  const ms = ausSchluessel(b).getTime() - ausSchluessel(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function isoWochentag(schluessel: string): IsoWochentag {
  return getISODay(ausSchluessel(schluessel)) as IsoWochentag;
}

/** Schlüssel des Montags der Woche, in der der Tag liegt. */
export function wochenStart(schluessel: string): string {
  return datumsSchluessel(startOfWeek(ausSchluessel(schluessel), { weekStartsOn: 1 }));
}

/** Die sieben Tage einer Woche ab Montag. */
export function wochenTage(startSchluessel: string): string[] {
  return Array.from({ length: 7 }, (_, i) => verschiebeTage(startSchluessel, i));
}

/** Alle Tage von `von` bis `bis` (beide inklusive), aufsteigend. */
export function tagesSpanne(von: string, bis: string): string[] {
  const ergebnis: string[] = [];
  let laufend = von;
  // Sicherheitsnetz gegen Endlosschleifen bei kaputten Eingaben
  let schutz = 0;
  while (laufend <= bis && schutz < 40_000) {
    ergebnis.push(laufend);
    laufend = verschiebeTage(laufend, 1);
    schutz += 1;
  }
  return ergebnis;
}

export function istHeute(schluessel: string): boolean {
  return schluessel === heute();
}

export function istZukunft(schluessel: string, bezug: string = heute()): boolean {
  return schluessel > bezug;
}

/**
 * Monatsraster für den Kalender: volle Wochen ab Montag, die den Monat
 * abdecken. Tage ausserhalb des Monats sind enthalten, damit das Gitter
 * rechteckig bleibt.
 */
export function monatsRaster(jahr: number, monat: number): string[][] {
  const erster = datumsSchluessel(new Date(jahr, monat, 1, 12));
  const letzter = datumsSchluessel(new Date(jahr, monat + 1, 0, 12));
  const start = wochenStart(erster);
  const wochen: string[][] = [];
  let laufend = start;
  while (laufend <= letzter) {
    wochen.push(wochenTage(laufend));
    laufend = verschiebeTage(laufend, 7);
  }
  return wochen;
}

export function monatsName(jahr: number, monat: number): string {
  return format(new Date(jahr, monat, 1, 12), 'LLLL yyyy', { locale: de });
}

export function formatiereDatum(schluessel: string, muster = 'd. MMMM yyyy'): string {
  return format(ausSchluessel(schluessel), muster, { locale: de });
}

export function formatiereKurz(schluessel: string): string {
  return format(ausSchluessel(schluessel), 'EEEEEE, d. MMM', { locale: de });
}
