import type { Completion, EinstellungsEintrag, Frequenz, Habit, IsoWochentag } from '../types/models';
import { STANDARD_FARBE } from './colors';
import { STANDARD_ICON } from './icons';

export const BACKUP_APP = 'kachelwerk';
export const BACKUP_VERSION = 1;

export interface BackupDatei {
  app: typeof BACKUP_APP;
  version: number;
  exportiertAm: string;
  habits: Habit[];
  completions: Completion[];
  einstellungen: EinstellungsEintrag[];
}

export interface Zusammenfassung {
  habits: number;
  archivierte: number;
  eintraege: number;
  erledigungen: number;
  vonDatum?: string;
  bisDatum?: string;
  verworfen: number;
}

export type PruefErgebnis =
  | { ok: true; daten: BackupDatei; zusammenfassung: Zusammenfassung }
  | { ok: false; fehler: string };

const DATUM_MUSTER = /^\d{4}-\d{2}-\d{2}$/;
const FREQUENZ_TYPEN = ['taeglich', 'wochentage', 'malProWoche'];

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

function istEchtesDatum(schluessel: string): boolean {
  if (!DATUM_MUSTER.test(schluessel)) return false;
  const [jahr, monat, tag] = schluessel.split('-').map(Number);
  const datum = new Date(jahr, monat - 1, tag, 12);
  return (
    datum.getFullYear() === jahr && datum.getMonth() === monat - 1 && datum.getDate() === tag
  );
}

export function baueBackup(
  habits: Habit[],
  completions: Completion[],
  einstellungen: EinstellungsEintrag[],
): BackupDatei {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportiertAm: new Date().toISOString(),
    habits,
    completions,
    einstellungen,
  };
}

export function alsJson(backup: BackupDatei): string {
  return JSON.stringify(backup, null, 2);
}

export function dateiName(datum = new Date()): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `kachelwerk-backup-${datum.getFullYear()}-${z(datum.getMonth() + 1)}-${z(datum.getDate())}.json`;
}

function pruefeFrequenz(roh: unknown): Frequenz | undefined {
  if (!istObjekt(roh)) return undefined;
  const typ = roh.typ;
  if (typeof typ !== 'string' || !FREQUENZ_TYPEN.includes(typ)) return undefined;

  if (typ === 'wochentage') {
    const tage = Array.isArray(roh.wochentage)
      ? roh.wochentage.filter((t): t is IsoWochentag => typeof t === 'number' && t >= 1 && t <= 7)
      : [];
    if (tage.length === 0) return undefined;
    return { typ: 'wochentage', wochentage: [...new Set(tage)].sort((a, b) => a - b) };
  }

  if (typ === 'malProWoche') {
    const anzahl = typeof roh.malProWoche === 'number' ? Math.round(roh.malProWoche) : 0;
    if (anzahl < 1 || anzahl > 7) return undefined;
    return { typ: 'malProWoche', malProWoche: anzahl };
  }

  return { typ: 'taeglich' };
}

function pruefeHabit(roh: unknown, index: number): Habit | string {
  if (!istObjekt(roh)) return `Gewohnheit ${index + 1} ist kein Objekt.`;
  if (typeof roh.id !== 'string' || roh.id.length === 0) {
    return `Gewohnheit ${index + 1} hat keine gültige id.`;
  }
  if (typeof roh.name !== 'string' || roh.name.trim().length === 0) {
    return `Gewohnheit ${index + 1} hat keinen Namen.`;
  }

  const frequenz = pruefeFrequenz(roh.frequenz);
  if (!frequenz) return `Gewohnheit "${roh.name}" hat eine unbekannte Frequenz.`;

  const erstelltAm =
    typeof roh.erstelltAm === 'string' && !Number.isNaN(Date.parse(roh.erstelltAm))
      ? roh.erstelltAm
      : new Date().toISOString();

  return {
    id: roh.id,
    name: roh.name.trim(),
    beschreibung: typeof roh.beschreibung === 'string' ? roh.beschreibung : undefined,
    icon: typeof roh.icon === 'string' && roh.icon ? roh.icon : STANDARD_ICON,
    farbe: typeof roh.farbe === 'string' && roh.farbe ? roh.farbe : STANDARD_FARBE,
    zielProTag:
      typeof roh.zielProTag === 'number' && roh.zielProTag >= 1 ? Math.round(roh.zielProTag) : 1,
    frequenz,
    erstelltAm,
    archiviert: roh.archiviert === true,
    reihenfolge: typeof roh.reihenfolge === 'number' ? Math.round(roh.reihenfolge) : index,
  };
}

