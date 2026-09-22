import type { AnzahlKarte, Completion, Frequenz, Habit } from '../types/models';
import { datumsSchluessel, heute, isoWochentag, verschiebeTage, wochenStart, wochenTage } from './dates';

export type StreakEinheit = 'tage' | 'wochen';

export interface StreakErgebnis {
  wert: number;
  einheit: StreakEinheit;
}

/** Baut aus Completions die Nachschlagekarte Datum -> Anzahl. */
export function zuAnzahlKarte(completions: readonly Completion[]): Map<string, number> {
  const karte = new Map<string, number>();
  for (const eintrag of completions) {
    karte.set(eintrag.datum, (karte.get(eintrag.datum) ?? 0) + eintrag.anzahl);
  }
  return karte;
}

export function einheitFuer(frequenz: Frequenz): StreakEinheit {
  return frequenz.typ === 'malProWoche' ? 'wochen' : 'tage';
}

/** Ist der Tag laut Frequenz ein geplanter Tag? */
export function istGeplant(frequenz: Frequenz, schluessel: string): boolean {
  if (frequenz.typ === 'wochentage') {
    const tage = frequenz.wochentage ?? [];
    return tage.includes(isoWochentag(schluessel));
  }
  // 'taeglich' und 'malProWoche': jeder Tag kommt in Frage
  return true;
}

/** Ein Tag gilt als erfuellt, sobald die Anzahl das Tagesziel erreicht. */
export function istErfuellt(habit: Habit, schluessel: string, karte: AnzahlKarte): boolean {
  const anzahl = karte.get(schluessel) ?? 0;
  return anzahl >= Math.max(1, habit.zielProTag);
}

export function fortschritt(habit: Habit, schluessel: string, karte: AnzahlKarte): number {
  const anzahl = karte.get(schluessel) ?? 0;
  return Math.min(1, anzahl / Math.max(1, habit.zielProTag));
}

/**
 * Frueheste fuer die Auswertung relevante Tagesgrenze: der Erstellungstag,
 * oder - falls Tage davor nachgetragen wurden - der aelteste Eintrag.
 */
export function startTag(habit: Habit, karte: AnzahlKarte): string {
  const erstellt = datumsSchluessel(new Date(habit.erstelltAm));
  let fruehester = erstellt;
  for (const schluessel of karte.keys()) {
    if (schluessel < fruehester) fruehester = schluessel;
  }
  return fruehester;
}

function malProWocheZiel(frequenz: Frequenz): number {
  return Math.min(7, Math.max(1, frequenz.malProWoche ?? 1));
}

/** Anzahl erfuellter Tage einer Woche, Zukunft ausgenommen. */
function erfuellteTageDerWoche(
  habit: Habit,
  karte: AnzahlKarte,
  wochenStartSchluessel: string,
  heuteSchluessel: string,
): number {
  return wochenTage(wochenStartSchluessel).filter(
    (tag) => tag <= heuteSchluessel && istErfuellt(habit, tag, karte),
  ).length;
}

/**
 * Sollwert einer Woche. Volle Wochen verlangen das gesetzte Ziel, die
 * Anfangswoche nur den anteiligen Wert - sonst waere eine am Freitag
 * angelegte Gewohnheit sofort "gerissen".
 */
function wochenSoll(frequenz: Frequenz, wochenStartSchluessel: string, startSchluessel: string): number {
  const ziel = malProWocheZiel(frequenz);
  const verfuegbar = wochenTage(wochenStartSchluessel).filter((tag) => tag >= startSchluessel).length;
  if (verfuegbar >= 7) return ziel;
  return Math.max(1, Math.round((ziel * verfuegbar) / 7));
}

function aktuelleStreakTage(habit: Habit, karte: AnzahlKarte, heuteSchluessel: string): number {
  const grenze = startTag(habit, karte);
  let streak = 0;
  let laufend = heuteSchluessel;

  while (laufend >= grenze) {
    if (istGeplant(habit.frequenz, laufend)) {
      if (istErfuellt(habit, laufend, karte)) {
        streak += 1;
      } else if (laufend === heuteSchluessel) {
        // Kulanz: heute offen bricht die Serie noch nicht
      } else {
        break;
      }
    }
    laufend = verschiebeTage(laufend, -1);
  }

  return streak;
}

