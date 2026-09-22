import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variante = 'primaer' | 'sekundaer' | 'geist' | 'gefahr';
type Groesse = 'normal' | 'klein' | 'breit';

const VARIANTEN: Record<Variante, string> = {
  primaer: 'bg-akzent text-white hover:brightness-110 active:brightness-95',
  sekundaer: 'bg-vertiefung text-text hover:brightness-110 active:brightness-95',
  geist: 'bg-transparent text-leise hover:bg-vertiefung hover:text-text',
  gefahr: 'bg-transparent text-gefahr hover:bg-gefahr/10',
};

const GROESSEN: Record<Groesse, string> = {
  normal: 'h-11 px-4 text-sm',
  klein: 'h-9 px-3 text-sm',
  breit: 'h-12 w-full px-4 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  groesse?: Groesse;
  children: ReactNode;
}

export function Button({
  variante = 'primaer',
  groesse = 'normal',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTEN[variante]} ${GROESSEN[groesse]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
