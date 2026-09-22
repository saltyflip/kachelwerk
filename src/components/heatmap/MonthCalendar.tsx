import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { farbeHex, mitDeckkraft } from '../../lib/colors';
import { ausSchluessel, monatsName, monatsRaster } from '../../lib/dates';
import { zuStufe } from '../../lib/heatmap';
import { istGeplant } from '../../lib/streak';
import { WOCHENTAG_KURZ, type AnzahlKarte, type Habit, type IsoWochentag } from '../../types/models';

const DECKKRAFT = [0, 0.3, 0.52, 0.76, 1] as const;

interface MonthCalendarProps {
  habit: Habit;
  karte: AnzahlKarte;
  heuteSchluessel: string;
  jahr: number;
  monat: number;
  onMonatWechseln: (jahr: number, monat: number) => void;
  onTagTippen: (datum: string) => void;
  onTagZuruecksetzen: (datum: string) => void;
}

/**
 * Monatsansicht zum Nachtragen: Antippen zählt hoch, langes Drücken setzt
 * den Tag auf null. Tage in der Zukunft sind gesperrt.
 */
export function MonthCalendar({
  habit,
  karte,
  heuteSchluessel,
  jahr,
  monat,
  onMonatWechseln,
  onTagTippen,
  onTagZuruecksetzen,
}: MonthCalendarProps) {
  const halteTimer = useRef<number | null>(null);
  const langGedrueckt = useRef(false);
  const hex = farbeHex(habit.farbe);
  const wochen = monatsRaster(jahr, monat);

  const heuteDatum = ausSchluessel(heuteSchluessel);
  const istAktuellerMonat = jahr === heuteDatum.getFullYear() && monat === heuteDatum.getMonth();

  const vor = () => {
    const d = new Date(jahr, monat - 1, 1);
    onMonatWechseln(d.getFullYear(), d.getMonth());
  };
  const zurueck = () => {
    const d = new Date(jahr, monat + 1, 1);
    onMonatWechseln(d.getFullYear(), d.getMonth());
  };

  const starteHalten = (datum: string) => {
    langGedrueckt.current = false;
    halteTimer.current = window.setTimeout(() => {
      langGedrueckt.current = true;
      onTagZuruecksetzen(datum);
    }, 500);
  };

  const beendeHalten = () => {
    if (halteTimer.current !== null) {
      window.clearTimeout(halteTimer.current);
      halteTimer.current = null;
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={vor}
          aria-label="Vorheriger Monat"
          className="text-leise hover:bg-vertiefung flex size-9 items-center justify-center rounded-lg transition"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium">{monatsName(jahr, monat)}</span>
        <button
          type="button"
          onClick={zurueck}
          disabled={istAktuellerMonat}
          aria-label="Nächster Monat"
          className="text-leise hover:bg-vertiefung flex size-9 items-center justify-center rounded-lg transition disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="text-schwach mb-1 grid grid-cols-7 gap-1 text-center text-[10px]" aria-hidden>
        {([1, 2, 3, 4, 5, 6, 7] as IsoWochentag[]).map((tag) => (
          <span key={tag}>{WOCHENTAG_KURZ[tag]}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {wochen.flat().map((datum) => {
          const imMonat = ausSchluessel(datum).getMonth() === monat;
          const zukunft = datum > heuteSchluessel;
          const anzahl = karte.get(datum) ?? 0;
          const stufe = zuStufe(Math.min(1, anzahl / Math.max(1, habit.zielProTag)));
          const geplant = istGeplant(habit.frequenz, datum);
          const heute = datum === heuteSchluessel;

          if (!imMonat) return <div key={datum} aria-hidden />;

          return (
            <button
              key={datum}
              type="button"
              disabled={zukunft}
              onClick={() => {
                if (langGedrueckt.current) {
                  langGedrueckt.current = false;
                  return;
                }
                onTagTippen(datum);
              }}
              onPointerDown={() => starteHalten(datum)}
              onPointerUp={beendeHalten}
              onPointerLeave={beendeHalten}
              onContextMenu={(e) => e.preventDefault()}
              aria-label={`${datum}, ${anzahl} von ${habit.zielProTag}`}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-xs tabular-nums transition disabled:opacity-25 ${
                stufe > 0 ? 'font-medium text-white' : geplant ? 'bg-vertiefung' : 'bg-vertiefung/50'
              } ${heute ? 'ring-akzent ring-2' : ''}`}
              style={stufe > 0 ? { backgroundColor: mitDeckkraft(hex, DECKKRAFT[stufe]) } : undefined}
            >
              {ausSchluessel(datum).getDate()}
              {habit.zielProTag > 1 && anzahl > 0 && (
                <span className="absolute right-0.5 bottom-0.5 text-[8px] opacity-80">{anzahl}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-schwach mt-2 text-[11px]">
        Tippen zählt hoch, langes Drücken setzt den Tag zurück.
      </p>
    </div>
  );
}
