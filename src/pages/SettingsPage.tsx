import { ArchiveRestore, Download, Monitor, Moon, Sun, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { HabitIcon } from '../components/habit/HabitIcon';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Karte } from '../components/ui/Karte';
import {
  SCHLUESSEL_LETZTES_BACKUP,
  alleCompletions,
  alleEinstellungen,
  alleHabits,
  ersetzeAlles,
  loescheHabit,
  schreibeEinstellung,
  setzeAllesZurueck,
  setzeArchiviert,
} from '../db/repo';
import { useArchivierteHabits } from '../hooks/useHabits';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import {
  alsJson,
  baueBackup,
  dateiName,
  pruefeBackup,
  type BackupDatei,
  type Zusammenfassung,
} from '../lib/backup';
import { dateiHerunterladen, dateiLesen } from '../lib/datei';
import { formatiereDatum } from '../lib/dates';
import type { ThemeWahl } from '../types/models';

const THEMES: { id: ThemeWahl; label: string; Icon: typeof Moon }[] = [
  { id: 'dunkel', label: 'Dunkel', Icon: Moon },
  { id: 'hell', label: 'Hell', Icon: Sun },
  { id: 'system', label: 'System', Icon: Monitor },
];

/** "1 Gewohnheit" statt "1 Gewohnheiten". */
function anzahl(wert: number, einzahl: string, mehrzahl: string): string {
  return `${wert} ${wert === 1 ? einzahl : mehrzahl}`;
}

interface ImportVorschau {
  daten: BackupDatei;
  zusammenfassung: Zusammenfassung;
}

