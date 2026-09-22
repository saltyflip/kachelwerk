import type { ReactNode } from 'react';

interface KarteProps {
  titel?: string;
  aktion?: ReactNode;
  children: ReactNode;
}

export function Karte({ titel, aktion, children }: KarteProps) {
  return (
    <section className="border-rand bg-karte rounded-2xl border p-4">
      {(titel || aktion) && (
        <div className="mb-3 flex items-center justify-between">
          {titel && (
            <h2 className="text-schwach text-xs font-medium tracking-wide uppercase">{titel}</h2>
          )}
          {aktion}
        </div>
      )}
      {children}
    </section>
  );
}
