import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { baueGitter } from '../../lib/heatmap';
import { aktuelleStreak } from '../../lib/streak';
import type { AnzahlKarte, Habit } from '../../types/models';
import { MiniHeatmap } from '../heatmap/MiniHeatmap';
import { CheckButton } from './CheckButton';
import { HabitIcon } from './HabitIcon';
import { StreakBadge } from './StreakBadge';

export const MINI_WOCHEN = 20;

interface HabitCardProps {
  habit: Habit;
  karte: AnzahlKarte;
  heuteSchluessel: string;
  onTippen: (habit: Habit) => void;
  onZuruecksetzen: (habit: Habit) => void;
  /** Griff fuer Drag & Drop, wird in Phase 6 gesetzt. */
  griff?: ReactNode;
}

export function HabitCard({
  habit,
  karte,
  heuteSchluessel,
  onTippen,
  onZuruecksetzen,
  griff,
}: HabitCardProps) {
  const gitter = useMemo(
    () => baueGitter(habit, karte, { wochen: MINI_WOCHEN, heuteSchluessel }),
    [habit, karte, heuteSchluessel],
  );
  const streak = useMemo(
    () => aktuelleStreak(habit, karte, heuteSchluessel),
    [habit, karte, heuteSchluessel],
  );

  const heuteAnzahl = karte.get(heuteSchluessel) ?? 0;

  return (
    <article className="border-rand bg-karte flex items-center gap-3 rounded-2xl border p-3.5">
      <div className="min-w-0 flex-1">
        <div className="mb-2.5 flex items-center gap-2">
          {griff}
          <Link
            to={`/habit/${habit.id}`}
            className="flex min-w-0 flex-1 items-center gap-2"
            aria-label={`${habit.name} - Details anzeigen`}
          >
            <HabitIcon icon={habit.icon} farbe={habit.farbe} groesse={18} />
            <span className="truncate text-sm font-medium">{habit.name}</span>
          </Link>
          <StreakBadge streak={streak} />
        </div>

        <MiniHeatmap gitter={gitter} farbe={habit.farbe} />
      </div>

      <CheckButton
        anzahl={heuteAnzahl}
        zielProTag={habit.zielProTag}
        farbe={habit.farbe}
        name={habit.name}
        onTippen={() => onTippen(habit)}
        onZuruecksetzen={heuteAnzahl > 0 ? () => onZuruecksetzen(habit) : undefined}
      />
    </article>
  );
}
