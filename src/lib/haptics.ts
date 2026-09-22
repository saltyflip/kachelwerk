/** Kurzes haptisches Signal, sofern das Geraet es unterstuetzt. */
export function haptik(dauer = 12): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(dauer);
    }
  } catch {
    // Manche Browser werfen, wenn vibrate ohne Nutzergeste aufgerufen wird
  }
}

export function haptikErfolg(): void {
  haptik(18);
}
