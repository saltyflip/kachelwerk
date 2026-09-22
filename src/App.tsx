import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/ToastProvider';
import { useTheme } from './hooks/useTheme';
import DashboardPage from './pages/DashboardPage';
import HabitDetailPage from './pages/HabitDetailPage';
import SettingsPage from './pages/SettingsPage';
import StatsOverviewPage from './pages/StatsOverviewPage';

export default function App() {
  // Setzt die Theme-Klasse am <html>-Element und haelt sie aktuell
  useTheme();

  return (
    <ToastProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="habit/:id" element={<HabitDetailPage />} />
          <Route path="statistik" element={<StatsOverviewPage />} />
          <Route path="einstellungen" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
