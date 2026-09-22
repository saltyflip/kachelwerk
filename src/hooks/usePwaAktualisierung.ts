import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Meldet, sobald die App vollstaendig offline verfuegbar ist. Neue Versionen
 * werden dank registerType "autoUpdate" im Hintergrund uebernommen.
 */
export function usePwaAktualisierung() {
  const {
    offlineReady: [offlineBereit, setOfflineBereit],
  } = useRegisterSW({ immediate: true });

  return { offlineBereit, quittieren: () => setOfflineBereit(false) };
}
