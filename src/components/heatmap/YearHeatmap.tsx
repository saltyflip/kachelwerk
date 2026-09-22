import { useEffect, useRef } from 'react';
import { farbeHex, mitDeckkraft } from '../../lib/colors';
import { formatiereKurz } from '../../lib/dates';
import { monatsMarken, type Kachel } from '../../lib/heatmap';

const DECKKRAFT = [0, 0.3, 0.52, 0.76, 1] as const;
const KACHEL = 11;
const ABSTAND = 3;
const SPALTE = KACHEL + ABSTAND;
const ZEILEN_LABEL = ['Mo', '', 'Mi', '', 'Fr', '', 'So'];

interface YearHeatmapProps {
  gitter: Kachel[][];
  farbe: string;
}

/** Ganzjahresansicht: waagrecht scrollbar, startet am aktuellen Ende. */
export function YearHeatmap({ gitter, farbe }: YearHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hex = farbeHex(farbe);
  const marken = monatsMarken(gitter);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [gitter]);

  return (
    <div className="flex gap-1.5">
      <div
        className="text-schwach flex shrink-0 flex-col justify-between pt-5 text-[9px] leading-none"
        aria-hidden
      >
        {ZEILEN_LABEL.map((label, i) => (
          <span key={i} style={{ height: KACHEL, lineHeight: `${KACHEL}px` }}>
            {label}
          </span>
        ))}
      </div>

      <div ref={scrollRef} className="keine-scrollbar flex-1 overflow-x-auto">
        <div style={{ width: gitter.length * SPALTE }}>
          <div className="text-schwach relative mb-1 h-4 text-[9px]" aria-hidden>
            {marken.map((marke) => (
              <span
                key={`${marke.kuerzel}-${marke.spalte}`}
                className="absolute top-0"
                style={{ left: marke.spalte * SPALTE }}
              >
                {marke.kuerzel}
              </span>
            ))}
          </div>

          <div
            className="grid grid-flow-col"
            style={{
              gap: ABSTAND,
              gridTemplateRows: `repeat(7, ${KACHEL}px)`,
              gridTemplateColumns: `repeat(${gitter.length}, ${KACHEL}px)`,
            }}
            role="img"
            aria-label="Verlauf der letzten zwölf Monate"
          >
            {gitter.flat().map((kachel) =>
              kachel.zukunft ? (
                <div key={kachel.datum} />
              ) : (
                <div
                  key={kachel.datum}
                  title={`${formatiereKurz(kachel.datum)}: ${kachel.anzahl}x`}
                  className={`rounded-[2.5px] ${
                    kachel.stufe > 0
                      ? ''
                      : kachel.vorStart
                        ? 'bg-vertiefung/40'
                        : kachel.geplant
                          ? 'bg-vertiefung'
                          : 'bg-vertiefung/50'
                  }`}
                  style={
                    kachel.stufe > 0
                      ? { backgroundColor: mitDeckkraft(hex, DECKKRAFT[kachel.stufe]) }
                      : undefined
                  }
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
