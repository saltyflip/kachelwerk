import { useState, type ReactNode } from 'react';
import { aktualisiereHabit, erstelleHabit } from '../../db/repo';
import { STANDARD_FARBE } from '../../lib/colors';
import { STANDARD_ICON } from '../../lib/icons';
import type { Frequenz, Habit } from '../../types/models';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Stepper } from '../ui/Stepper';
import { CardPreview } from './CardPreview';
import { ColorPicker } from './ColorPicker';
import { FrequencyPicker } from './FrequencyPicker';
import { IconPicker } from './IconPicker';

interface HabitSheetProps {
  offen: boolean;
  /** Gesetzt: Bearbeiten. Nicht gesetzt: Neu anlegen. */
  habit?: Habit;
  onSchliessen: () => void;
  onGespeichert?: (name: string, neu: boolean) => void;
}

interface Formular {
  name: string;
  beschreibung: string;
  icon: string;
  farbe: string;
  zielProTag: number;
  frequenz: Frequenz;
}

function startwerte(habit?: Habit): Formular {
  return {
    name: habit?.name ?? '',
    beschreibung: habit?.beschreibung ?? '',
    icon: habit?.icon ?? STANDARD_ICON,
    farbe: habit?.farbe ?? STANDARD_FARBE,
    zielProTag: habit?.zielProTag ?? 1,
    frequenz: habit?.frequenz ?? { typ: 'taeglich' },
  };
}

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="pt-5">
      <h3 className="text-schwach mb-2 text-xs font-medium tracking-wide uppercase">{titel}</h3>
      {children}
    </section>
  );
}

/**
 * Das Formular haelt seinen Zustand lokal. Damit es bei jedem Oeffnen frisch
 * startet, vergibt die aufrufende Seite einen wechselnden key - so bleibt die
 * Schliessanimation erhalten, ohne dass alte Eingaben zurueckkehren.
 */
export function HabitSheet({ offen, habit, onSchliessen, onGespeichert }: HabitSheetProps) {
  const [form, setForm] = useState<Formular>(() => startwerte(habit));
  const [speichert, setSpeichert] = useState(false);

  const aendere = <K extends keyof Formular>(feld: K, wert: Formular[K]) =>
    setForm((bisher) => ({ ...bisher, [feld]: wert }));

  const wochentageFehlen =
    form.frequenz.typ === 'wochentage' && (form.frequenz.wochentage ?? []).length === 0;
  const gueltig = form.name.trim().length > 0 && !wochentageFehlen;

  const speichern = async () => {
    if (!gueltig || speichert) return;
    setSpeichert(true);
    const daten = {
      name: form.name.trim(),
      beschreibung: form.beschreibung.trim() || undefined,
      icon: form.icon,
      farbe: form.farbe,
      zielProTag: form.zielProTag,
      frequenz: form.frequenz,
    };
    try {
      if (habit) {
        await aktualisiereHabit(habit.id, daten);
      } else {
        await erstelleHabit(daten);
      }
      onGespeichert?.(daten.name, !habit);
      onSchliessen();
    } finally {
      setSpeichert(false);
    }
  };

  return (
    <Sheet
      offen={offen}
      onSchliessen={onSchliessen}
      titel={habit ? 'Gewohnheit bearbeiten' : 'Neue Gewohnheit'}
      fuss={
        <Button groesse="breit" disabled={!gueltig || speichert} onClick={() => void speichern()}>
          {habit ? 'Speichern' : 'Anlegen'}
        </Button>
      }
    >
      <CardPreview
        name={form.name}
        icon={form.icon}
        farbe={form.farbe}
        zielProTag={form.zielProTag}
        frequenz={form.frequenz}
      />

      <Abschnitt titel="Name">
        <input
          autoFocus={!habit}
          value={form.name}
          onChange={(e) => aendere('name', e.target.value)}
          placeholder="z. B. Wasser trinken"
          maxLength={60}
          className="border-rand bg-vertiefung focus:border-akzent h-12 w-full rounded-xl border px-3 text-sm outline-none"
        />
        <textarea
          value={form.beschreibung}
          onChange={(e) => aendere('beschreibung', e.target.value)}
          placeholder="Beschreibung (optional)"
          rows={2}
          maxLength={160}
          className="border-rand bg-vertiefung focus:border-akzent mt-2 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none"
        />
      </Abschnitt>

      <Abschnitt titel="Farbe">
        <ColorPicker wert={form.farbe} onAendern={(farbe) => aendere('farbe', farbe)} />
      </Abschnitt>

      <Abschnitt titel="Icon">
        <IconPicker
          wert={form.icon}
          farbe={form.farbe}
          onAendern={(icon) => aendere('icon', icon)}
        />
      </Abschnitt>

      <Abschnitt titel="Tagesziel">
        <div className="flex items-center justify-between">
          <span className="text-leise text-sm">Erledigungen pro Tag</span>
          <Stepper
            wert={form.zielProTag}
            min={1}
            max={20}
            onAendern={(wert) => aendere('zielProTag', wert)}
          />
        </div>
      </Abschnitt>

      <Abschnitt titel="Frequenz">
        <FrequencyPicker
          wert={form.frequenz}
          onAendern={(frequenz) => aendere('frequenz', frequenz)}
        />
      </Abschnitt>

      <div className="h-4" />
    </Sheet>
  );
}
