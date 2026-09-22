import { useEffect, useState } from 'react';
import { heute } from '../lib/dates';

/**
 * Liefert den heutigen Datumsschlüssel und aktualisiert ihn, wenn die App
 * über Mitternacht geoeffnet bleibt oder wieder in den Vordergrund kommt.
 */
export function useHeute(): string {
  const [tag, setTag] = useState(heute);

  useEffect(() => {
    const pruefe = () => {
      setTag((bisher) => {
        const jetzt = heute();
        return jetzt === bisher ? bisher : jetzt;
      });
    };

    const timer = window.setInterval(pruefe, 30_000);
    window.addEventListener('focus', pruefe);
    document.addEventListener('visibilitychange', pruefe);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', pruefe);
      document.removeEventListener('visibilitychange', pruefe);
    };
  }, []);

  return tag;
}