function aktuelleStreakWochen(habit: Habit, karte: AnzahlKarte, heuteSchluessel: string): number {
  const grenze = startTag(habit, karte);
  const grenzWoche = wochenStart(grenze);
  const ziel = malProWocheZiel(habit.frequenz);
  let streak = 0;

  // Laufende Woche: erfuellt zaehlt, sonst Kulanz (die Serie laeuft weiter)
  let laufend = wochenStart(heuteSchluessel);
  if (erfuellteTageDerWoche(habit, karte, laufend, heuteSchluessel) >= ziel) {
    streak += 1;
  }
  laufend = verschiebeTage(laufend, -7);

  while (laufend >= grenzWoche) {
    const soll = wochenSoll(habit.frequenz, laufend, grenze);
    if (erfuellteTageDerWoche(habit, karte, laufend, heuteSchluessel) >= soll) {
      streak += 1;
    } else {
      break;
    }
    laufend = verschiebeTage(laufend, -7);
  }

  return streak;
}

export function aktuelleStreak(
  habit: Habit,
  karte: AnzahlKarte,
  heuteSchluessel: string = heute(),
): StreakErgebnis {
  const einheit = einheitFuer(habit.frequenz);
  const wert =
    einheit === 'wochen'
      ? aktuelleStreakWochen(habit, karte, heuteSchluessel)
      : aktuelleStreakTage(habit, karte, heuteSchluessel);
  return { wert, einheit };
}

function laengsteStreakTage(habit: Habit, karte: AnzahlKarte, heuteSchluessel: string): number {
  const grenze = startTag(habit, karte);
  let lauf = 0;
  let maximum = 0;
  let tag = grenze;

  while (tag <= heuteSchluessel) {
    if (istGeplant(habit.frequenz, tag)) {
      if (istErfuellt(habit, tag, karte)) {
        lauf += 1;
        if (lauf > maximum) maximum = lauf;
      } else if (tag !== heuteSchluessel) {
        lauf = 0;
      }
      // heute offen: weder zaehlen noch zuruecksetzen
    }
    tag = verschiebeTage(tag, 1);
  }

  return maximum;
}

function laengsteStreakWochen(habit: Habit, karte: AnzahlKarte, heuteSchluessel: string): number {
  const grenze = startTag(habit, karte);
  const aktuelleWoche = wochenStart(heuteSchluessel);
  const ziel = malProWocheZiel(habit.frequenz);
  let lauf = 0;
  let maximum = 0;
  let woche = wochenStart(grenze);

  while (woche <= aktuelleWoche) {
    const istAktuell = woche === aktuelleWoche;
    const soll = istAktuell ? ziel : wochenSoll(habit.frequenz, woche, grenze);
    if (erfuellteTageDerWoche(habit, karte, woche, heuteSchluessel) >= soll) {
      lauf += 1;
      if (lauf > maximum) maximum = lauf;
    } else if (!istAktuell) {
      lauf = 0;
    }
    woche = verschiebeTage(woche, 7);
  }

  return maximum;
}

export function laengsteStreak(
  habit: Habit,
  karte: AnzahlKarte,
  heuteSchluessel: string = heute(),
): number {
  return einheitFuer(habit.frequenz) === 'wochen'
    ? laengsteStreakWochen(habit, karte, heuteSchluessel)
    : laengsteStreakTage(habit, karte, heuteSchluessel);
}

/** "12 Tage" bzw. "3 Wochen" - fuer das Badge auf der Karte. */
export function formatiereStreak(ergebnis: StreakErgebnis): string {
  if (ergebnis.einheit === 'wochen') {
    return ergebnis.wert === 1 ? '1 Woche' : `${ergebnis.wert} Wochen`;
  }
  return ergebnis.wert === 1 ? '1 Tag' : `${ergebnis.wert} Tage`;
}
