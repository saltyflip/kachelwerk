import { useState } from 'react';
import { farbeHex } from '../../lib/colors';
import { EMOJIS, LUCIDE_SCHLUESSEL, istLucideIcon } from '../../lib/icons';
import { HabitIcon } from '../habit/HabitIcon';

interface IconPickerProps {
  wert: string;
  farbe: string;
  onAendern: (icon: string) => void;
}

export function IconPicker({ wert, farbe, onAendern }: IconPickerProps) {
  const [reiter, setReiter] = useState<'emoji' | 'symbol'>(() =>
    istLucideIcon(wert) ? 'symbol' : 'emoji',
  );

  const auswahl = reiter === 'emoji' ? EMOJIS : LUCIDE_SCHLUESSEL;

  return (
    <div>
      <div className="bg-vertiefung mb-3 flex rounded-xl p-1">
        {(
          [
            ['emoji', 'Emoji'],
            ['symbol', 'Symbole'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setReiter(id)}
            className={`h-9 flex-1 rounded-lg text-xs font-medium transition ${
              reiter === id ? 'bg-karte text-text shadow-sm' : 'text-leise'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto overscroll-contain"
        role="radiogroup"
        aria-label="Icon"
      >
        {auswahl.map((icon) => {
          const aktiv = icon === wert;
          return (
            <button
              key={icon}
              type="button"
              role="radio"
              aria-checked={aktiv}
              aria-label={icon}
              onClick={() => onAendern(icon)}
              className={`flex aspect-square items-center justify-center rounded-lg transition ${
                aktiv ? 'ring-2' : 'bg-vertiefung'
              }`}
              style={
                aktiv
                  ? { backgroundColor: `${farbeHex(farbe)}22`, boxShadow: `inset 0 0 0 2px ${farbeHex(farbe)}` }
                  : undefined
              }
            >
              <HabitIcon icon={icon} farbe={farbe} groesse={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
