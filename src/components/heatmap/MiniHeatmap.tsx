import type { CSSProperties } from 'react';
import { farbeHex, mitDeckkraft } from '../../lib/colors';
import type { Kachel } from '../../lib/heatmap';
import { formatiereKurz } from '../../lib/dates';

/** Deckkraft je Intensitaetsstufe (0 = leer). */
const DECKKRAFT = [0, 0.3, 0.52, 0.76, 1] as const;

interface MiniHeatmapProps {
  gitter: Kachel[][];
  farbe: string;
  /** Kachelgroesse in px; ohne Angabe fuellen die Kacheln die Breite. */
  kachelGroesse?: number;
  onKachelKlick?: (datum: string) => void;
}

export function MiniHeatmap({ gitter, farbe, kachelGroesse, onKachelKlick }: MiniHeatmapProps) {
  const hex = farbeHex(farbe);
  const spalten = gitter.length;
  const spaltenBreite = kachelGroesse ? `${kachelGroesse}px` : 'minmax(0, 1fr)';

  return (
    <div
      className="grid w-full grid-flow-col gap-[2px]"
      style={{
        gridTemplateColumns: `repeat(${spalten}, ${spaltenBreite})`,
        gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
      }}
      role="img"
      aria-label={`Verlauf der letzten ${spalten} Wochen`}
    >
      {gitter.flat().map((kachel) => (
        <KachelPunkt
          key={kachel.datum}
          kachel={kachel}
          hex={hex}
          onKlick={onKachelKlick}
          groesse={kachelGroesse}
        />
      ))}
    </div>
  );
}

interface KachelPunktProps {
  kachel: Kachel;
  hex: string;
  groesse?: number;
  onKlick?: (datum: string) => void;
}

function KachelPunkt({ kachel, hex, groesse, onKlick }: KachelPunktProps) {
  if (kachel.zukunft) {
    return <div style={groesse ? { width: groesse, height: groesse } : undefined} aria-hidden />;
  }

  const gefuellt = kachel.stufe > 0;
  const stil: CSSProperties = groesse ? { width: groesse, height: groesse } : {};

  if (gefuellt) {
    stil.backgroundColor = mitDeckkraft(hex, DECKKRAFT[kachel.stufe]);
  }

  const leerKlasse = kachel.vorStart
    ? 'bg-vertiefung/40'
    : kachel.geplant
      ? 'bg-vertiefung'
      : 'bg-vertiefung/50';

  const inhalt = (
    <div
      className={`rounded-[2.5px] ${groesse ? '' : 'aspect-square w-full'} ${gefuellt ? '' : leerKlasse}`}
      style={stil}
    />
  );

  if (!onKlick) return inhalt;

  return (
    <button
      type="button"
      onClick={() => onKlick(kachel.datum)}
      title={`${formatiereKurz(kachel.datum)}: ${kachel.anzahl}x`}
      className="rounded-[2.5px]"
    >
      {inhalt}
    </button>
  );
}