export default function SettingsPage() {
  const { theme, setzeTheme } = useTheme();
  const archivierte = useArchivierteHabits();
  const { zeige } = useToast();
  const dateiFeld = useRef<HTMLInputElement>(null);

  const [vorschau, setVorschau] = useState<ImportVorschau | null>(null);
  const [zuruecksetzenOffen, setZuruecksetzenOffen] = useState(false);
  const [loeschKandidat, setLoeschKandidat] = useState<{ id: string; name: string } | null>(null);

  const exportieren = async () => {
    const [habits, completions, einstellungen] = await Promise.all([
      alleHabits(),
      alleCompletions(),
      alleEinstellungen(),
    ]);
    dateiHerunterladen(dateiName(), alsJson(baueBackup(habits, completions, einstellungen)));
    await schreibeEinstellung(SCHLUESSEL_LETZTES_BACKUP, new Date().toISOString());
    zeige(`${anzahl(habits.length, 'Gewohnheit', 'Gewohnheiten')} exportiert`, 'erfolg');
  };

  const dateiGewaehlt = async (datei: File | undefined) => {
    if (!datei) return;
    try {
      const inhalt = await dateiLesen(datei);
      const ergebnis = pruefeBackup(inhalt);
      if (!ergebnis.ok) {
        zeige(ergebnis.fehler, 'fehler');
        return;
      }
      setVorschau({ daten: ergebnis.daten, zusammenfassung: ergebnis.zusammenfassung });
    } catch {
      zeige('Die Datei konnte nicht gelesen werden.', 'fehler');
    } finally {
      if (dateiFeld.current) dateiFeld.current.value = '';
    }
  };

  const importBestaetigen = async () => {
    if (!vorschau) return;
    const { daten } = vorschau;
    await ersetzeAlles(daten.habits, daten.completions, daten.einstellungen);
    setVorschau(null);
    zeige(`${anzahl(daten.habits.length, 'Gewohnheit', 'Gewohnheiten')} wiederhergestellt`, 'erfolg');
  };

  const zuruecksetzen = async () => {
    await setzeAllesZurueck();
    setZuruecksetzenOffen(false);
    zeige('Alle Daten wurden gelöscht');
  };

  return (
    <>
      <PageHeader titel="Einstellungen" />

      <div className="flex flex-col gap-3 px-4 pb-6">
        <Karte titel="Darstellung">
          <div className="bg-vertiefung flex rounded-xl p-1">
            {THEMES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setzeTheme(id)}
                aria-pressed={theme === id}
                className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition ${
                  theme === id ? 'bg-karte text-text shadow-sm' : 'text-leise'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </Karte>

        <Karte titel="Datensicherung">
          <p className="text-leise text-xs leading-relaxed">
            Kachelwerk speichert alles ausschließlich auf diesem Gerät. Löschst du die
            Browserdaten oder wechselst das Gerät, sind die Einträge weg. Sichere sie
            regelmäßig als JSON-Datei.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button groesse="breit" onClick={() => void exportieren()}>
              <Download size={18} /> Daten exportieren
            </Button>
            <Button
              variante="sekundaer"
              groesse="breit"
              onClick={() => dateiFeld.current?.click()}
            >
              <Upload size={18} /> Aus Datei importieren
            </Button>
            <input
              ref={dateiFeld}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => void dateiGewaehlt(e.target.files?.[0])}
            />
          </div>
        </Karte>

        <Karte titel={`Archiv${archivierte?.length ? ` · ${archivierte.length}` : ''}`}>
          {!archivierte || archivierte.length === 0 ? (
            <p className="text-leise text-xs">
              Archivierte Gewohnheiten verschwinden vom Dashboard, ihre Einträge bleiben
              erhalten.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {archivierte.map((habit) => (
                <li key={habit.id} className="flex items-center gap-2">
                  <HabitIcon icon={habit.icon} farbe={habit.farbe} groesse={16} />
                  <span className="min-w-0 flex-1 truncate text-sm">{habit.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      void setzeArchiviert(habit.id, false);
                      zeige(`"${habit.name}" wiederhergestellt`);
                    }}
                    aria-label={`${habit.name} wiederherstellen`}
                    className="text-leise hover:bg-vertiefung hover:text-text flex size-11 items-center justify-center rounded-lg transition"
                  >
                    <ArchiveRestore size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoeschKandidat({ id: habit.id, name: habit.name })}
                    aria-label={`${habit.name} löschen`}
                    className="text-schwach hover:bg-gefahr/10 hover:text-gefahr flex size-11 items-center justify-center rounded-lg transition"
                  >
                    <Trash2 size={17} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Karte>

        <Karte titel="Gefahrenzone">
          <Button variante="gefahr" groesse="breit" onClick={() => setZuruecksetzenOffen(true)}>
            <Trash2 size={18} /> Alle Daten zurücksetzen
          </Button>
        </Karte>

        <p className="text-schwach px-1 text-center text-[11px] leading-relaxed">
          Kachelwerk · lokal, offline und ohne Konto.
          <br />
          Keine Daten verlassen dieses Gerät.
        </p>
      </div>

      <ConfirmDialog
        offen={vorschau !== null}
        titel="Daten ersetzen?"
        text={
          vorschau
            ? [
                `${anzahl(vorschau.zusammenfassung.habits, 'Gewohnheit', 'Gewohnheiten')}${
                  vorschau.zusammenfassung.archivierte > 0
                    ? ` (davon ${vorschau.zusammenfassung.archivierte} archiviert)`
                    : ''
                }`,
                `${anzahl(vorschau.zusammenfassung.eintraege, 'Eintrag', 'Einträge')}, ${anzahl(
                  vorschau.zusammenfassung.erledigungen,
                  'Erledigung',
                  'Erledigungen',
                )}`,
                vorschau.zusammenfassung.vonDatum
                  ? `Zeitraum ${formatiereDatum(vorschau.zusammenfassung.vonDatum, 'd. MMM yyyy')} bis ${formatiereDatum(vorschau.zusammenfassung.bisDatum!, 'd. MMM yyyy')}`
                  : 'Noch keine Einträge enthalten',
                vorschau.zusammenfassung.verworfen > 0
                  ? `${anzahl(vorschau.zusammenfassung.verworfen, 'fehlerhafter Eintrag wird', 'fehlerhafte Einträge werden')} übersprungen.`
                  : '',
                'Der bisherige Bestand wird dabei vollständig ersetzt.',
              ]
                .filter(Boolean)
                .join('\n')
            : ''
        }
        bestaetigenText="Importieren"
        gefaehrlich
        onBestaetigen={() => void importBestaetigen()}
        onAbbrechen={() => setVorschau(null)}
      />

      <ConfirmDialog
        offen={zuruecksetzenOffen}
        titel="Wirklich alles löschen?"
        text="Sämtliche Gewohnheiten, Einträge und Einstellungen werden von diesem Gerät entfernt. Ohne Export lässt sich das nicht rückgängig machen."
        bestaetigenText="Endgültig löschen"
        tippwort="LÖSCHEN"
        gefaehrlich
        onBestaetigen={() => void zuruecksetzen()}
        onAbbrechen={() => setZuruecksetzenOffen(false)}
      />

      <ConfirmDialog
        offen={loeschKandidat !== null}
        titel="Gewohnheit löschen?"
        text={`"${loeschKandidat?.name}" und alle zugehörigen Einträge werden endgültig entfernt.`}
        bestaetigenText="Löschen"
        gefaehrlich
        onBestaetigen={() => {
          if (loeschKandidat) {
            void loescheHabit(loeschKandidat.id);
            zeige(`"${loeschKandidat.name}" gelöscht`);
          }
          setLoeschKandidat(null);
        }}
        onAbbrechen={() => setLoeschKandidat(null)}
      />
    </>
  );
}
