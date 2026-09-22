/** ISO-Wochentag: 1 = Montag ... 7 = Sonntag */
export type IsoWochentag = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WOCHENTAG_KURZ: Record<IsoWochentag, string> = {
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do',
  5: 'Fr',
  6: 'Sa',
  7: 'So',
};

export const WOCHENTAG_LANG: Record<IsoWochentag, string> = {
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
  7: 'Sonntag',
};

export type FrequenzTyp = 'taeglich' | 'wochentage' | 'malProWoche';

export interface Frequenz {
  typ: FrequenzTyp;
  /** Nur bei typ === 'wochentage': geplante ISO-Wochentage (1 = Mo). */
  wochentage?: IsoWochentag[];
  /** Nur bei typ === 'malProWoche': Sollwert 1..7 erfüllte Tage je Woche. */
  malProWoche?: number;
}

export interface Habit {
  id: string;
  name: string;
  beschreibung?: string;
  /** Emoji ("💧") oder Lucide-Icon in der Form "lucide:droplet". */
  icon: string;
  /** Schlüssel aus der Palette in lib/colors.ts, z. B. 'smaragd'. */
  farbe: string;
  /** Wie oft der Habit pro Tag erledigt werden soll (>= 1). */
  zielProTag: number;
  frequenz: Frequenz;
  /** ISO-Zeitstempel der Erstellung. */
  erstelltAm: string;
  archiviert: boolean;
  reihenfolge: number;
}

export interface Completion {
  /** Deterministisch: `${habitId}__${datum}` - macht Schreibvorgaenge idempotent. */
  id: string;
  habitId: string;
  /** Lokales Datum im Format YYYY-MM-DD. */
  datum: string;
  /** Anzahl der Erledigungen an diesem Tag (> 0; bei 0 wird der Eintrag gelöscht). */
  anzahl: number;
}

export type ThemeWahl = 'dunkel' | 'hell' | 'system';

export interface EinstellungsEintrag {
  key: string;
  wert: unknown;
}

/** Für das Anlegen eines Habits benötigte Felder. */
export type HabitEntwurf = Omit<Habit, 'id' | 'erstelltAm' | 'archiviert' | 'reihenfolge'> &
  Partial<Pick<Habit, 'erstelltAm' | 'archiviert' | 'reihenfolge'>>;

/** Tagesschlüssel (YYYY-MM-DD) -> Anzahl. */
export type AnzahlKarte = ReadonlyMap<string, number>;
