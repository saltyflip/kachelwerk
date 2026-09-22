import { createElement } from 'react';
import { farbeHex } from '../../lib/colors';
import { lucideKomponente } from '../../lib/icons';

interface HabitIconProps {
  icon: string;
  farbe: string;
  groesse?: number;
  className?: string;
}

/**
 * Zeigt entweder ein Emoji oder ein Lucide-Icon. Die Lucide-Komponenten
 * stammen aus einer Tabelle auf Modulebene, ihre Identitaet ist also stabil.
 */
export function HabitIcon({ icon, farbe, groesse = 20, className = '' }: HabitIconProps) {
  const lucide = lucideKomponente(icon);

  if (lucide) {
    return createElement(lucide, {
      size: groesse,
      color: farbeHex(farbe),
      strokeWidth: 2.1,
      className,
    });
  }

  return (
    <span className={className} style={{ fontSize: groesse, lineHeight: 1 }} aria-hidden>
      {icon}
    </span>
  );
}
