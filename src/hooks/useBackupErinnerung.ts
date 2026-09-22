import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { db } from '../db/db';
import {
  SCHLUESSEL_HINWEIS_GESEHEN,
  SCHLUESSEL_LETZTES_BACKUP,
  schreibeEinstellung,
} from '../db/repo';
import { tageSeitBackup } from '../lib/backup';

/** Nach so vielen Tagen ohne Sicherung wird erinnert. */
export const BACKUP_INTERVALL_TAGE = 14;
/** So lange bleibt der Hinweis nach "Später" verborgen. */
const RUHE_TAGE = 3;

export function useBackupErinnerung() {
  const zustand = useLiveQuery(async () => {
    const [letztes, gesehen, habits] = await Promise.all([
      db.einstellungen.get(SCHLUESSEL_LETZTES_BACKUP),
      db.einstellungen.get(SCHLUESSEL_HINWEIS_GESEHEN),
      db.habits.count(),
    ]);
    return {
      letztesBackupAm: letztes?.wert as string | undefined,
      gesehenAm: gesehen?.wert as string | undefined,
      habits,
    };
  }, []);

  const spaeter = useCallback(() => {
    void schreibeEinstellung(SCHLUESSEL_HINWEIS_GESEHEN, new Date().toISOString());
  }, []);

  if (!zustand || zustand.habits === 0) {
    return { zeigen: false, tage: undefined, spaeter };
  }

  const tage = tageSeitBackup(zustand.letztesBackupAm);
  const faellig = tage === undefined || tage >= BACKUP_INTERVALL_TAGE;
  const ruhend = (tageSeitBackup(zustand.gesehenAm) ?? RUHE_TAGE) < RUHE_TAGE;

  return { zeigen: faellig && !ruhend, tage, spaeter };
}
