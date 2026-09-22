import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastArt, type ToastEintrag } from './toast-context';

const FARBE: Record<ToastArt, string> = {
  info: 'border-rand bg-karte text-text',
  erfolg: 'border-rand bg-karte text-text',
  fehler: 'border-gefahr/40 bg-karte text-gefahr',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [eintraege, setEintraege] = useState<ToastEintrag[]>([]);
  const zaehler = useRef(0);

  const zeige = useCallback((text: string, art: ToastArt = 'info') => {
    zaehler.current += 1;
    const id = zaehler.current;
    setEintraege((bisher) => [...bisher, { id, text, art }]);
    window.setTimeout(() => {
      setEintraege((bisher) => bisher.filter((e) => e.id !== id));
    }, 2800);
  }, []);

  const steuerung = useMemo(() => ({ zeige }), [zeige]);

  return (
    <ToastContext.Provider value={steuerung}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-70 flex flex-col items-center gap-2 px-6">
        <AnimatePresence>
          {eintraege.map((eintrag) => (
            <motion.div
              key={eintrag.id}
              role="status"
              className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${FARBE[eintrag.art]}`}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              {eintrag.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
