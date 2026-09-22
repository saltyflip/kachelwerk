import { farbeHex, mitDeckkraft } from '../../lib/colors';
import type { WochentagsWert } from '../../lib/stats';
import { WOCHENTAG_KURZ, WOCHENTAG_LANG } from '../../types/models';

interface WeekdayBarChartProps {
  werte: WochentagsWert[];
  farbe: string;
}

export function WeekdayBarChart({ werte, farbe }: WeekdayBarChartProps) {
  const hoechst = Math.max(1, ...werte.map((w) => w.erfuellt));
  const hex = farbeHex(farbe);

  return (
    <div className="flex h-28 items-end gap-1.5">
      {werte.map((wert) => {
        const anteil = wert.erfuellt / hoechst;
        return (
          <div key={wert.tag} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-schwach text-[10px] tabular-nums">{wert.erfuellt}</span>
            <div className="bg-vertiefung flex w-full flex-1 items-end overflow-hidden rounded-md">
              <div
                className="w-full rounded-md"
                title={`${WOCHENTAG_LANG[wert.tag]}: ${wert.erfuellt} erfüllt`}
                style={{
                  height: `${Math.max(anteil * 100, wert.erfuellt > 0 ? 8 : 0)}%`,
                  backgroundColor: wert.erfuellt > 0 ? hex : mitDeckkraft(hex, 0.2),
                }}
              />
            </div>
            <span className="text-schwach text-[10px]">{WOCHENTAG_KURZ[wert.tag]}</span>
          </div>
        );
      })}
    </div>
  );
}
