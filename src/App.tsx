import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/ToastProvider';
import { usePwaAktualisierung } from './hooks/usePwaAktualisierung';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import DashboardPage from './pages/DashboardPage';

// Unterseiten erst laden, wenn sie gebraucht werden - das haelt den Start schlank
const HabitDetailPage = lazy(() => import('./pages/HabitDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const StatsOverviewPage = lazy(() => import('./pages/StatsOverviewPage'));

function SeitenPlatzhalter() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-16" aria-hidden>
      <div className="border-rand bg-karte h-32 animate-pulse rounded-2xl border" />
      <div className="border-rand bg-karte h-48 animate-pulse rounded-2xl border" />
    </div>
  );
}

export default function App() {
  // Setzt die Theme-Klasse am <html>-Element und hält sie aktuell
  useTheme();

  return (
    <ToastProvider>
      <OfflineHinweis />
      <Suspense fallback={<SeitenPlatzhalter />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="habit/:id" element={<HabitDetailPage />} />
            <Route path="statistik" element={<StatsOverviewPage />} />
            <Route path="einstellungen" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}

/** Einmalige Rueckmeldung, sobald die App offline lauffaehig ist. */
function OfflineHinweis() {
  const { offlineBereit, quittieren } = usePwaAktualisierung();
  const { zeige } = useToast();

  useEffect(() => {
    if (!offlineBereit) return;
    zeige('Kachelwerk ist jetzt offline verfügbar', 'erfolg');
    quittieren();
  }, [offlineBereit, quittieren, zeige]);

  return null;
}
