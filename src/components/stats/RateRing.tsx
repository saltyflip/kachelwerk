interface RateRingProps {
  /** 0..1 */
  anteil: number;
  beschriftung: string;
  unterschrift?: string;
  groesse?: number;
}

export function RateRing({ anteil, beschriftung, unterschrift, groesse = 104 }: RateRingProps) {
  const radius = groesse / 2 - 7;
  const umfang = 2 * Math.PI * radius;
  const gefuellt = Math.min(1, Math.max(0, anteil));

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: groesse, height: groesse }}>
      <svg
        className="-rotate-90"
        width={groesse}
        height={groesse}
        viewBox={`0 0 ${groesse} ${groesse}`}
        aria-hidden
      >
        <circle
          cx={groesse / 2}
          cy={groesse / 2}
          r={radius}
          fill="none"
          className="stroke-vertiefung"
          strokeWidth="7"
        />
        <circle
          cx={groesse / 2}
          cy={groesse / 2}
          r={radius}
          fill="none"
          className="stroke-akzent"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={umfang}
          strokeDashoffset={umfang * (1 - gefuellt)}
          style={{ transition: 'stroke-dashoffset 320ms ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-semibold tabular-nums">{beschriftung}</span>
        {unterschrift && <span className="text-schwach text-[11px]">{unterschrift}</span>}
      </div>
    </div>
  );
}
