import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HabitIcon } from '../components/habit/HabitIcon';
import { MiniHeatmap } from '../components/heatmap/MiniHeatmap';
import { PageHeader } from '../components/layout/PageHeader';
import { RateRing } from '../components/stats/RateRing';
import { StatTile } from '../components/stats/StatTile';
import { EmptyState } from '../components/ui/EmptyState';
import { Karte } from '../components/ui/Karte';
import { useAktiveHabits, useAlleAnzahlKarten } from '../hooks/useHabits';
import { useHeute } from '../hooks/useHeute';
import { farbeHex } from '../lib/colors';
import { wochenStart, wochenTage } from '../lib/dates';
import { baueSammelGitter } from '../lib/heatmap';
import { erfolgsquote, formatiereProzent } from '../lib/stats';
import { aktuelleStreak, istErfuellt, istGeplant, type StreakErgebnis } from '../lib/streak';
import { WOCHENTAG_KURZ, type IsoWochentag } from '../types/models';

const SAMMEL_WOCHEN = 20;
const LEERE_KARTE = new Map<string, number>();

export default function StatsOverviewPage() {
  const habits = useAktiveHabits();
  const karten = useAlleAnzahlKarten();
  const heuteSchluessel = useHeute();

  const daten = useMemo(() => {
    if (!habits || !karten) return undefined;

    const heuteGeplant = habits.filter((h) => istGeplant(h.frequenz, heuteSchluessel));
    const heuteErledigt = heuteGeplant.filter((h) =>
      istErfuellt(h, heuteSchluessel, karten.get(h.id) ?? LEERE_KARTE),
    );

    // Je Tag: wie viele der geplanten Gewohnheiten waren erfuellt
    const sammelWerte = new Map<string, number>();
    for (const habit of habits) {
      const karte = karten.get(habit.id) ?? LEERE_KARTE;
      for (const [datum, anzahl] of karte) {
        if (anzahl >= Math.max(1, habit.zielProTag)) {
          sammelWerte.set(datum, (sammelWerte.get(datum) ?? 0) + 1);
        }
      }
    }

    const zeilen = habits
      .map((habit) => {
        const karte = karten.get(habit.id) ?? LEERE_KARTE;
        return {
          habit,
          streak: aktuelleStreak(habit, karte, heuteSchluessel),
          quote30: erfolgsquote(habit, karte, 30, heuteSchluessel),
          heuteFertig: istErfuellt(habit, heuteSchluessel, karte),
        };
      })
      .sort((a, b) => b.quote30.quote - a.quote30.quote);

    const wocheStart = wochenStart(heuteSchluessel);
    const woche = wochenTage(wocheStart).map((datum) => ({
      datum,
      tag: (wochenTage(wocheStart).indexOf(datum) + 1) as IsoWochentag,
      erledigt: sammelWerte.get(datum) ?? 0,
      geplant: habits.filter((h) => istGeplant(h.frequenz, datum)).length,
      zukunft: datum > heuteSchluessel,
    }));

    const besteSerie: StreakErgebnis = zeilen.reduce<StreakErgebnis>(
      (max, z) => (z.streak.wert > max.wert ? z.streak : max),
      { wert: 0, einheit: 'tage' },
    );

    return {
      heuteGeplant: heuteGeplant.length,
      heuteErledigt: heuteErledigt.length,
      sammelWerte,
      zeilen,
      woche,
      besteSerie,
      erledigungenGesamt: [...karten.values()].reduce(
        (summe, karte) => summe + [...karte.values()].reduce((s, a) => s + a, 0),
        0,
      ),
    };
  }, [habits, karten, heuteSchluessel]);

  const sammelGitter = useMemo(
    () =>
      daten
        ? baueSammelGitter(daten.sammelWerte, Math.max(1, habits?.length ?? 1), {
            wochen: SAMMEL_WOCHEN,
            heuteSchluessel,
          })
        : [],
    [daten, habits?.length, heuteSchluessel],
  );

  if (!habits || !karten || !daten) {
    return (
      <>
        <PageHeader titel="Statistik" />
        <div className="flex flex-col gap-3 px-4" aria-hidden>
          <div className="border-rand bg-karte h-36 animate-pulse rounded-2xl border" />
          <div className="border-rand bg-karte h-40 animate-pulse rounded-2xl border" />
        </div>
      </>
    );
  }

  if (habits.length === 0) {
    return (
      <>
        <PageHeader titel="Statistik" />
        <EmptyState
          icon={<BarChart3 size={26} />}
          titel="Noch nichts auszuwerten"
          text="Sobald du Gewohnheiten anlegst und abhakst, siehst du hier deinen Gesamtverlauf."
        />
      </>
    );
  }

  const tagesAnteil = daten.heuteGeplant === 0 ? 1 : daten.heuteErledigt / daten.heuteGeplant;

  return (
    <>
      <PageHeader titel="Statistik" untertitel={`${habits.length} aktive Gewohnheiten`} />

      <div className="flex flex-col gap-3 px-4 pb-6">
        <Karte titel="Heute">
          <div className="flex items-center gap-5">
            <RateRing
              anteil={tagesAnteil}
              beschriftung={`${daten.heuteErledigt}/${daten.heuteGeplant}`}
              unterschrift={formatiereProzent(tagesAnteil)}
            />
            <div className="flex flex-1 flex-col gap-2">
              <StatTile
                label="Beste laufende Serie"
                wert={`🔥 ${daten.besteSerie.wert}`}
                hinweis={daten.besteSerie.einheit === 'wochen' ? 'Wochen' : 'Tage'}
              />
              <StatTile label="Erledigungen gesamt" wert={daten.erledigungenGesamt} />
            </div>
          </div>

          <div className="mt-4 flex gap-1.5">
            {daten.woche.map((tag) => (
              <div key={tag.datum} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium tabular-nums ${
                    tag.zukunft
                      ? 'bg-vertiefung/40 text-schwach'
                      : tag.erledigt > 0
                        ? 'bg-akzent text-white'
                        : 'bg-vertiefung text-schwach'
                  }`}
                >
                  {tag.zukunft ? '·' : tag.erledigt}
                </div>
                <span className="text-schwach text-[10px]">{WOCHENTAG_KURZ[tag.tag]}</span>
              </div>
            ))}
          </div>
        </Karte>

        <Karte titel={`Alle Gewohnheiten · ${SAMMEL_WOCHEN} Wochen`}>
          <MiniHeatmap gitter={sammelGitter} farbe="indigo" />
          <p className="text-schwach mt-2 text-[11px]">
            Je kräftiger die Kachel, desto mehr Gewohnheiten hast du an diesem Tag erledigt.
          </p>
        </Karte>

        <Karte titel="Rangliste · letzte 30 Tage">
          <ul className="flex flex-col gap-3">
            {daten.zeilen.map(({ habit, quote30, streak, heuteFertig }) => (
              <li key={habit.id}>
                <Link to={`/habit/${habit.id}`} className="block">
                  <div className="mb-1 flex items-center gap-2">
                    <HabitIcon icon={habit.icon} farbe={habit.farbe} groesse={16} />
                    <span className="min-w-0 flex-1 truncate text-sm">{habit.name}</span>
                    {streak.wert > 0 && (
                      <span className="text-schwach text-[11px] tabular-nums">
                        🔥 {streak.wert}
                      </span>
                    )}
                    <span className="text-leise w-10 text-right text-xs font-medium tabular-nums">
                      {formatiereProzent(quote30.quote)}
                    </span>
                    <span
                      className={`size-2 shrink-0 rounded-full ${heuteFertig ? '' : 'bg-vertiefung'}`}
                      style={heuteFertig ? { backgroundColor: farbeHex(habit.farbe) } : undefined}
                      title={heuteFertig ? 'Heute erledigt' : 'Heute offen'}
                    />
                  </div>
                  <div className="bg-vertiefung h-1.5 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(quote30.quote * 100)}%`,
                        backgroundColor: farbeHex(habit.farbe),
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Karte>
      </div>
    </>
  );
}
