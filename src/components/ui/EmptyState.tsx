import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  titel: string;
  text: string;
  aktion?: ReactNode;
}

export function EmptyState({ icon, titel, text, aktion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="text-schwach bg-karte border-rand mb-4 flex size-16 items-center justify-center rounded-2xl border">
        {icon}
      </div>
      <h2 className="text-base font-semibold">{titel}</h2>
      <p className="text-leise mt-1 max-w-xs text-sm leading-relaxed">{text}</p>
      {aktion && <div className="mt-6 w-full max-w-xs">{aktion}</div>}
    </div>
  );
}
