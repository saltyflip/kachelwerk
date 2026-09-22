import { farbeHex } from '../../lib/colors';
import { formatiereProzent, type Quote } from '../../lib/stats';

interface QuoteBalkenProps {
  label: string;
  quote: Quote;
  farbe: string;
}

export function QuoteBalken({ label, quote, farbe }: QuoteBalkenProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-leise text-xs">{label}</span>
        <span className="text-xs font-medium tabular-nums">{formatiereProzent(quote.quote)}</span>
      </div>
      <div className="bg-vertiefung h-1.5 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${Math.round(quote.quote * 100)}%`, backgroundColor: farbeHex(farbe) }}
        />
      </div>
      <div className="text-schwach mt-1 text-[10px] tabular-nums">
        {quote.ist} von {quote.soll}
      </div>
    </div>
  );
}
