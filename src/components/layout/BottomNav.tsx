import { BarChart3, LayoutGrid, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const EINTRAEGE = [
  { pfad: '/', label: 'Habits', Icon: LayoutGrid, exakt: true },
  { pfad: '/statistik', label: 'Statistik', Icon: BarChart3, exakt: false },
  { pfad: '/einstellungen', label: 'Einstellungen', Icon: Settings, exakt: false },
];

export function BottomNav() {
  return (
    <nav className="border-rand bg-flaeche/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur">
      <div className="mx-auto flex max-w-md px-sicher pb-sicher">
        {EINTRAEGE.map(({ pfad, label, Icon, exakt }) => (
          <NavLink
            key={pfad}
            to={pfad}
            end={exakt}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 pt-2 text-[11px] transition ${
                isActive ? 'text-akzent' : 'text-schwach hover:text-leise'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
