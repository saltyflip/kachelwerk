import { ShieldAlert, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BackupHinweisProps {
  tage: number | undefined;
  onSpaeter: () => void;
}

export function BackupHinweis({ tage, onSpaeter }: BackupHinweisProps) {
  return (
    <div className="border-rand bg-karte mb-3 flex items-start gap-3 rounded-2xl border p-3.5">
      <ShieldAlert size={18} className="text-akzent mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          {tage === undefined
            ? 'Du hast noch keine Sicherung erstellt.'
            : `Deine letzte Sicherung ist ${tage} Tage her.`}
        </p>
        <p className="text-leise mt-0.5 text-xs leading-snug">
          Alle Daten liegen nur auf diesem Gerät.{' '}
          <Link to="/einstellungen" className="text-akzent underline underline-offset-2">
            Jetzt exportieren
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={onSpaeter}
        aria-label="Später erinnern"
        className="text-schwach hover:text-text -mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full transition"
      >
        <X size={16} />
      </button>
    </div>
  );
}
