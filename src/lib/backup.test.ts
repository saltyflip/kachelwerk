import { describe, expect, it } from 'vitest';
import type { Completion, Habit } from '../types/models';
import { alsJson, baueBackup, dateiName, pruefeBackup, tageSeitBackup } from './backup';

const habit: Habit = {
  id: 'h1',
  name: 'Wasser trinken',
  beschreibung: '3 Gläser',
  icon: '💧',
  farbe: 'himmel',
  zielProTag: 3,
  frequenz: { typ: 'taeglich' },
  erstelltAm: '2026-01-01T08:00:00.000Z',
  archiviert: false,
  reihenfolge: 0,
};

const completion: Completion = {
  id: 'h1__2026-09-22',
  habitId: 'h1',
  datum: '2026-09-22',
  anzahl: 3,
};

describe('Export', () => {
  it('schreibt Kennung, Version und Zeitstempel', () => {
    const backup = baueBackup([habit], [completion], [{ key: 'theme', wert: 'dunkel' }]);
    expect(backup.app).toBe('kachelwerk');
    expect(backup.version).toBe(1);
    expect(Number.isNaN(Date.parse(backup.exportiertAm))).toBe(false);
    expect(alsJson(backup)).toContain('"Wasser trinken"');
  });

  it('benennt die Datei nach dem Tagesdatum', () => {
    expect(dateiName(new Date(2026, 8, 22, 15))).toBe('kachelwerk-backup-2026-09-22.json');
  });
});

describe('pruefeBackup - Rundlauf', () => {
  it('liest wieder ein, was exportiert wurde', () => {
    const json = alsJson(baueBackup([habit], [completion], []));
    const ergebnis = pruefeBackup(json);

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.daten.habits).toEqual([habit]);
    expect(ergebnis.daten.completions).toEqual([completion]);
    expect(ergebnis.zusammenfassung).toMatchObject({
      habits: 1,
      archivierte: 0,
      eintraege: 1,
      erledigungen: 3,
      vonDatum: '2026-09-22',
      bisDatum: '2026-09-22',
      verworfen: 0,
    });
  });

  it('nimmt auch das bereits geparste Objekt entgegen', () => {
    const ergebnis = pruefeBackup(baueBackup([habit], [], []));
    expect(ergebnis.ok).toBe(true);
  });
});

describe('pruefeBackup - Ablehnungen', () => {
  const faelle: [string, unknown][] = [
    ['kein JSON', '{ kaputt'],
    ['kein Objekt', '[]'],
    ['fremde App', JSON.stringify({ app: 'anderetodoapp', version: 1, habits: [], completions: [] })],
    ['neuere Version', JSON.stringify({ app: 'kachelwerk', version: 99, habits: [], completions: [] })],
    ['Gewohnheiten fehlen', JSON.stringify({ app: 'kachelwerk', version: 1, completions: [] })],
    ['Einträge fehlen', JSON.stringify({ app: 'kachelwerk', version: 1, habits: [] })],
  ];

  it.each(faelle)('lehnt ab: %s', (_name, eingabe) => {
    const ergebnis = pruefeBackup(eingabe);
    expect(ergebnis.ok).toBe(false);
    if (ergebnis.ok) return;
    expect(ergebnis.fehler.length).toBeGreaterThan(10);
  });

  it('lehnt Gewohnheiten ohne Namen ab', () => {
    const ergebnis = pruefeBackup({
      app: 'kachelwerk',
      version: 1,
      habits: [{ id: 'x', frequenz: { typ: 'taeglich' } }],
      completions: [],
    });
    expect(ergebnis.ok).toBe(false);
  });

  it('lehnt unbekannte Frequenzen ab', () => {
    const ergebnis = pruefeBackup({
      app: 'kachelwerk',
      version: 1,
      habits: [{ id: 'x', name: 'Test', frequenz: { typ: 'monatlich' } }],
      completions: [],
    });
    expect(ergebnis.ok).toBe(false);
  });

  it('lehnt doppelte Gewohnheits-Ids ab', () => {
    const ergebnis = pruefeBackup({
      app: 'kachelwerk',
      version: 1,
      habits: [habit, { ...habit, name: 'Zwilling' }],
      completions: [],
    });
    expect(ergebnis.ok).toBe(false);
  });
});

describe('pruefeBackup - Reparatur', () => {
  it('ergänzt fehlende Felder mit sinnvollen Vorgaben', () => {
    const ergebnis = pruefeBackup({
      app: 'kachelwerk',
      version: 1,
      habits: [{ id: 'x', name: '  Lesen  ', frequenz: { typ: 'taeglich' } }],
      completions: [],
    });
    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    const [h] = ergebnis.daten.habits;
    expect(h.name).toBe('Lesen');
    expect(h.zielProTag).toBe(1);
    expect(h.archiviert).toBe(false);
    expect(h.icon.length).toBeGreaterThan(0);
    expect(h.farbe.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(h.erstelltAm))).toBe(false);
  });

  it('verwirft verwaiste, doppelte und unsinnige Einträge', () => {
    const ergebnis = pruefeBackup({
      app: 'kachelwerk',
      version: 1,
      habits: [habit],
      completions: [
        completion,
        { habitId: 'h1', datum: '2026-09-22', anzahl: 1 }, // Duplikat
        { habitId: 'gibtsnicht', datum: '2026-09-22', anzahl: 1 },
        { habitId: 'h1', datum: '2026-02-30', anzahl: 1 }, // kein echtes Datum
        { habitId: 'h1', datum: '22.09.2026', anzahl: 1 }, // falsches Format
        { habitId: 'h1', datum: '2026-09-21', anzahl: 0 },
        'kaputt',
      ],
    });

    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.daten.completions).toHaveLength(1);
    expect(ergebnis.zusammenfassung.verworfen).toBe(6);
  });

  it('vergibt die Eintrags-Ids neu', () => {
    const ergebnis = pruefeBackup({
      app: 'kachelwerk',
      version: 1,
      habits: [habit],
      completions: [{ id: 'irgendwas', habitId: 'h1', datum: '2026-09-20', anzahl: 2 }],
    });
    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.daten.completions[0].id).toBe('h1__2026-09-20');
  });

  it('sortiert Wochentage und entfernt Dubletten', () => {
    const ergebnis = pruefeBackup({
      app: 'kachelwerk',
      version: 1,
      habits: [{ id: 'x', name: 'Sport', frequenz: { typ: 'wochentage', wochentage: [5, 1, 5, 9] } }],
      completions: [],
    });
    expect(ergebnis.ok).toBe(true);
    if (!ergebnis.ok) return;
    expect(ergebnis.daten.habits[0].frequenz.wochentage).toEqual([1, 5]);
  });
});

describe('tageSeitBackup', () => {
  it('rechnet die Tage seit der letzten Sicherung', () => {
    const jetzt = new Date(2026, 8, 22, 12);
    expect(tageSeitBackup(new Date(2026, 8, 8, 12).toISOString(), jetzt)).toBe(14);
    expect(tageSeitBackup(new Date(2026, 8, 22, 9).toISOString(), jetzt)).toBe(0);
  });

  it('meldet undefined, wenn es noch keine Sicherung gibt', () => {
    expect(tageSeitBackup(undefined)).toBeUndefined();
    expect(tageSeitBackup('unsinn')).toBeUndefined();
  });
});
