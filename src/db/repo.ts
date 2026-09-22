import type { Completion, EinstellungsEintrag, Habit, HabitEntwurf, ThemeWahl } from '../types/models';
import { heute } from '../lib/dates';
import { db } from './db';

export const SCHLUESSEL_THEME = 'theme';
export const SCHLUESSEL_LETZTES_BACKUP = 'letztesBackupAm';
export const SCHLUESSEL_HINWEIS_GESEHEN = 'backupHinweisGesehenAm';

export function completionId(habitId: string, datum: string): string {
  return `${habitId}__${datum}`;
}

function neueId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sortiereHabits(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => a.reihenfolge - b.reihenfolge || a.erstelltAm.localeCompare(b.erstelltAm));
}

export async function alleHabits(): Promise<Habit[]> {
  return sortiereHabits(await db.habits.toArray());
}

export async function aktiveHabits(): Promise<Habit[]> {
  return (await alleHabits()).filter((h) => !h.archiviert);
}

export async function archivierteHabits(): Promise<Habit[]> {
  return (await alleHabits()).filter((h) => h.archiviert);
}

export async function habitLesen(id: string): Promise<Habit | undefined> {
  return db.habits.get(id);
}

export async function erstelleHabit(entwurf: HabitEntwurf): Promise<Habit> {
  const vorhandene = await db.habits.toArray();
  const hoechste = vorhandene.reduce((max, h) => Math.max(max, h.reihenfolge), -1);
  const habit: Habit = {
    id: neueId(),
    erstelltAm: new Date().toISOString(),
    archiviert: false,
    reihenfolge: hoechste + 1,
    ...entwurf,
    zielProTag: Math.max(1, Math.round(entwurf.zielProTag)),
  };
  await db.habits.add(habit);
  return habit;
}

export async function aktualisiereHabit(id: string, aenderung: Partial<Habit>): Promise<void> {
  await db.habits.update(id, aenderung);
}

export async function setzeArchiviert(id: string, archiviert: boolean): Promise<void> {
  await db.habits.update(id, { archiviert });
}

export async function loescheHabit(id: string): Promise<void> {
  await db.transaction('rw', db.habits, db.completions, async () => {
    await db.completions.where('habitId').equals(id).delete();
    await db.habits.delete(id);
  });
}

/** Speichert die neue Reihenfolge anhand der übergebenen Id-Liste. */
export async function setzeReihenfolge(ids: string[]): Promise<void> {
  await db.transaction('rw', db.habits, async () => {
    await Promise.all(ids.map((id, index) => db.habits.update(id, { reihenfolge: index })));
  });
}

export async function completionsFuer(habitId: string): Promise<Completion[]> {
  return db.completions.where('habitId').equals(habitId).toArray();
}

export async function alleCompletions(): Promise<Completion[]> {
  return db.completions.toArray();
}

export async function setzeAnzahl(habitId: string, datum: string, anzahl: number): Promise<void> {
  const id = completionId(habitId, datum);
  const gerundet = Math.max(0, Math.round(anzahl));
  if (gerundet === 0) {
    await db.completions.delete(id);
    return;
  }
  await db.completions.put({ id, habitId, datum, anzahl: gerundet });
}

export async function erhoeheAnzahl(habitId: string, datum: string, delta = 1): Promise<number> {
  return db.transaction('rw', db.completions, async () => {
    const id = completionId(habitId, datum);
    const vorhanden = await db.completions.get(id);
    const neu = Math.max(0, (vorhanden?.anzahl ?? 0) + delta);
    if (neu === 0) {
      await db.completions.delete(id);
    } else {
      await db.completions.put({ id, habitId, datum, anzahl: neu });
    }
    return neu;
  });
}

/**
 * Nächster Wert beim Antippen des Check-Buttons: hochzählen bis zum
 * Tagesziel, danach wieder auf null (Haken entfernen).
 */
export function naechsterWert(anzahl: number, zielProTag: number): number {
  const ziel = Math.max(1, zielProTag);
  return anzahl >= ziel ? 0 : anzahl + 1;
}

export async function tippeHabitAn(habit: Habit, datum: string = heute()): Promise<number> {
  const vorhanden = await db.completions.get(completionId(habit.id, datum));
  const neu = naechsterWert(vorhanden?.anzahl ?? 0, habit.zielProTag);
  await setzeAnzahl(habit.id, datum, neu);
  return neu;
}

export async function leseEinstellung<T>(key: string, standard: T): Promise<T> {
  const eintrag = await db.einstellungen.get(key);
  return (eintrag?.wert as T | undefined) ?? standard;
}

export async function schreibeEinstellung(key: string, wert: unknown): Promise<void> {
  await db.einstellungen.put({ key, wert });
}

export async function leseTheme(): Promise<ThemeWahl> {
  return leseEinstellung<ThemeWahl>(SCHLUESSEL_THEME, 'dunkel');
}

export async function alleEinstellungen(): Promise<EinstellungsEintrag[]> {
  return db.einstellungen.toArray();
}

/** Loescht saemtliche Daten (Habits, Einträge, Einstellungen). */
export async function setzeAllesZurueck(): Promise<void> {
  await db.transaction('rw', db.habits, db.completions, db.einstellungen, async () => {
    await db.completions.clear();
    await db.habits.clear();
    await db.einstellungen.clear();
  });
}

/** Ersetzt den gesamten Datenbestand - wird vom Import verwendet. */
export async function ersetzeAlles(
  habits: Habit[],
  completions: Completion[],
  einstellungen: EinstellungsEintrag[] = [],
): Promise<void> {
  await db.transaction('rw', db.habits, db.completions, db.einstellungen, async () => {
    await db.completions.clear();
    await db.habits.clear();
    await db.einstellungen.clear();
    if (habits.length) await db.habits.bulkAdd(habits);
    if (completions.length) await db.completions.bulkAdd(completions);
    if (einstellungen.length) await db.einstellungen.bulkAdd(einstellungen);
  });
}
