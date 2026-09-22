import { WOCHENTAG_KURZ, WOCHENTAG_LANG, type Frequenz, type IsoWochentag } from '../../types/models';
import { Stepper } from '../ui/Stepper';

const TYPEN = [
  { id: 'taeglich', label: 'Täglich' },
  { id: 'wochentage', label: 'Wochentage' },
  { id: 'malProWoche', label: 'X / Woche' },
] as const;

const ALLE_TAGE: IsoWochentag[] = [1, 2, 3, 4, 5, 6, 7];

interface FrequencyPickerProps {
  wert: Frequenz;
  onAendern: (frequenz: Frequenz) => void;
}

export function FrequencyPicker({ wert, onAendern }: FrequencyPickerProps) {
  const wechsleTyp = (typ: Frequenz['typ']) => {
    if (typ === wert.typ) return;
    if (typ === 'wochentage') {
      onAendern({ typ, wochentage: wert.wochentage?.length ? wert.wochentage : [1, 2, 3, 4, 5] });
    } else if (typ === 'malProWoche') {
      onAendern({ typ, malProWoche: wert.malProWoche ?? 3 });
    } else {
      onAendern({ typ: 'taeglich' });
    }
  };

  const schalteTag = (tag: IsoWochentag) => {
    const bisher = wert.wochentage ?? [];
    const neu = bisher.includes(tag) ? bisher.filter((t) => t !== tag) : [...bisher, tag].sort();
    onAendern({ ...wert, wochentage: neu });
  };

  return (
    <div>
      <div className="bg-vertiefung flex rounded-xl p-1">
        {TYPEN.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => wechsleTyp(id)}
            className={`h-9 flex-1 rounded-lg text-xs font-medium transition ${
              wert.typ === id ? 'bg-karte text-text shadow-sm' : 'text-leise'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {wert.typ === 'wochentage' && (
        <div className="mt-3">
          <div className="flex gap-1.5" role="group" aria-label="Geplante Wochentage">
            {ALLE_TAGE.map((tag) => {
              const aktiv = (wert.wochentage ?? []).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={aktiv}
                  aria-label={WOCHENTAG_LANG[tag]}
                  onClick={() => schalteTag(tag)}
                  className={`h-11 flex-1 rounded-lg text-xs font-medium transition ${
                    aktiv ? 'bg-akzent text-white' : 'bg-vertiefung text-leise'
                  }`}
                >
                  {WOCHENTAG_KURZ[tag]}
                </button>
              );
            })}
          </div>
          {(wert.wochentage ?? []).length === 0 && (
            <p className="text-gefahr mt-2 text-xs">Wähle mindestens einen Tag aus.</p>
          )}
        </div>
      )}

      {wert.typ === 'malProWoche' && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-leise text-sm">Tage pro Woche</span>
          <Stepper
            wert={wert.malProWoche ?? 3}
            min={1}
            max={7}
            onAendern={(neu) => onAendern({ ...wert, malProWoche: neu })}
          />
        </div>
      )}

      {wert.typ === 'taeglich' && (
        <p className="text-schwach mt-2 text-xs">Jeder Tag zählt zur Serie.</p>
      )}
    </div>
  );
}
