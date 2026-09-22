import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/** Platzhalter, solange eine nachgeladene Unterseite noch unterwegs ist. */
function SeitenPlatzhalter() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-16" aria-hidden>
      <div className="border-rand bg-karte h-32 animate-pulse rounded-2xl border" />
      <div className="border-rand bg-karte h-48 animate-pulse rounded-2xl border" />
    </div>
  );
}

export function AppShell() {
  return (
    <div className="bg-flaeche min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pb-20">
        <Suspense fallback={<SeitenPlatzhalter />}>
          <Outlet />
        </Suspense>
      </div>
      <BottomNav />
    </div>
  );
}
