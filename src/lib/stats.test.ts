import { describe, expect, it } from 'vitest';
import type { Habit, IsoWochentag } from '../types/models';
import { berechneStatistik, erfolgsquote, formatiereProzent, wochentagsVerteilung } from './stats';

function habit(teil: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Testgewohnheit',
    icon: '💧',
    farbe: 'smaragd',
    zielProTag: 1,
    frequenz: { typ: 'taeglich' },
    erstelltAm: '2026-01-01T08:00:00.000Z',
    archiviert: false,
    reihenfolge: 0,
    ...teil,
  };
}

function karte(eintraege: string[] | Record<string, number>): Map<string, number> {
  if (Array.isArray(eintraege)) return new Map(eintraege.map((tag) => [tag, 1]));
  return new Map(Object.entries(eintraege));
}

const HEUTE = '2026-09-22'; // Dienstag

describe('erfolgsquote', () => {
  it('bezieht sich auf die geplanten Tage im Fenster', () => {
    // heute ist offen, das Fenster endet daher gestern (21.9.) und reicht bis 15.9.
    const k = karte(['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-20', '2026-09-21']);
    const quote = erfolgsquote(habit(), k, 7, HEUTE);
    expect(quote.soll).toBe(7);
    expect(quote.ist).toBe(5);
    expect(quote.quote).toBeCloseTo(5 / 7);
  });

  it('zaehlt den heutigen Tag mit, sobald er erledigt ist', () => {
    const k = karte(['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22']);
    const quote = erfolgsquote(habit(), k, 7, HEUTE);
    expect(quote.ist).toBe(7);
    expect(quote.soll).toBe(7);
    expect(quote.quote).toBe(1);
  });

  it('zaehlt bei Wochentagen nur die geplanten Tage als Soll', () => {
    const h = habit({
      frequenz: { typ: 'wochentage', wochentage: [1, 3, 5] as IsoWochentag[] },
    });
    // Fenster 15.9. bis 21.9.: geplant sind Mi 16., Fr 18. und Mo 21.
    const k = karte(['2026-09-16', '2026-09-18']);
    const quote = erfolgsquote(h, k, 7, HEUTE);
    expect(quote.soll).toBe(3);
    expect(quote.ist).toBe(2);
  });

  it('rechnet bei X-mal pro Woche anteilig auf das Fenster', () => {
    const h = habit({ frequenz: { typ: 'malProWoche', malProWoche: 3 } });
    const k = karte(['2026-09-16', '2026-09-18', '2026-09-21']);
    const quote = erfolgsquote(h, k, 7, HEUTE);
    expect(quote.soll).toBe(3);
    expect(quote.ist).toBe(3);
    expect(quote.quote).toBe(1);
  });

  it('kuerzt das Fenster auf die Lebenszeit der Gewohnheit', () => {
    const jung = habit({ erstelltAm: '2026-09-19T08:00:00.000Z' });
    const k = karte(['2026-09-19', '2026-09-20', '2026-09-21']);
    const quote = erfolgsquote(jung, k, 30, HEUTE);
    expect(quote.soll).toBe(3);
    expect(quote.ist).toBe(3);
  });

  it('liefert 0, wenn es noch keinen abgeschlossenen Tag gibt', () => {
    const heuteAngelegt = habit({ erstelltAm: '2026-09-22T08:00:00.000Z' });
    const quote = erfolgsquote(heuteAngelegt, karte([]), 7, HEUTE);
    expect(quote).toEqual({ ist: 0, soll: 0, quote: 0 });
  });

  it('deckelt die Quote bei 100 Prozent', () => {
    const h = habit({ frequenz: { typ: 'malProWoche', malProWoche: 2 } });
    const k = karte([
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
      '2026-09-21',
    ]);
    expect(erfolgsquote(h, k, 7, HEUTE).quote).toBe(1);
  });
});

describe('wochentagsVerteilung', () => {
  it('ordnet erfuellte Tage dem richtigen Wochentag zu', () => {
    const h = habit({ erstelltAm: '2026-09-14T08:00:00.000Z' });
    const k = karte(['2026-09-14', '2026-09-21', '2026-09-16']); // 2x Montag, 1x Mittwoch
    const verteilung = wochentagsVerteilung(h, k, HEUTE);
    expect(verteilung).toHaveLength(7);
    expect(verteilung[0]).toMatchObject({ tag: 1, erfuellt: 2 });
    expect(verteilung[2]).toMatchObject({ tag: 3, erfuellt: 1 });
    expect(verteilung[6]).toMatchObject({ tag: 7, erfuellt: 0 });
  });

  it('zaehlt geplante Tage getrennt mit', () => {
    const h = habit({
      frequenz: { typ: 'wochentage', wochentage: [1] as IsoWochentag[] },
      erstelltAm: '2026-09-14T08:00:00.000Z',
    });
    const verteilung = wochentagsVerteilung(h, karte([]), HEUTE);
    expect(verteilung[0].geplant).toBe(2); // 14.9. und 21.9.
    expect(verteilung[1].geplant).toBe(0);
  });
});

describe('berechneStatistik', () => {
  it('fasst Serien, Summen und Quoten zusammen', () => {
    const h = habit({ zielProTag: 3, erstelltAm: '2026-09-18T08:00:00.000Z' });
    const k = karte({
      '2026-09-18': 3,
      '2026-09-19': 1,
      '2026-09-20': 3,
      '2026-09-21': 3,
      '2026-09-22': 2,
    });
    const s = berechneStatistik(h, k, HEUTE);

    expect(s.erfuellteTage).toBe(3);
    expect(s.einheitenGesamt).toBe(12);
    expect(s.aktuelleStreak).toEqual({ wert: 2, einheit: 'tage' });
    expect(s.laengsteStreak).toBe(2);
    expect(s.quote7.ist).toBe(3);
    expect(s.quote7.soll).toBe(4); // 18. bis 21.9., heute noch offen
  });

  it('ignoriert Eintraege in der Zukunft', () => {
    const k = karte(['2026-09-21', '2026-09-30']);
    const s = berechneStatistik(habit(), k, HEUTE);
    expect(s.erfuellteTage).toBe(1);
    expect(s.einheitenGesamt).toBe(1);
  });
});

describe('formatiereProzent', () => {
  it('rundet auf ganze Prozent', () => {
    expect(formatiereProzent(0)).toBe('0 %');
    expect(formatiereProzent(0.714)).toBe('71 %');
    expect(formatiereProzent(1)).toBe('100 %');
  });
});
