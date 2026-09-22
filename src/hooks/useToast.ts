import { useContext } from 'react';
import { ToastContext } from '../components/ui/toast-context';

export function useToast() {
  const steuerung = useContext(ToastContext);
  if (!steuerung) throw new Error('useToast benoetigt den ToastProvider');
  return steuerung;
}
