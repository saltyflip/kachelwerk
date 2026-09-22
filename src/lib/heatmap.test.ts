import { describe, expect, it } from 'vitest';
import type { Habit, IsoWochentag } from '../types/models';
import { baueGitter, baueSammelGitter, monatsMarken, zuStufe } from './heatmap';

function habit(teil: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Testgewohnheit',
    icon: '💧',
    farbe: 'smaragd',
    zielProTag: 1,
    frequenz: { typ: 'taeglich' },
    erstelltAm: '2026-09-14T08:00:00.000Z',
    archiviert: false,
    reihenfolge: 0,
    ...teil,
  };
}

const HEUTE = '2026-09-22'; // Dienstag, Wochenstart ist der 21.9.

describe('zuStufe', () => {
  it('bildet den Fortschritt auf fuenf Stufen ab', () => {
    expect(zuStufe(0)).toBe(0);
    expect(zuStufe(0.1)).toBe(1);
    expect(zuStufe(0.25)).toBe(1);
    expect(zuStufe(0.26)).toBe(2);
    expect(zuStufe(0.5)).toBe(2);
    expect(zuStufe(0.75)).toBe(3);
    expect(zuStufe(1)).toBe(4);
  });
});

describe('baueGitter', () => {
  const gitter = baueGitter(habit(), new Map([['2026-09-21', 1]]), {
    wochen: 20,
    heuteSchluessel: HEUTE,
  });

  it('hat eine Spalte je Woche und sieben Zeilen', () => {
    expect(gitter).toHaveLength(20);
    expect(gitter.every((woche) => woche.length === 7)).toBe(true);
  });

  it('endet mit der laufenden Woche, beginnend am Montag', () => {
    expect(gitter.at(-1)![0].datum).toBe('2026-09-21');
    expect(gitter.at(-1)![1].datum).toBe('2026-09-22');
    expect(gitter[0][0].datum).toBe('2026-05-11'); // 19 Wochen davor
  });

  it('markiert Zukunft, Zeit vor dem Start und erfuellte Tage', () => {
    const laufendeWoche = gitter.at(-1)!;
    expect(laufendeWoche[0]).toMatchObject({ stufe: 4, zukunft: false, vorStart: false });
    expect(laufendeWoche[1]).toMatchObject({ stufe: 0, zukunft: false });
    expect(laufendeWoche[2].zukunft).toBe(true);
    expect(gitter[0][0].vorStart).toBe(true);
  });

  it('stuft Teilfortschritt ab', () => {
    const drei = habit({ zielProTag: 3 });
    const teil = baueGitter(drei, new Map([['2026-09-21', 2]]), {
      wochen: 4,
      heuteSchluessel: HEUTE,
    });
    expect(teil.at(-1)![0].fortschritt).toBeCloseTo(2 / 3);
    expect(teil.at(-1)![0].stufe).toBe(3);
  });

  it('merkt sich, welche Tage geplant sind', () => {
    const h = habit({ frequenz: { typ: 'wochentage', wochentage: [1, 3, 5] as IsoWochentag[] } });
    const g = baueGitter(h, new Map(), { wochen: 2, heuteSchluessel: HEUTE });
    const woche = g.at(-1)!;
    expect(woche[0].geplant).toBe(true); // Montag
    expect(woche[1].geplant).toBe(false); // Dienstag
    expect(woche[4].geplant).toBe(true); // Freitag
  });
});

describe('baueSammelGitter', () => {
  it('normiert auf die Zahl aktiver Gewohnheiten', () => {
    const werte = new Map([
      ['2026-09-21', 4],
      ['2026-09-22', 2],
    ]);
    const gitter = baueSammelGitter(werte, 4, { wochen: 3, heuteSchluessel: HEUTE });
    const woche = gitter.at(-1)!;
    expect(woche[0].stufe).toBe(4);
    expect(woche[1].fortschritt).toBe(0.5);
    expect(woche[1].stufe).toBe(2);
  });

  it('kommt ohne aktive Gewohnheiten nicht ins Straucheln', () => {
    const gitter = baueSammelGitter(new Map(), 0, { wochen: 2, heuteSchluessel: HEUTE });
    expect(gitter.flat().every((kachel) => kachel.stufe === 0)).toBe(true);
  });
});

describe('monatsMarken', () => {
  it('setzt je Monatswechsel eine Beschriftung', () => {
    const gitter = baueGitter(habit(), new Map(), { wochen: 10, heuteSchluessel: HEUTE });
    const marken = monatsMarken(gitter);
    expect(marken[0].spalte).toBe(0);
    expect(marken.map((m) => m.kuerzel)).toEqual(['Jul', 'Aug', 'Sep']);
    expect(new Set(marken.map((m) => m.spalte)).size).toBe(marken.length);
  });
});
