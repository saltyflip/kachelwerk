/** Loest den Download einer Textdatei aus. */
export function dateiHerunterladen(name: string, inhalt: string, typ = 'application/json'): void {
  const blob = new Blob([inhalt], { type: `${typ};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anker = document.createElement('a');
  anker.href = url;
  anker.download = name;
  document.body.appendChild(anker);
  anker.click();
  anker.remove();
  // Etwas Luft lassen, damit der Download sicher gestartet ist
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function dateiLesen(datei: File): Promise<string> {
  return new Promise((erfuellen, ablehnen) => {
    const leser = new FileReader();
    leser.onload = () => erfuellen(String(leser.result ?? ''));
    leser.onerror = () => ablehnen(leser.error ?? new Error('Datei konnte nicht gelesen werden'));
    leser.readAsText(datei);
  });
}
