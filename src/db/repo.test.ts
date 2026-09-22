import { beforeEach, describe, expect, it } from 'vitest';
import type { HabitEntwurf } from '../types/models';
import { db } from './db';
import {
  aktiveHabits,
  archivierteHabits,
  completionId,
  completionsFuer,
  ersetzeAlles,
  erhoeheAnzahl,
  erstelleHabit,
  leseEinstellung,
  loescheHabit,
  naechsterWert,
  schreibeEinstellung,
  setzeAllesZurueck,
  setzeAnzahl,
  setzeArchiviert,
  setzeReihenfolge,
  tippeHabitAn,
} from './repo';

const entwurf = (name: string, teil: Partial<HabitEntwurf> = {}): HabitEntwurf => ({
  name,
  icon: '💧',
  farbe: 'smaragd',
  zielProTag: 1,
  frequenz: { typ: 'taeglich' },
  ...teil,
});

beforeEach(async () => {
  await setzeAllesZurueck();
});

describe('naechsterWert', () => {
  it('zaehlt bis zum Tagesziel hoch und setzt dann zurueck', () => {
    expect(naechsterWert(0, 1)).toBe(1);
    expect(naechsterWert(1, 1)).toBe(0);
    expect(naechsterWert(0, 3)).toBe(1);
    expect(naechsterWert(2, 3)).toBe(3);
    expect(naechsterWert(3, 3)).toBe(0);
    expect(naechsterWert(5, 3)).toBe(0);
  });
});

describe('erstelleHabit', () => {
  it('vergibt Id, Zeitstempel und fortlaufende Reihenfolge', async () => {
    const a = await erstelleHabit(entwurf('Wasser'));
    const b = await erstelleHabit(entwurf('Lesen'));

    expect(a.id).toBeTruthy();
    expect(a.archiviert).toBe(false);
    expect(a.reihenfolge).toBe(0);
    expect(b.reihenfolge).toBe(1);
    expect(Number.isNaN(Date.parse(a.erstelltAm))).toBe(false);
  });

  it('erzwingt ein Tagesziel von mindestens eins', async () => {
    const h = await erstelleHabit(entwurf('Kaputt', { zielProTag: 0 }));
    expect(h.zielProTag).toBe(1);
  });
});

describe('Eintraege', () => {
  it('zaehlt hoch und wieder auf null zurueck', async () => {
    const h = await erstelleHabit(entwurf('Wasser', { zielProTag: 3 }));

    expect(await tippeHabitAn(h, '2026-09-22')).toBe(1);
    expect(await tippeHabitAn(h, '2026-09-22')).toBe(2);
    expect(await tippeHabitAn(h, '2026-09-22')).toBe(3);
    expect(await tippeHabitAn(h, '2026-09-22')).toBe(0);

    expect(await db.completions.get(completionId(h.id, '2026-09-22'))).toBeUndefined();
  });

  it('legt je Habit und Tag nur einen Datensatz an', async () => {
    const h = await erstelleHabit(entwurf('Wasser'));
    await setzeAnzahl(h.id, '2026-09-22', 1);
    await setzeAnzahl(h.id, '2026-09-22', 4);

    const eintraege = await completionsFuer(h.id);
    expect(eintraege).toHaveLength(1);
    expect(eintraege[0].anzahl).toBe(4);
  });

  it('loescht den Datensatz bei Anzahl null', async () => {
    const h = await erstelleHabit(entwurf('Wasser'));
    await setzeAnzahl(h.id, '2026-09-22', 2);
    await setzeAnzahl(h.id, '2026-09-22', 0);
    expect(await completionsFuer(h.id)).toHaveLength(0);
  });

  it('faellt beim Verringern nicht unter null', async () => {
    const h = await erstelleHabit(entwurf('Wasser'));
    await erhoeheAnzahl(h.id, '2026-09-22', 1);
    expect(await erhoeheAnzahl(h.id, '2026-09-22', -5)).toBe(0);
    expect(await completionsFuer(h.id)).toHaveLength(0);
  });
});

describe('Archivieren und Loeschen', () => {
  it('trennt aktive von archivierten Gewohnheiten', async () => {
    const a = await erstelleHabit(entwurf('Wasser'));
    await erstelleHabit(entwurf('Lesen'));
    await setzeArchiviert(a.id, true);

    expect((await aktiveHabits()).map((h) => h.name)).toEqual(['Lesen']);
    expect((await archivierteHabits()).map((h) => h.name)).toEqual(['Wasser']);
  });

  it('entfernt beim Loeschen auch alle Eintraege', async () => {
    const a = await erstelleHabit(entwurf('Wasser'));
    const b = await erstelleHabit(entwurf('Lesen'));
    await setzeAnzahl(a.id, '2026-09-22', 1);
    await setzeAnzahl(b.id, '2026-09-22', 1);

    await loescheHabit(a.id);

    expect(await db.habits.count()).toBe(1);
    expect(await completionsFuer(a.id)).toHaveLength(0);
    expect(await completionsFuer(b.id)).toHaveLength(1);
  });
});

describe('setzeReihenfolge', () => {
  it('schreibt die neue Sortierung', async () => {
    const a = await erstelleHabit(entwurf('A'));
    const b = await erstelleHabit(entwurf('B'));
    const c = await erstelleHabit(entwurf('C'));

    await setzeReihenfolge([c.id, a.id, b.id]);

    expect((await aktiveHabits()).map((h) => h.name)).toEqual(['C', 'A', 'B']);
  });
});

describe('Einstellungen', () => {
  it('liefert den Standardwert, solange nichts gespeichert ist', async () => {
    expect(await leseEinstellung('theme', 'dunkel')).toBe('dunkel');
    await schreibeEinstellung('theme', 'hell');
    expect(await leseEinstellung('theme', 'dunkel')).toBe('hell');
  });
});

describe('ersetzeAlles / setzeAllesZurueck', () => {
  it('tauscht den gesamten Bestand aus', async () => {
    const alt = await erstelleHabit(entwurf('Alt'));
    await setzeAnzahl(alt.id, '2026-09-22', 1);

    await ersetzeAlles(
      [
        {
          id: 'neu-1',
          name: 'Neu',
          icon: '📖',
          farbe: 'azur',
          zielProTag: 1,
          frequenz: { typ: 'taeglich' },
          erstelltAm: '2026-09-01T08:00:00.000Z',
          archiviert: false,
          reihenfolge: 0,
        },
      ],
      [{ id: 'neu-1__2026-09-20', habitId: 'neu-1', datum: '2026-09-20', anzahl: 1 }],
    );

    expect((await aktiveHabits()).map((h) => h.id)).toEqual(['neu-1']);
    expect(await db.completions.count()).toBe(1);
  });

  it('raeumt alles ab', async () => {
    const h = await erstelleHabit(entwurf('Wasser'));
    await setzeAnzahl(h.id, '2026-09-22', 1);
    await schreibeEinstellung('theme', 'hell');

    await setzeAllesZurueck();

    expect(await db.habits.count()).toBe(0);
    expect(await db.completions.count()).toBe(0);
    expect(await db.einstellungen.count()).toBe(0);
  });
});
