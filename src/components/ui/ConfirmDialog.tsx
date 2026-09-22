import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  offen: boolean;
  titel: string;
  text: string;
  bestaetigenText?: string;
  abbrechenText?: string;
  gefaehrlich?: boolean;
  /** Wenn gesetzt, muss dieses Wort eingetippt werden (zweite Sicherung). */
  tippwort?: string;
  onBestaetigen: () => void;
  onAbbrechen: () => void;
}

type InhaltProps = Omit<ConfirmDialogProps, 'offen'>;

/**
 * Eigene Komponente, damit die Eingabe beim Oeffnen automatisch leer ist:
 * der Inhalt wird mit dem Dialog gemountet und wieder verworfen.
 */
function DialogInhalt({
  titel,
  text,
  bestaetigenText = 'Bestätigen',
  abbrechenText = 'Abbrechen',
  gefaehrlich = false,
  tippwort,
  onBestaetigen,
  onAbbrechen,
}: InhaltProps) {
  const [eingabe, setEingabe] = useState('');

  useEffect(() => {
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAbbrechen();
    };
    window.addEventListener('keydown', beiTaste);
    return () => window.removeEventListener('keydown', beiTaste);
  }, [onAbbrechen]);

  const freigegeben = !tippwort || eingabe.trim().toUpperCase() === tippwort.toUpperCase();

  return (
    <motion.div key="dialog" className="fixed inset-0 z-60 flex items-center justify-center px-6">
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onAbbrechen}
        aria-hidden
      />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-label={titel}
        className="border-rand bg-karte relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.16 }}
      >
        <h2 className="text-base font-semibold">{titel}</h2>
        <p className="text-leise mt-2 text-sm leading-relaxed">{text}</p>

        {tippwort && (
          <label className="mt-4 block">
            <span className="text-schwach text-xs">
              Tippe <strong className="text-text">{tippwort}</strong> zur Bestätigung
            </span>
            <input
              autoFocus
              value={eingabe}
              onChange={(e) => setEingabe(e.target.value)}
              className="border-rand bg-vertiefung focus:border-akzent mt-1 h-11 w-full rounded-xl border px-3 text-sm outline-none"
              placeholder={tippwort}
            />
          </label>
        )}

        <div className="mt-5 flex gap-2">
          <Button variante="sekundaer" groesse="breit" onClick={onAbbrechen}>
            {abbrechenText}
          </Button>
          <Button
            groesse="breit"
            disabled={!freigegeben}
            onClick={onBestaetigen}
            className={gefaehrlich ? 'bg-gefahr text-white' : undefined}
          >
            {bestaetigenText}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ConfirmDialog({ offen, ...rest }: ConfirmDialogProps) {
  return <AnimatePresence>{offen && <DialogInhalt {...rest} />}</AnimatePresence>;
}
