import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { aktiveHabits, alleHabits, archivierteHabits, habitLesen } from '../db/repo';
import { zuAnzahlKarte } from '../lib/streak';
import type { Completion, Habit } from '../types/models';

export function useAktiveHabits(): Habit[] | undefined {
  return useLiveQuery(() => aktiveHabits(), []);
}

export function useAlleHabits(): Habit[] | undefined {
  return useLiveQuery(() => alleHabits(), []);
}

export function useArchivierteHabits(): Habit[] | undefined {
  return useLiveQuery(() => archivierteHabits(), []);
}

export function useHabit(id: string | undefined): Habit | undefined | null {
  return useLiveQuery(async () => (id ? ((await habitLesen(id)) ?? null) : null), [id]);
}

export function useCompletions(habitId: string | undefined): Completion[] | undefined {
  return useLiveQuery(async (): Promise<Completion[]> => {
    if (!habitId) return [];
    return db.completions.where('habitId').equals(habitId).toArray();
  }, [habitId]);
}

/** Alle Eintraege, gruppiert als habitId -> (Datum -> Anzahl). */
export function useAlleAnzahlKarten(): Map<string, Map<string, number>> | undefined {
  return useLiveQuery(async () => {
    const eintraege = await db.completions.toArray();
    const karten = new Map<string, Map<string, number>>();
    for (const eintrag of eintraege) {
      let karte = karten.get(eintrag.habitId);
      if (!karte) {
        karte = new Map<string, number>();
        karten.set(eintrag.habitId, karte);
      }
      karte.set(eintrag.datum, (karte.get(eintrag.datum) ?? 0) + eintrag.anzahl);
    }
    return karten;
  }, []);
}

export function useAnzahlKarte(habitId: string | undefined): Map<string, number> | undefined {
  const eintraege = useCompletions(habitId);
  return eintraege ? zuAnzahlKarte(eintraege) : undefined;
}
