import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="bg-flaeche min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
