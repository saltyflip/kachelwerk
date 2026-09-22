import { formatiereStreak, type StreakErgebnis } from '../../lib/streak';

export function StreakBadge({ streak }: { streak: StreakErgebnis }) {
  if (streak.wert <= 0) return null;

  return (
    <span
      className="bg-vertiefung text-leise inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
      title={`Aktuelle Serie: ${formatiereStreak(streak)}`}
    >
      <span aria-hidden>🔥</span>
      {streak.wert}
      {streak.einheit === 'wochen' && <span className="text-schwach">W</span>}
    </span>
  );
}
