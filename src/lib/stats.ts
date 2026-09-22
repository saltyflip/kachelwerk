import type { AnzahlKarte, Habit, IsoWochentag } from '../types/models';
import { heute, isoWochentag, tagesSpanne, verschiebeTage } from './dates';
import {
  aktuelleStreak,
  einheitFuer,
  istErfuellt,
  istGeplant,
  laengsteStreak,
  startTag,
  type StreakErgebnis,
} from './streak';

export interface Quote {
  ist: number;
  soll: number;
  /** 0..1 */
  quote: number;
}

export interface WochentagsWert {
  tag: IsoWochentag;
  erfuellt: number;
  geplant: number;
}

export interface HabitStatistik {
  aktuelleStreak: StreakErgebnis;
  laengsteStreak: number;
  erfuellteTage: number;
  einheitenGesamt: number;
  quote7: Quote;
  quote30: Quote;
  quote365: Quote;
  proWochentag: WochentagsWert[];
}

/**
 * Das Auswertungsfenster endet heute - ausser der heutige Tag ist geplant und
 * noch offen. Dann zählt er noch nicht mit, analog zur Kulanzregel der Streak.
 */
function fensterEnde(habit: Habit, karte: AnzahlKarte, heuteSchluessel: string): string {
  const zaehltHeute =
    einheitFuer(habit.frequenz) === 'wochen'
      ? istErfuellt(habit, heuteSchluessel, karte)
      : !istGeplant(habit.frequenz, heuteSchluessel) || istErfuellt(habit, heuteSchluessel, karte);
  return zaehltHeute ? heuteSchluessel : verschiebeTage(heuteSchluessel, -1);
}

export function erfolgsquote(
  habit: Habit,
  karte: AnzahlKarte,
  fensterTage: number,
  heuteSchluessel: string = heute(),
): Quote {
  const ende = fensterEnde(habit, karte, heuteSchluessel);
  const grenze = startTag(habit, karte);
  const rohStart = verschiebeTage(ende, -(fensterTage - 1));
  const start = rohStart > grenze ? rohStart : grenze;

  if (ende < start) return { ist: 0, soll: 0, quote: 0 };

  const tage = tagesSpanne(start, ende);

  if (einheitFuer(habit.frequenz) === 'wochen') {
    const zielProWoche = Math.min(7, Math.max(1, habit.frequenz.malProWoche ?? 1));
    const soll = Math.max(1, Math.round((zielProWoche * tage.length) / 7));
    const ist = tage.filter((tag) => istErfuellt(habit, tag, karte)).length;
    return { ist, soll, quote: Math.min(1, ist / soll) };
  }

  const geplante = tage.filter((tag) => istGeplant(habit.frequenz, tag));
  const ist = geplante.filter((tag) => istErfuellt(habit, tag, karte)).length;
  const soll = geplante.length;
  return { ist, soll, quote: soll === 0 ? 0 : Math.min(1, ist / soll) };
}

export function wochentagsVerteilung(
  habit: Habit,
  karte: AnzahlKarte,
  heuteSchluessel: string = heute(),
): WochentagsWert[] {
  const werte: WochentagsWert[] = Array.from({ length: 7 }, (_, i) => ({
    tag: (i + 1) as IsoWochentag,
    erfuellt: 0,
    geplant: 0,
  }));

  for (const tag of tagesSpanne(startTag(habit, karte), heuteSchluessel)) {
    const index = isoWochentag(tag) - 1;
    if (istGeplant(habit.frequenz, tag)) werte[index].geplant += 1;
    if (istErfuellt(habit, tag, karte)) werte[index].erfuellt += 1;
  }

  return werte;
}

export function berechneStatistik(
  habit: Habit,
  karte: AnzahlKarte,
  heuteSchluessel: string = heute(),
): HabitStatistik {
  let erfuellteTage = 0;
  let einheitenGesamt = 0;
  for (const [tag, anzahl] of karte) {
    if (tag > heuteSchluessel) continue;
    einheitenGesamt += anzahl;
    if (anzahl >= Math.max(1, habit.zielProTag)) erfuellteTage += 1;
  }

  return {
    aktuelleStreak: aktuelleStreak(habit, karte, heuteSchluessel),
    laengsteStreak: laengsteStreak(habit, karte, heuteSchluessel),
    erfuellteTage,
    einheitenGesamt,
    quote7: erfolgsquote(habit, karte, 7, heuteSchluessel),
    quote30: erfolgsquote(habit, karte, 30, heuteSchluessel),
    quote365: erfolgsquote(habit, karte, 365, heuteSchluessel),
    proWochentag: wochentagsVerteilung(habit, karte, heuteSchluessel),
  };
}

export function formatiereProzent(quote: number): string {
  return `${Math.round(quote * 100)} %`;
}
