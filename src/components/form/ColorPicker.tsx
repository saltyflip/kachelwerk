import { Check } from 'lucide-react';
import { PALETTE } from '../../lib/colors';

interface ColorPickerProps {
  wert: string;
  onAendern: (farbe: string) => void;
}

export function ColorPicker({ wert, onAendern }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2" role="radiogroup" aria-label="Farbe">
      {PALETTE.map((farbe) => {
        const aktiv = farbe.key === wert;
        return (
          <button
            key={farbe.key}
            type="button"
            role="radio"
            aria-checked={aktiv}
            aria-label={farbe.name}
            title={farbe.name}
            onClick={() => onAendern(farbe.key)}
            className="flex aspect-square items-center justify-center rounded-full transition active:scale-92"
            style={{
              backgroundColor: farbe.hex,
              outline: aktiv ? `2px solid ${farbe.hex}` : 'none',
              outlineOffset: 2,
            }}
          >
            {aktiv && <Check size={14} strokeWidth={3.2} className="text-white drop-shadow" />}
          </button>
        );
      })}
    </div>
  );
}