/**
 * Prüft eine eingelesene Sicherung vollständig durch, bevor irgendetwas
 * überschrieben wird. Defekte Einzelposten werden verworfen und gezählt,
 * grundsätzlich unbrauchbare Dateien abgelehnt.
 */
export function pruefeBackup(roh: unknown): PruefErgebnis {
  if (typeof roh === 'string') {
    try {
      roh = JSON.parse(roh);
    } catch {
      return { ok: false, fehler: 'Die Datei enthält kein gültiges JSON.' };
    }
  }

  if (!istObjekt(roh)) return { ok: false, fehler: 'Die Datei enthält kein Datenobjekt.' };
  if (roh.app !== BACKUP_APP) {
    return { ok: false, fehler: 'Diese Datei stammt nicht aus Kachelwerk.' };
  }
  if (typeof roh.version !== 'number' || roh.version > BACKUP_VERSION) {
    return {
      ok: false,
      fehler: 'Die Datei wurde mit einer neueren Version erstellt und kann nicht gelesen werden.',
    };
  }
  if (!Array.isArray(roh.habits)) return { ok: false, fehler: 'Es fehlt die Liste der Gewohnheiten.' };
  if (!Array.isArray(roh.completions)) return { ok: false, fehler: 'Es fehlt die Liste der Einträge.' };

  const habits: Habit[] = [];
  const gesehen = new Set<string>();
  for (const [index, eintrag] of roh.habits.entries()) {
    const ergebnis = pruefeHabit(eintrag, index);
    if (typeof ergebnis === 'string') return { ok: false, fehler: ergebnis };
    if (gesehen.has(ergebnis.id)) return { ok: false, fehler: `Doppelte id: ${ergebnis.id}` };
    gesehen.add(ergebnis.id);
    habits.push(ergebnis);
  }

  const completions: Completion[] = [];
  const bekannteTage = new Set<string>();
  let verworfen = 0;

  for (const eintrag of roh.completions) {
    if (!istObjekt(eintrag)) {
      verworfen += 1;
      continue;
    }
    const habitId = eintrag.habitId;
    const datum = eintrag.datum;
    const anzahl = eintrag.anzahl;
    if (
      typeof habitId !== 'string' ||
      !gesehen.has(habitId) ||
      typeof datum !== 'string' ||
      !istEchtesDatum(datum) ||
      typeof anzahl !== 'number' ||
      !Number.isFinite(anzahl) ||
      anzahl < 1
    ) {
      verworfen += 1;
      continue;
    }

    const id = `${habitId}__${datum}`;
    if (bekannteTage.has(id)) {
      verworfen += 1;
      continue;
    }
    bekannteTage.add(id);
    completions.push({ id, habitId, datum, anzahl: Math.round(anzahl) });
  }

  const einstellungen: EinstellungsEintrag[] = Array.isArray(roh.einstellungen)
    ? roh.einstellungen.filter(
        (e): e is EinstellungsEintrag => istObjekt(e) && typeof e.key === 'string',
      )
    : [];

  const daten: BackupDatei = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportiertAm: typeof roh.exportiertAm === 'string' ? roh.exportiertAm : new Date().toISOString(),
    habits,
    completions,
    einstellungen,
  };

  const datumsListe = completions.map((c) => c.datum).sort();

  return {
    ok: true,
    daten,
    zusammenfassung: {
      habits: habits.length,
      archivierte: habits.filter((h) => h.archiviert).length,
      eintraege: completions.length,
      erledigungen: completions.reduce((summe, c) => summe + c.anzahl, 0),
      vonDatum: datumsListe[0],
      bisDatum: datumsListe.at(-1),
      verworfen,
    },
  };
}

/** Tage seit der letzten Sicherung; ohne Sicherung: undefined. */
export function tageSeitBackup(letztesBackupAm: string | undefined, jetzt = new Date()): number | undefined {
  if (!letztesBackupAm) return undefined;
  const zeit = Date.parse(letztesBackupAm);
  if (Number.isNaN(zeit)) return undefined;
  return Math.floor((jetzt.getTime() - zeit) / 86_400_000);
}
