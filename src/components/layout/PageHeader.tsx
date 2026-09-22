import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  titel: string;
  untertitel?: string;
  zurueck?: boolean;
  aktion?: ReactNode;
}

export function PageHeader({ titel, untertitel, zurueck = false, aktion }: PageHeaderProps) {
  const navigiere = useNavigate();

  return (
    <header className="bg-flaeche/90 pt-sicher sticky top-0 z-30 backdrop-blur">
      <div className="flex items-center gap-2 px-4 pt-2 pb-3">
        {zurueck && (
          <button
            type="button"
            onClick={() => navigiere(-1)}
            aria-label="Zurück"
            className="text-leise hover:bg-vertiefung hover:text-text -ml-2 flex size-11 shrink-0 items-center justify-center rounded-full transition"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{titel}</h1>
          {untertitel && <p className="text-leise truncate text-xs">{untertitel}</p>}
        </div>
        {aktion}
      </div>
    </header>
  );
}
