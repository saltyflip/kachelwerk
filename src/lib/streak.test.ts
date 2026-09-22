import { describe, expect, it } from 'vitest';
import type { Habit, IsoWochentag } from '../types/models';
import {
  aktuelleStreak,
  formatiereStreak,
  istErfuellt,
  istGeplant,
  laengsteStreak,
  startTag,
  zuAnzahlKarte,
} from './streak';

function habit(teil: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Testgewohnheit',
    icon: '💧',
    farbe: 'smaragd',
    zielProTag: 1,
    frequenz: { typ: 'taeglich' },
    erstelltAm: '2025-01-01T08:00:00.000Z',
    archiviert: false,
    reihenfolge: 0,
    ...teil,
  };
}

/** Kurzschreibweise: Liste von Tagen (je 1x erledigt) oder Datum -> Anzahl. */
function karte(eintraege: string[] | Record<string, number>): Map<string, number> {
  if (Array.isArray(eintraege)) return new Map(eintraege.map((tag) => [tag, 1]));
  return new Map(Object.entries(eintraege));
}

const MO_MI_FR: IsoWochentag[] = [1, 3, 5];

describe('istGeplant', () => {
  it('plant bei taeglich jeden Tag ein', () => {
    expect(istGeplant({ typ: 'taeglich' }, '2026-09-22')).toBe(true);
    expect(istGeplant({ typ: 'taeglich' }, '2026-09-27')).toBe(true);
  });

  it('beruecksichtigt bei Wochentagen nur die gewaehlten Tage', () => {
    const frequenz = { typ: 'wochentage' as const, wochentage: MO_MI_FR };
    expect(istGeplant(frequenz, '2026-09-21')).toBe(true); // Montag
    expect(istGeplant(frequenz, '2026-09-22')).toBe(false); // Dienstag
    expect(istGeplant(frequenz, '2026-09-25')).toBe(true); // Freitag
  });

  it('laesst bei X-mal pro Woche jeden Tag zu', () => {
    expect(istGeplant({ typ: 'malProWoche', malProWoche: 3 }, '2026-09-22')).toBe(true);
  });
});

describe('istErfuellt', () => {
  it('verlangt das volle Tagesziel', () => {
    const h = habit({ zielProTag: 3 });
    expect(istErfuellt(h, '2026-09-22', karte({ '2026-09-22': 2 }))).toBe(false);
    expect(istErfuellt(h, '2026-09-22', karte({ '2026-09-22': 3 }))).toBe(true);
    expect(istErfuellt(h, '2026-09-22', karte({ '2026-09-22': 5 }))).toBe(true);
  });
});

describe('aktuelleStreak - taeglich', () => {
  const h = habit({ erstelltAm: '2026-09-01T08:00:00.000Z' });

  it('zaehlt aufeinanderfolgende Tage bis heute', () => {
    const k = karte(['2026-09-20', '2026-09-21', '2026-09-22']);
    expect(aktuelleStreak(h, k, '2026-09-22')).toEqual({ wert: 3, einheit: 'tage' });
  });

  it('bricht nicht, wenn heute noch offen ist', () => {
    const k = karte(['2026-09-20', '2026-09-21']);
    expect(aktuelleStreak(h, k, '2026-09-22').wert).toBe(2);
  });

  it('bricht, wenn gestern offen geblieben ist', () => {
    const k = karte(['2026-09-19', '2026-09-20', '2026-09-22']);
    expect(aktuelleStreak(h, k, '2026-09-22').wert).toBe(1);
  });

  it('ist null, wenn weder heute noch gestern erledigt wurde', () => {
    const k = karte(['2026-09-18', '2026-09-19']);
    expect(aktuelleStreak(h, k, '2026-09-22').wert).toBe(0);
  });

  it('zaehlt nur volle Tagesziele', () => {
    const drei = habit({ zielProTag: 3, erstelltAm: '2026-09-01T08:00:00.000Z' });
    expect(aktuelleStreak(drei, karte({ '2026-09-21': 3, '2026-09-22': 2 }), '2026-09-22').wert).toBe(1);
    expect(aktuelleStreak(drei, karte({ '2026-09-21': 3, '2026-09-22': 3 }), '2026-09-22').wert).toBe(2);
  });

  it('endet spaetestens am Erstellungstag', () => {
    const neu = habit({ erstelltAm: '2026-09-21T08:00:00.000Z' });
    const k = karte(['2026-09-21', '2026-09-22']);
    expect(aktuelleStreak(neu, k, '2026-09-22').wert).toBe(2);
  });

  it('beruecksichtigt nachgetragene Tage vor der Erstellung', () => {
    const neu = habit({ erstelltAm: '2026-09-22T08:00:00.000Z' });
    const k = karte(['2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22']);
    expect(startTag(neu, k)).toBe('2026-09-19');
    expect(aktuelleStreak(neu, k, '2026-09-22').wert).toBe(4);
  });
});

