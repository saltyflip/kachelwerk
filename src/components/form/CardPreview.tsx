import { useMemo } from 'react';
import { verschiebeTage, wochenStart } from '../../lib/dates';
import { baueGitter } from '../../lib/heatmap';
import type { Frequenz, Habit } from '../../types/models';
import { CheckButton } from '../habit/CheckButton';
import { HabitIcon } from '../habit/HabitIcon';
import { StreakBadge } from '../habit/StreakBadge';
import { MiniHeatmap } from '../heatmap/MiniHeatmap';

const VORSCHAU_WOCHEN = 16;
const HEUTE = '2026-06-16';

/** Festes Muster, damit die Vorschau bei jedem Tastendruck ruhig bleibt. */
const MUSTER = [
  1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1,
  1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0,
  1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1,
  0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1,
];

interface CardPreviewProps {
  name: string;
  icon: string;
  farbe: string;
  zielProTag: number;
  frequenz: Frequenz;
}

export function CardPreview({ name, icon, farbe, zielProTag, frequenz }: CardPreviewProps) {
  const { habit, karte } = useMemo(() => {
    const beispiel: Habit = {
      id: 'vorschau',
      name,
      icon,
      farbe,
      zielProTag,
      frequenz,
      erstelltAm: '2026-01-01T08:00:00.000Z',
      archiviert: false,
      reihenfolge: 0,
    };
    const daten = new Map<string, number>();
    const start = verschiebeTage(wochenStart(HEUTE), -(VORSCHAU_WOCHEN - 1) * 7);
    MUSTER.forEach((treffer, index) => {
      if (!treffer) return;
      daten.set(verschiebeTage(start, index), zielProTag);
    });
    return { habit: beispiel, karte: daten };
  }, [name, icon, farbe, zielProTag, frequenz]);

  const gitter = useMemo(
    () => baueGitter(habit, karte, { wochen: VORSCHAU_WOCHEN, heuteSchluessel: HEUTE }),
    [habit, karte],
  );

  return (
    <div className="border-rand bg-flaeche flex items-center gap-3 rounded-2xl border p-3.5">
      <div className="min-w-0 flex-1">
        <div className="mb-2.5 flex items-center gap-2">
          <HabitIcon icon={icon} farbe={farbe} groesse={18} />
          <span className="truncate text-sm font-medium">{name.trim() || 'Neue Gewohnheit'}</span>
          <div className="ml-auto">
            <StreakBadge streak={{ wert: 12, einheit: frequenz.typ === 'malProWoche' ? 'wochen' : 'tage' }} />
          </div>
        </div>
        <MiniHeatmap gitter={gitter} farbe={farbe} />
      </div>
      <div className="pointer-events-none">
        <CheckButton
          anzahl={zielProTag > 1 ? zielProTag - 1 : 1}
          zielProTag={zielProTag}
          farbe={farbe}
          name="Vorschau"
          onTippen={() => {}}
        />
      </div>
    </div>
  );
}
