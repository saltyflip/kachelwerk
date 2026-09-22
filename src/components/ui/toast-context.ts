import { createContext } from 'react';

export type ToastArt = 'info' | 'erfolg' | 'fehler';

export interface ToastEintrag {
  id: number;
  text: string;
  art: ToastArt;
}

export interface ToastSteuerung {
  zeige: (text: string, art?: ToastArt) => void;
}

export const ToastContext = createContext<ToastSteuerung | null>(null);
