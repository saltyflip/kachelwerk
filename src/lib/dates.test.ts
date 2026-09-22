import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ausSchluessel,
  datumsSchluessel,
  heute,
  isoWochentag,
  monatsRaster,
  tagesDifferenz,
  tagesSpanne,
  verschiebeTage,
  wochenStart,
  wochenTage,
} from './dates';

afterEach(() => {
  vi.useRealTimers();
});

describe('Zeitzone der Testumgebung', () => {
  it('laeuft in Europe/Vienna', () => {
    // Sonst waeren die Zeitumstellungs-Tests wertlos.
    expect(new Date(2025, 0, 1, 12).getTimezoneOffset()).toBe(-60);
    expect(new Date(2025, 6, 1, 12).getTimezoneOffset()).toBe(-120);
  });
});

describe('datumsSchluessel', () => {
  it('nutzt das lokale Datum statt UTC', () => {
    const kurzNachMitternacht = new Date(2025, 0, 2, 0, 30);
    // toISOString() wuerde hier faelschlich den 1. Januar liefern
    expect(kurzNachMitternacht.toISOString().slice(0, 10)).toBe('2025-01-01');
    expect(datumsSchluessel(kurzNachMitternacht)).toBe('2025-01-02');
  });

  it('bleibt kurz vor Mitternacht beim selben Tag', () => {
    expect(datumsSchluessel(new Date(2025, 5, 30, 23, 59, 59))).toBe('2025-06-30');
  });
});

describe('ausSchluessel', () => {
  it('verankert den Tag um 12 Uhr Ortszeit', () => {
    const datum = ausSchluessel('2025-03-30');
    expect(datum.getFullYear()).toBe(2025);
    expect(datum.getMonth()).toBe(2);
    expect(datum.getDate()).toBe(30);
    expect(datum.getHours()).toBe(12);
  });
});

describe('heute', () => {
  it('liest das aktuelle lokale Datum', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 22, 23, 45));
    expect(heute()).toBe('2026-09-22');
  });
});

describe('verschiebeTage', () => {
  it('springt ueber Monatsgrenzen', () => {
    expect(verschiebeTage('2025-01-31', 1)).toBe('2025-02-01');
    expect(verschiebeTage('2025-02-01', -1)).toBe('2025-01-31');
  });

  it('springt ueber Jahresgrenzen', () => {
    expect(verschiebeTage('2025-12-31', 1)).toBe('2026-01-01');
    expect(verschiebeTage('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('kennt den Schalttag', () => {
    expect(verschiebeTage('2024-02-28', 1)).toBe('2024-02-29');
    expect(verschiebeTage('2024-02-29', 1)).toBe('2024-03-01');
    expect(verschiebeTage('2025-02-28', 1)).toBe('2025-03-01');
  });

  it('ueberspringt die Zeitumstellung im Fruehjahr (23-Stunden-Tag)', () => {
    expect(verschiebeTage('2025-03-29', 1)).toBe('2025-03-30');
    expect(verschiebeTage('2025-03-30', 1)).toBe('2025-03-31');
    expect(verschiebeTage('2025-03-31', -1)).toBe('2025-03-30');
  });

  it('ueberspringt die Zeitumstellung im Herbst (25-Stunden-Tag)', () => {
    expect(verschiebeTage('2025-10-25', 1)).toBe('2025-10-26');
    expect(verschiebeTage('2025-10-26', 1)).toBe('2025-10-27');
    expect(verschiebeTage('2025-10-27', -1)).toBe('2025-10-26');
  });
});

describe('tagesDifferenz', () => {
  it('zaehlt Kalendertage auch ueber Zeitumstellungen', () => {
    expect(tagesDifferenz('2025-03-29', '2025-03-31')).toBe(2);
    expect(tagesDifferenz('2025-10-25', '2025-10-27')).toBe(2);
    expect(tagesDifferenz('2025-12-31', '2026-01-01')).toBe(1);
    expect(tagesDifferenz('2026-01-01', '2025-12-31')).toBe(-1);
  });
});

describe('isoWochentag', () => {
  it('liefert 1 fuer Montag und 7 fuer Sonntag', () => {
    expect(isoWochentag('2026-09-21')).toBe(1);
    expect(isoWochentag('2026-09-22')).toBe(2);
    expect(isoWochentag('2026-09-27')).toBe(7);
  });
});

describe('wochenStart / wochenTage', () => {
  it('beginnt die Woche am Montag', () => {
    expect(wochenStart('2026-09-22')).toBe('2026-09-21');
    expect(wochenStart('2026-09-27')).toBe('2026-09-21');
    expect(wochenStart('2026-09-21')).toBe('2026-09-21');
  });

  it('liefert sieben aufeinanderfolgende Tage', () => {
    expect(wochenTage('2026-09-21')).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ]);
  });

  it('bleibt in der Umstellungswoche siebentaegig', () => {
    expect(wochenTage('2025-10-20')).toHaveLength(7);
    expect(wochenTage('2025-10-20').at(-1)).toBe('2025-10-26');
  });
});

describe('tagesSpanne', () => {
  it('enthaelt Anfang und Ende', () => {
    expect(tagesSpanne('2025-03-28', '2025-04-01')).toEqual([
      '2025-03-28',
      '2025-03-29',
      '2025-03-30',
      '2025-03-31',
      '2025-04-01',
    ]);
  });

  it('liefert bei gleichem Anfang und Ende genau einen Tag', () => {
    expect(tagesSpanne('2026-01-01', '2026-01-01')).toEqual(['2026-01-01']);
  });

  it('liefert nichts, wenn das Ende vor dem Anfang liegt', () => {
    expect(tagesSpanne('2026-01-02', '2026-01-01')).toEqual([]);
  });

  it('zaehlt ein ganzes Jahr korrekt', () => {
    expect(tagesSpanne('2024-01-01', '2024-12-31')).toHaveLength(366);
    expect(tagesSpanne('2025-01-01', '2025-12-31')).toHaveLength(365);
  });
});

describe('monatsRaster', () => {
  it('fuellt die Randwochen mit Nachbartagen auf', () => {
    const raster = monatsRaster(2026, 8); // September 2026, 1. ist ein Dienstag
    expect(raster[0][0]).toBe('2026-08-31');
    expect(raster.every((woche) => woche.length === 7)).toBe(true);
    expect(raster.flat()).toContain('2026-09-30');
  });

  it('startet mit dem Monatsersten, wenn dieser ein Montag ist', () => {
    const raster = monatsRaster(2026, 1); // Februar 2026, 1.2. ist ein Sonntag
    expect(raster[0]).toContain('2026-02-01');
    expect(raster[0][0]).toBe('2026-01-26');
  });
});
