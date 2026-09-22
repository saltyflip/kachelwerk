import { LayoutGrid, Plus } from 'lucide-react';
import { useState } from 'react';
import { HabitSheet } from '../components/form/HabitSheet';
import { SortableHabitList } from '../components/habit/SortableHabitList';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { BackupHinweis } from '../components/ui/BackupHinweis';
import { EmptyState } from '../components/ui/EmptyState';
import { setzeAnzahl, setzeReihenfolge, tippeHabitAn } from '../db/repo';
import { useBackupErinnerung } from '../hooks/useBackupErinnerung';
import { useAktiveHabits, useAlleAnzahlKarten } from '../hooks/useHabits';
import { useHeute } from '../hooks/useHeute';
import { useToast } from '../hooks/useToast';
import { formatiereDatum } from '../lib/dates';
import type { Habit } from '../types/models';

export default function DashboardPage() {
  const habits = useAktiveHabits();
  const karten = useAlleAnzahlKarten();
  const heuteSchluessel = useHeute();
  const { zeige } = useToast();
  const backup = useBackupErinnerung();
  const [sheet, setSheet] = useState<{ offen: boolean; nr: number }>({ offen: false, nr: 0 });

  const oeffneAnlegen = () => setSheet((bisher) => ({ offen: true, nr: bisher.nr + 1 }));

  const laedt = habits === undefined || karten === undefined;

  const beiTippen = (habit: Habit) => {
    void tippeHabitAn(habit, heuteSchluessel);
  };

  const beiZuruecksetzen = (habit: Habit) => {
    void setzeAnzahl(habit.id, heuteSchluessel, 0);
    zeige(`${habit.name} für heute zurückgesetzt`);
  };

  return (
    <>
      <PageHeader
        titel="Kachelwerk"
        untertitel={formatiereDatum(heuteSchluessel, 'EEEE, d. MMMM')}
        aktion={
          <button
            type="button"
            onClick={oeffneAnlegen}
            aria-label="Neues Habit"
            className="bg-akzent flex size-11 items-center justify-center rounded-full text-white transition active:brightness-95"
          >
            <Plus size={22} />
          </button>
        }
      />

      <div className="flex-1 px-4">
        {backup.zeigen && <BackupHinweis tage={backup.tage} onSpaeter={backup.spaeter} />}

        {laedt && <SkelettListe />}

        {!laedt && habits.length === 0 && (
          <EmptyState
            icon={<LayoutGrid size={26} />}
            titel="Noch keine Gewohnheit"
            text="Lege deine erste Gewohnheit an. Jeder abgehakte Tag färbt eine Kachel ein."
            aktion={
              <Button groesse="breit" onClick={oeffneAnlegen}>
                <Plus size={18} /> Erstes Habit erstellen
              </Button>
            }
          />
        )}

        {!laedt && habits.length > 0 && (
          <SortableHabitList
            habits={habits}
            karten={karten}
            heuteSchluessel={heuteSchluessel}
            onTippen={beiTippen}
            onZuruecksetzen={beiZuruecksetzen}
            onReihenfolge={(ids) => void setzeReihenfolge(ids)}
          />
        )}
      </div>

      <HabitSheet
        key={sheet.nr}
        offen={sheet.offen}
        onSchliessen={() => setSheet((bisher) => ({ ...bisher, offen: false }))}
        onGespeichert={(name) => zeige(`"${name}" angelegt`)}
      />
    </>
  );
}

function SkelettListe() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="border-rand bg-karte h-24 animate-pulse rounded-2xl border" />
      ))}
    </div>
  );
}
