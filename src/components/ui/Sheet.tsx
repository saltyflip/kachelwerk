import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface SheetProps {
  offen: boolean;
  onSchliessen: () => void;
  titel: string;
  children: ReactNode;
  /** Optionaler Fussbereich, bleibt beim Scrollen sichtbar. */
  fuss?: ReactNode;
}

/**
 * Bottom Sheet: kommt von unten, schliesst per Escape, Backdrop, Griff oder
 * Wischgeste. Hintergrund und Blatt sind zwei gleichrangige, eigenstaendig
 * animierte Kinder von AnimatePresence - nur so wird das Sheet nach dem
 * Ausblenden auch wirklich aus dem DOM entfernt.
 */
export function Sheet({ offen, onSchliessen, titel, children, fuss }: SheetProps) {
  useEffect(() => {
    if (!offen) return;
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSchliessen();
    };
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', beiTaste);
    return () => {
      document.body.style.overflow = vorher;
      window.removeEventListener('keydown', beiTaste);
    };
  }, [offen, onSchliessen]);

  return (
    <AnimatePresence>
      {offen && (
        <motion.div
          key="sheet-hintergrund"
          className="fixed inset-0 z-50 bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onSchliessen}
          aria-hidden
        />
      )}
      {offen && (
        <motion.div
          key="sheet-blatt"
          role="dialog"
          aria-modal="true"
          aria-label={titel}
          className="border-rand bg-karte fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl border-t shadow-2xl"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 460, damping: 40 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 700) onSchliessen();
          }}
        >
          <div className="relative flex items-center justify-between px-5 pt-3 pb-2">
            <div
              className="bg-rand absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full"
              aria-hidden
            />
            <div className="w-11" aria-hidden />
            <h2 className="text-base font-semibold">{titel}</h2>
            <button
              type="button"
              onClick={onSchliessen}
              aria-label="Schließen"
              className="text-leise hover:bg-vertiefung hover:text-text flex size-11 items-center justify-center rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2">{children}</div>

          {fuss && <div className="border-rand pb-sicher border-t px-5 pt-3">{fuss}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
