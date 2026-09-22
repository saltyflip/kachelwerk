import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  wert: number;
  min?: number;
  max?: number;
  einheit?: string;
  onAendern: (wert: number) => void;
}

export function Stepper({ wert, min = 1, max = 99, einheit, onAendern }: StepperProps) {
  const knopf =
    'flex size-11 items-center justify-center rounded-xl bg-vertiefung text-text transition disabled:opacity-35';

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className={knopf}
        disabled={wert <= min}
        onClick={() => onAendern(Math.max(min, wert - 1))}
        aria-label="Weniger"
      >
        <Minus size={18} />
      </button>
      <span className="min-w-16 text-center text-sm font-medium tabular-nums">
        {wert}
        {einheit ? ` ${einheit}` : ''}
      </span>
      <button
        type="button"
        className={knopf}
        disabled={wert >= max}
        onClick={() => onAendern(Math.min(max, wert + 1))}
        aria-label="Mehr"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
