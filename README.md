# Kachelwerk

Ein Habit-Tracker als installierbare Web-App (PWA). Jede Gewohnheit bekommt eine
Kachel-Heatmap, jeder erledigte Tag färbt ein Feld ein.

Alles läuft **lokal im Browser**: kein Backend, kein Konto, keine Übertragung.
Die Daten liegen in IndexedDB auf dem Gerät und lassen sich als JSON-Datei
sichern und wiederherstellen.

## Funktionen

- **Dashboard** mit Karte je Gewohnheit: Icon, Name, Serie, Heatmap der letzten
  20 Wochen und ein großer Check-Button rechts
- **Mehrere Erledigungen pro Tag** (z. B. 3× Wasser trinken) mit Fortschrittsring
- **Frequenzen**: täglich, bestimmte Wochentage oder X-mal pro Woche
- **Serien (Streaks)** mit Kulanzregel: ein heute noch offener Tag reißt die
  Serie nicht ab, nicht geplante Tage unterbrechen sie nicht
- **Detailansicht** mit Jahres-Heatmap, Monatskalender zum Nachtragen,
  Erfolgsquoten über 7 / 30 / 365 Tage und Verteilung nach Wochentag
- **Statistik-Übersicht** über alle Gewohnheiten
- **Sortieren** per Drag and Drop
- **Themes** Dunkel (Standard), Hell, System
- **Export / Import** als JSON, mit Prüfung und Vorschau vor dem Überschreiben
- **Offline**: nach dem ersten Laden funktioniert alles ohne Netz

## Technik

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · Dexie (IndexedDB) ·
date-fns · Framer Motion · dnd-kit · vite-plugin-pwa · Vitest

## Lokal starten

```bash
npm install
npm run dev
```

Die App läuft dann auf http://localhost:5173.

| Befehl | Wirkung |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm run build` | Typprüfung, Icons erzeugen, Produktionsbuild nach `dist/` |
| `npm run build:pages` | Build mit base-Pfad `/kachelwerk/` für GitHub Pages |
| `npm run preview` | Gebauten Stand lokal ausliefern (inklusive Service Worker) |
| `npm test` | Alle Unit-Tests einmal durchlaufen |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run lint` | ESLint über das gesamte Projekt |
| `npm run generate:icons` | PWA-Icons neu zeichnen |

Der Service Worker ist im Entwicklungsmodus bewusst abgeschaltet. Zum Testen der
Offline-Fähigkeit `npm run build && npm run preview` verwenden.

## Auf GitHub veröffentlichen

Das Repository existiert bisher nur lokal. So kommt es zu GitHub:

1. Auf github.com ein **leeres** Repository namens `kachelwerk` anlegen
   (ohne README, ohne .gitignore, ohne Lizenz).
2. Danach im Projektordner:

```bash
git remote add origin https://github.com/<dein-benutzername>/kachelwerk.git
git push -u origin main
```

## Deployment auf GitHub Pages

Der Workflow unter `.github/workflows/deploy.yml` baut und veröffentlicht bei
jedem Push auf `main`. Einmalig nötig:

1. Im Repository auf **Settings → Pages** gehen.
2. Bei **Source** den Eintrag **GitHub Actions** wählen.
3. Einen Push auf `main` machen (oder den Workflow unter **Actions** manuell
   starten).

Der base-Pfad kommt automatisch aus dem Repository-Namen
(`VITE_BASE=/<repo-name>/`), ein Umbenennen des Repos funktioniert also ohne
Codeänderung. Die Seite liegt danach unter
`https://<dein-benutzername>.github.io/kachelwerk/`.

Damit Deep Links wie `/kachelwerk/statistik` auch beim ersten Aufruf
funktionieren, kopiert der Workflow `index.html` zusätzlich nach `404.html`.

## Deployment auf Vercel

`vercel.json` liegt bei. Auf vercel.com **Add New → Project** wählen, das
GitHub-Repository importieren und ohne weitere Einstellungen deployen. Vercel
erkennt Vite, baut mit `npm run build` und liefert aus `dist/` aus. Der
base-Pfad bleibt dabei `/`.

## Auf dem Handy installieren

**iPhone / iPad (Safari)**
1. Die Seite in **Safari** öffnen (Chrome auf iOS kann keine Web-Apps
   installieren).
2. Auf das **Teilen**-Symbol tippen.
3. **Zum Home-Bildschirm** wählen und bestätigen.

**Android (Chrome)**
1. Die Seite in Chrome öffnen.
2. Im Menü **App installieren** bzw. **Zum Startbildschirm hinzufügen** wählen.
3. Bestätigen.

Danach startet Kachelwerk ohne Browserleiste im Vollbild und funktioniert auch
ohne Internetverbindung.

## Datenhaltung und Sicherungen

Alle Daten liegen ausschließlich im Browser des jeweiligen Geräts (IndexedDB,
Datenbank `kachelwerk`). Daraus folgt:

- Es gibt **keine Synchronisation** zwischen Geräten.
- Werden die Browserdaten gelöscht oder die installierte App entfernt, sind die
  Einträge weg.
- iOS kann Daten von selten genutzten Web-Apps nach längerer Zeit aufräumen.

Deshalb: unter **Einstellungen → Datensicherung** regelmäßig exportieren. Wenn
seit 14 Tagen keine Sicherung erstellt wurde, erinnert die App auf dem
Dashboard daran. Der Import prüft die Datei vollständig und zeigt vor dem
Überschreiben eine Zusammenfassung an.

## Projektaufbau

```
src/
├─ db/          Dexie-Schema und alle Datenbankzugriffe
├─ lib/         Datums-, Streak-, Statistik-, Heatmap- und Backup-Logik
├─ hooks/       Live-Abfragen, Theme, aktueller Tag, Backup-Erinnerung
├─ components/  layout · habit · heatmap · form · stats · ui
├─ pages/       Dashboard, Detail, Statistik, Einstellungen
└─ test/        Vitest-Setup (feste Zeitzone Europe/Vienna)
```

Die gesamte Rechenlogik liegt in `src/lib/` und ist frei von React. Sie ist mit
über 100 Unit-Tests abgesichert, unter anderem für alle drei Frequenztypen,
Monats-, Jahres- und Schaltjahrwechsel sowie beide Zeitumstellungen.

Datumsangaben werden durchgehend als lokale Schlüssel `YYYY-MM-DD` gehalten;
`toISOString()` kommt bewusst nirgends zum Einsatz, weil es in UTC rechnet und
abends den falschen Tag liefern würde.

## Nicht enthalten

Erinnerungen und Push-Benachrichtigungen, Synchronisation zwischen Geräten,
Benutzerkonten.
