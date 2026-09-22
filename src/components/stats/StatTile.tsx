import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  wert: ReactNode;
  hinweis?: string;
}

export function StatTile({ label, wert, hinweis }: StatTileProps) {
  return (
    <div className="bg-vertiefung rounded-xl px-3 py-2.5">
      <div className="text-schwach text-[11px]">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{wert}</div>
      {hinweis && <div className="text-schwach text-[10px]">{hinweis}</div>}
    </div>
  );
}
