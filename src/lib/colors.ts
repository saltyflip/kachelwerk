export interface Palettenfarbe {
  key: string;
  name: string;
  hex: string;
}

/** 16 Akzentfarben zur Auswahl je Habit. */
export const PALETTE: readonly Palettenfarbe[] = [
  { key: 'tomate', name: 'Tomate', hex: '#ef4444' },
  { key: 'koralle', name: 'Koralle', hex: '#fb7185' },
  { key: 'mandarine', name: 'Mandarine', hex: '#f97316' },
  { key: 'bernstein', name: 'Bernstein', hex: '#f59e0b' },
  { key: 'gold', name: 'Gold', hex: '#eab308' },
  { key: 'limette', name: 'Limette', hex: '#84cc16' },
  { key: 'smaragd', name: 'Smaragd', hex: '#22c55e' },
  { key: 'jade', name: 'Jade', hex: '#10b981' },
  { key: 'tuerkis', name: 'Türkis', hex: '#14b8a6' },
  { key: 'himmel', name: 'Himmel', hex: '#0ea5e9' },
  { key: 'azur', name: 'Azur', hex: '#3b82f6' },
  { key: 'indigo', name: 'Indigo', hex: '#6366f1' },
  { key: 'violett', name: 'Violett', hex: '#8b5cf6' },
  { key: 'flieder', name: 'Flieder', hex: '#a855f7' },
  { key: 'magenta', name: 'Magenta', hex: '#d946ef' },
  { key: 'rose', name: 'Rose', hex: '#f43f5e' },
] as const;

export const STANDARD_FARBE = 'smaragd';

const NACH_KEY = new Map(PALETTE.map((f) => [f.key, f]));

export function istPalettenfarbe(key: string): boolean {
  return NACH_KEY.has(key);
}

export function farbeHex(key: string): string {
  return NACH_KEY.get(key)?.hex ?? NACH_KEY.get(STANDARD_FARBE)!.hex;
}

export function farbeName(key: string): string {
  return NACH_KEY.get(key)?.name ?? key;
}

/** Hex-Farbe mit Deckkraft als rgba()-String, z. B. für Heatmap-Kacheln. */
export function mitDeckkraft(hex: string, deckkraft: number): string {
  const wert = hex.replace('#', '');
  const r = parseInt(wert.slice(0, 2), 16);
  const g = parseInt(wert.slice(2, 4), 16);
  const b = parseInt(wert.slice(4, 6), 16);
  const a = Math.min(1, Math.max(0, deckkraft));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
