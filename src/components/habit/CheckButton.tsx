import { motion, useAnimationControls } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRef } from 'react';
import { farbeHex, mitDeckkraft } from '../../lib/colors';
import { haptik, haptikErfolg } from '../../lib/haptics';

interface CheckButtonProps {
  anzahl: number;
  zielProTag: number;
  farbe: string;
  name: string;
  onTippen: () => void;
  /** Langes Drücken setzt den Tag auf null zurück. */
  onZuruecksetzen?: () => void;
}

const GROESSE = 56;
const RADIUS = 24;
const UMFANG = 2 * Math.PI * RADIUS;

export function CheckButton({
  anzahl,
  zielProTag,
  farbe,
  name,
  onTippen,
  onZuruecksetzen,
}: CheckButtonProps) {
  const steuerung = useAnimationControls();
  const halteTimer = useRef<number | null>(null);
  const langGedrueckt = useRef(false);

  const ziel = Math.max(1, zielProTag);
  const fertig = anzahl >= ziel;
  const anteil = Math.min(1, anzahl / ziel);
  const hex = farbeHex(farbe);

  const starteHalten = () => {
    if (!onZuruecksetzen) return;
    langGedrueckt.current = false;
    halteTimer.current = window.setTimeout(() => {
      langGedrueckt.current = true;
      haptikErfolg();
      onZuruecksetzen();
    }, 550);
  };

  const beendeHalten = () => {
    if (halteTimer.current !== null) {
      window.clearTimeout(halteTimer.current);
      halteTimer.current = null;
    }
  };

  const beiKlick = () => {
    if (langGedrueckt.current) {
      langGedrueckt.current = false;
      return;
    }
    haptik(fertig ? 8 : 14);
    void steuerung.start({
      scale: [1, 0.88, 1.06, 1],
      transition: { duration: 0.28, times: [0, 0.3, 0.6, 1] },
    });
    onTippen();
  };

  return (
    <motion.button
      type="button"
      animate={steuerung}
      onClick={beiKlick}
      onPointerDown={starteHalten}
      onPointerUp={beendeHalten}
      onPointerLeave={beendeHalten}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={
        fertig
          ? `${name}: heute erledigt, tippen zum Zurücksetzen`
          : `${name}: heute abhaken (${anzahl} von ${ziel})`
      }
      aria-pressed={fertig}
      className="relative flex shrink-0 touch-manipulation items-center justify-center rounded-full select-none"
      style={{
        width: GROESSE,
        height: GROESSE,
        backgroundColor: fertig ? hex : mitDeckkraft(hex, 0.12),
      }}
    >
      {!fertig && ziel > 1 && (
        <svg
          className="absolute inset-0 -rotate-90"
          width={GROESSE}
          height={GROESSE}
          viewBox="0 0 56 56"
          aria-hidden
        >
          <circle cx="28" cy="28" r={RADIUS} fill="none" stroke={mitDeckkraft(hex, 0.2)} strokeWidth="3" />
          <circle
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            stroke={hex}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={UMFANG}
            strokeDashoffset={UMFANG * (1 - anteil)}
          />
        </svg>
      )}

      {fertig ? (
        <Check size={26} strokeWidth={3} className="text-white" />
      ) : ziel > 1 ? (
        <span className="text-xs font-semibold tabular-nums" style={{ color: hex }}>
          {anzahl}/{ziel}
        </span>
      ) : (
        <Check size={24} strokeWidth={2.6} style={{ color: mitDeckkraft(hex, 0.55) }} />
      )}
    </motion.button>
  );
}