describe('aktuelleStreak - Monats-, Jahres- und Schaltjahrwechsel', () => {
  it('laeuft ueber den Monatswechsel', () => {
    const h = habit({ erstelltAm: '2026-01-20T08:00:00.000Z' });
    const k = karte(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
    expect(aktuelleStreak(h, k, '2026-02-02').wert).toBe(4);
  });

  it('laeuft ueber den Jahreswechsel', () => {
    const h = habit({ erstelltAm: '2025-12-01T08:00:00.000Z' });
    const k = karte(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
    expect(aktuelleStreak(h, k, '2026-01-02').wert).toBe(4);
  });

  it('kennt den 29. Februar', () => {
    const h = habit({ erstelltAm: '2024-02-01T08:00:00.000Z' });
    const k = karte(['2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01']);
    expect(aktuelleStreak(h, k, '2024-03-01').wert).toBe(4);
  });
});

describe('aktuelleStreak - Zeitumstellung', () => {
  it('bleibt bei der Umstellung auf Sommerzeit intakt', () => {
    const h = habit({ erstelltAm: '2025-03-01T08:00:00.000Z' });
    const k = karte(['2025-03-28', '2025-03-29', '2025-03-30', '2025-03-31']);
    expect(aktuelleStreak(h, k, '2025-03-31').wert).toBe(4);
  });

  it('bleibt bei der Umstellung auf Winterzeit intakt', () => {
    const h = habit({ erstelltAm: '2025-10-01T08:00:00.000Z' });
    const k = karte(['2025-10-24', '2025-10-25', '2025-10-26', '2025-10-27']);
    expect(aktuelleStreak(h, k, '2025-10-27').wert).toBe(4);
  });
});

describe('aktuelleStreak - bestimmte Wochentage', () => {
  const h = habit({
    frequenz: { typ: 'wochentage', wochentage: MO_MI_FR },
    erstelltAm: '2026-09-14T08:00:00.000Z',
  });

  it('laesst nicht geplante Tage die Serie nicht unterbrechen', () => {
    // Mo 14., Mi 16., Fr 18., Mo 21. erledigt - heute ist Dienstag, also kein Plantag
    const k = karte(['2026-09-14', '2026-09-16', '2026-09-18', '2026-09-21']);
    expect(aktuelleStreak(h, k, '2026-09-22')).toEqual({ wert: 4, einheit: 'tage' });
  });

  it('bricht bei einem verpassten geplanten Tag', () => {
    const k = karte(['2026-09-14', '2026-09-18', '2026-09-21']); // Mittwoch fehlt
    expect(aktuelleStreak(h, k, '2026-09-22').wert).toBe(2);
  });

  it('zaehlt an nicht geplanten Tagen erledigte Eintraege nicht mit', () => {
    const k = karte(['2026-09-21', '2026-09-22']); // Dienstag ist nicht geplant
    expect(aktuelleStreak(h, k, '2026-09-22').wert).toBe(1);
  });

  it('gewaehrt auch an geplanten Tagen Kulanz fuer heute', () => {
    const k = karte(['2026-09-16', '2026-09-18', '2026-09-21']);
    // Mittwoch, 23.9. ist geplant, aber noch offen
    expect(aktuelleStreak(h, k, '2026-09-23').wert).toBe(3);
  });
});

describe('aktuelleStreak - X-mal pro Woche', () => {
  const h = habit({
    frequenz: { typ: 'malProWoche', malProWoche: 3 },
    erstelltAm: '2026-09-07T08:00:00.000Z',
  });

  it('zaehlt in Wochen', () => {
    const k = karte([
      // Woche ab 7.9.: drei Tage
      '2026-09-07',
      '2026-09-09',
      '2026-09-11',
      // Woche ab 14.9.: drei Tage
      '2026-09-14',
      '2026-09-16',
      '2026-09-18',
      // laufende Woche ab 21.9.: erst zwei Tage
      '2026-09-21',
      '2026-09-22',
    ]);
    expect(aktuelleStreak(h, k, '2026-09-22')).toEqual({ wert: 2, einheit: 'wochen' });
  });

  it('zaehlt die laufende Woche mit, sobald das Ziel erreicht ist', () => {
    const k = karte([
      '2026-09-14',
      '2026-09-16',
      '2026-09-18',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
    ]);
    expect(aktuelleStreak(h, k, '2026-09-23').wert).toBe(2);
  });

  it('bricht bei einer verfehlten abgeschlossenen Woche', () => {
    const k = karte([
      '2026-09-07',
      '2026-09-09',
      '2026-09-11',
      // Woche ab 14.9.: nur zwei Tage
      '2026-09-14',
      '2026-09-16',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
    ]);
    expect(aktuelleStreak(h, k, '2026-09-23').wert).toBe(1);
  });

  it('bewertet die Anfangswoche anteilig', () => {
    // Erst am Freitag angelegt: fuer die Restwoche reicht ein Tag
    const spaet = habit({
      frequenz: { typ: 'malProWoche', malProWoche: 3 },
      erstelltAm: '2026-09-11T08:00:00.000Z',
    });
    const k = karte(['2026-09-12', '2026-09-14', '2026-09-16', '2026-09-18', '2026-09-21']);
    expect(aktuelleStreak(spaet, k, '2026-09-22').wert).toBe(2);
  });
});

describe('laengsteStreak', () => {
  it('findet die laengste vergangene Serie bei taeglich', () => {
    const h = habit({ erstelltAm: '2026-09-01T08:00:00.000Z' });
    const k = karte([
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      // Luecke
      '2026-09-08',
      '2026-09-09',
      '2026-09-22',
    ]);
    expect(laengsteStreak(h, k, '2026-09-22')).toBe(5);
  });

  it('zaehlt bei Wochentagen nur geplante Tage', () => {
    const h = habit({
      frequenz: { typ: 'wochentage', wochentage: MO_MI_FR },
      erstelltAm: '2026-09-07T08:00:00.000Z',
    });
    const k = karte(['2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14']);
    expect(laengsteStreak(h, k, '2026-09-22')).toBe(4);
  });

  it('ist nie kleiner als die aktuelle Serie', () => {
    const h = habit({ erstelltAm: '2026-09-18T08:00:00.000Z' });
    const k = karte(['2026-09-20', '2026-09-21', '2026-09-22']);
    expect(laengsteStreak(h, k, '2026-09-22')).toBe(3);
    expect(aktuelleStreak(h, k, '2026-09-22').wert).toBe(3);
  });

  it('laesst eine offene laufende Woche die Bestmarke nicht kappen', () => {
    const h = habit({
      frequenz: { typ: 'malProWoche', malProWoche: 3 },
      erstelltAm: '2026-09-07T08:00:00.000Z',
    });
    const k = karte([
      '2026-09-07',
      '2026-09-09',
      '2026-09-11',
      '2026-09-14',
      '2026-09-16',
      '2026-09-18',
    ]);
    expect(laengsteStreak(h, k, '2026-09-22')).toBe(2);
  });
});

describe('zuAnzahlKarte', () => {
  it('fasst Eintraege je Tag zusammen', () => {
    const k = zuAnzahlKarte([
      { id: 'a', habitId: 'h1', datum: '2026-09-22', anzahl: 2 },
      { id: 'b', habitId: 'h1', datum: '2026-09-21', anzahl: 1 },
    ]);
    expect(k.get('2026-09-22')).toBe(2);
    expect(k.get('2026-09-21')).toBe(1);
    expect(k.get('2026-09-20')).toBeUndefined();
  });
});

describe('formatiereStreak', () => {
  it('beugt Tage und Wochen', () => {
    expect(formatiereStreak({ wert: 1, einheit: 'tage' })).toBe('1 Tag');
    expect(formatiereStreak({ wert: 12, einheit: 'tage' })).toBe('12 Tage');
    expect(formatiereStreak({ wert: 1, einheit: 'wochen' })).toBe('1 Woche');
    expect(formatiereStreak({ wert: 3, einheit: 'wochen' })).toBe('3 Wochen');
  });
});
