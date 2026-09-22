import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HabitSheet } from '../components/form/HabitSheet';
import { HabitIcon } from '../components/habit/HabitIcon';
import { MonthCalendar } from '../components/heatmap/MonthCalendar';
import { YearHeatmap } from '../components/heatmap/YearHeatmap';
import { PageHeader } from '../components/layout/PageHeader';
import { QuoteBalken } from '../components/stats/QuoteBalken';
import { StatTile } from '../components/stats/StatTile';
import { WeekdayBarChart } from '../components/stats/WeekdayBarChart';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Karte } from '../components/ui/Karte';
import { loescheHabit, setzeAnzahl, setzeArchiviert, tippeHabitAn } from '../db/repo';
import { useAnzahlKarte, useHabit } from '../hooks/useHabits';
import { useHeute } from '../hooks/useHeute';
import { useToast } from '../hooks/useToast';
import { ausSchluessel, datumsSchluessel, formatiereDatum } from '../lib/dates';
import { baueGitter } from '../lib/heatmap';
import { berechneStatistik } from '../lib/stats';
import { formatiereStreak } from '../lib/streak';
import { WOCHENTAG_KURZ, type IsoWochentag } from '../types/models';

const JAHRES_WOCHEN = 53;

export default function HabitDetailPage() {
  const { id } = useParams();
  const navigiere = useNavigate();
  const habit = useHabit(id);
  const karte = useAnzahlKarte(id);
  const heuteSchluessel = useHeute();
  const { zeige } = useToast();

  const heuteDatum = ausSchluessel(heuteSchluessel);
  const [monat, setMonat] = useState({ jahr: heuteDatum.getFullYear(), monat: heuteDatum.getMonth() });
  const [bearbeiten, setBearbeiten] = useState({ offen: false, nr: 0 });
  const [loeschenOffen, setLoeschenOffen] = useState(false);

  const gitter = useMemo(
    () => (habit && karte ? baueGitter(habit, karte, { wochen: JAHRES_WOCHEN, heuteSchluessel }) : []),
    [habit, karte, heuteSchluessel],
  );

  const statistik = useMemo(
    () => (habit && karte ? berechneStatistik(habit, karte, heuteSchluessel) : undefined),
    [habit, karte, heuteSchluessel],
  );

  if (habit === null) {
    return (
      <>
        <PageHeader titel="Nicht gefunden" zurueck />
        <p className="text-leise px-4 text-sm">Diese Gewohnheit gibt es nicht mehr.</p>
      </>
    );
  }

  if (!habit || !karte || !statistik) {
    return (
      <>
        <PageHeader titel="" zurueck />
        <div className="flex flex-col gap-3 px-4" aria-hidden>
          <div className="border-rand bg-karte h-32 animate-pulse rounded-2xl border" />
          <div className="border-rand bg-karte h-64 animate-pulse rounded-2xl border" />
        </div>
      </>
    );
  }

  const frequenzText =
    habit.frequenz.typ === 'taeglich'
      ? habit.zielProTag > 1
        ? `${habit.zielProTag}x täglich`
        : 'Täglich'
      : habit.frequenz.typ === 'wochentage'
        ? (habit.frequenz.wochentage ?? []).map((t) => WOCHENTAG_KURZ[t as IsoWochentag]).join(', ')
        : `${habit.frequenz.malProWoche}x pro Woche`;

  const zielText =
    habit.zielProTag > 1 && habit.frequenz.typ !== 'taeglich' ? ` · ${habit.zielProTag}x pro Tag` : '';

  const archivieren = async () => {
    await setzeArchiviert(habit.id, !habit.archiviert);
    zeige(habit.archiviert ? `"${habit.name}" wiederhergestellt` : `"${habit.name}" archiviert`);
  };

  const loeschen = async () => {
    await loescheHabit(habit.id);
    setLoeschenOffen(false);
    zeige(`"${habit.name}" gelöscht`);
    navigiere('/', { replace: true });
  };

  return (
    <>
      <PageHeader
        titel={habit.name}
        untertitel={`${frequenzText}${zielText}`}
        zurueck
        aktion={
          <button
            type="button"
            onClick={() => setBearbeiten((b) => ({ offen: true, nr: b.nr + 1 }))}
            aria-label="Bearbeiten"
            className="text-leise hover:bg-vertiefung hover:text-text flex size-11 items-center justify-center rounded-full transition"
          >
            <Pencil size={19} />
          </button>
        }
      />

      <div className="flex flex-col gap-3 px-4 pb-6">
        <Karte
          titel="Letzte zwölf Monate"
          aktion={<HabitIcon icon={habit.icon} farbe={habit.farbe} groesse={18} />}
        >
          <YearHeatmap gitter={gitter} farbe={habit.farbe} />
        </Karte>

        <Karte titel="Nachtragen">
          <MonthCalendar
            habit={habit}
            karte={karte}
            heuteSchluessel={heuteSchluessel}
            jahr={monat.jahr}
            monat={monat.monat}
            onMonatWechseln={(jahr, m) => setMonat({ jahr, monat: m })}
            onTagTippen={(datum) => void tippeHabitAn(habit, datum)}
            onTagZuruecksetzen={(datum) => void setzeAnzahl(habit.id, datum, 0)}
          />
        </Karte>

        <Karte titel="Zahlen">
          <div className="grid grid-cols-2 gap-2">
            <StatTile
              label="Aktuelle Serie"
              wert={`🔥 ${statistik.aktuelleStreak.wert}`}
              hinweis={formatiereStreak(statistik.aktuelleStreak)}
            />
            <StatTile
              label="Längste Serie"
              wert={statistik.laengsteStreak}
              hinweis={statistik.aktuelleStreak.einheit === 'wochen' ? 'Wochen' : 'Tage'}
            />
            <StatTile label="Erfüllte Tage" wert={statistik.erfuellteTage} />
            <StatTile
              label="Erledigungen"
              wert={statistik.einheitenGesamt}
              hinweis={`seit ${formatiereDatum(datumsSchluessel(new Date(habit.erstelltAm)), 'd. MMM yyyy')}`}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <QuoteBalken label="Letzte 7 Tage" quote={statistik.quote7} farbe={habit.farbe} />
            <QuoteBalken label="Letzte 30 Tage" quote={statistik.quote30} farbe={habit.farbe} />
            <QuoteBalken label="Letzte 365 Tage" quote={statistik.quote365} farbe={habit.farbe} />
          </div>
        </Karte>

        <Karte titel="Nach Wochentag">
          <WeekdayBarChart werte={statistik.proWochentag} farbe={habit.farbe} />
        </Karte>

        <div className="mt-2 flex flex-col gap-2">
          <Button variante="sekundaer" groesse="breit" onClick={() => void archivieren()}>
            {habit.archiviert ? (
              <>
                <ArchiveRestore size={18} /> Wiederherstellen
              </>
            ) : (
              <>
                <Archive size={18} /> Archivieren
              </>
            )}
          </Button>
          <Button variante="gefahr" groesse="breit" onClick={() => setLoeschenOffen(true)}>
            <Trash2 size={18} /> Löschen
          </Button>
        </div>
      </div>

      <HabitSheet
        key={bearbeiten.nr}
        offen={bearbeiten.offen}
        habit={habit}
        onSchliessen={() => setBearbeiten((b) => ({ ...b, offen: false }))}
        onGespeichert={(name) => zeige(`"${name}" gespeichert`)}
      />

      <ConfirmDialog
        offen={loeschenOffen}
        titel="Gewohnheit löschen?"
        text={`"${habit.name}" und alle ${statistik.einheitenGesamt} Einträge werden endgültig entfernt. Das lässt sich nicht rückgängig machen.`}
        bestaetigenText="Löschen"
        gefaehrlich
        onBestaetigen={() => void loeschen()}
        onAbbrechen={() => setLoeschenOffen(false)}
      />
    </>
  );
}
