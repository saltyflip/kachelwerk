import Dexie, { type Table } from 'dexie';
import type { Completion, EinstellungsEintrag, Habit } from '../types/models';

/**
 * Lokale Datenbank. Alles bleibt im Browser (IndexedDB), es gibt kein Backend.
 * Booleans werden von IndexedDB nicht indiziert - `archiviert` wird deshalb
 * bewusst nicht als Index gefuehrt, sondern in JavaScript gefiltert.
 */
export class KachelwerkDB extends Dexie {
  habits!: Table<Habit, string>;
  completions!: Table<Completion, string>;
  einstellungen!: Table<EinstellungsEintrag, string>;

  constructor() {
    super('kachelwerk');
    this.version(1).stores({
      habits: 'id, reihenfolge, erstelltAm',
      completions: 'id, habitId, datum, [habitId+datum]',
      einstellungen: 'key',
    });
  }
}

export const db = new KachelwerkDB();
