# Kachelwerk

> Gewohnheiten verfolgen — offline, ohne Konto, ohne Server.

[![Deploy auf GitHub Pages](https://github.com/saltyflip/kachelwerk/actions/workflows/deploy.yml/badge.svg)](https://github.com/saltyflip/kachelwerk/actions/workflows/deploy.yml)
[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-installierbar-5a5fe0.svg)](#auf-dem-handy-installieren)

Kachelwerk ist ein Habit-Tracker als installierbare Web-App. Jede Gewohnheit
bekommt eine Kachel-Heatmap im Stil eines Beitragsdiagramms: Jeder erledigte
Tag färbt ein Feld ein, Lücken bleiben sichtbar.

Die App läuft vollständig im Browser. Es gibt kein Backend, keine Anmeldung und
keine Telemetrie — sämtliche Einträge liegen in der lokalen IndexedDB des
Geräts und lassen sich als JSON-Datei sichern und zurückspielen.

---

## Funktionen

- **Dashboard** mit einer Karte je Gewohnheit: Symbol, Name, laufende Serie,
  Heatmap der letzten 20 Wochen und ein großflächiger Erledigt-Knopf
- **Mehrfache Erledigungen pro Tag** (z. B. dreimal Wasser trinken) mit
  Fortschrittsring am Knopf
- **Drei Frequenzen**: täglich, an bestimmten Wochentagen oder X-mal pro Woche
- **Serien mit Kulanzregel**: Ein heute noch offener Tag reißt die Serie nicht
  ab, nicht eingeplante Tage unterbrechen sie nicht
- **Detailansicht** mit Jahres-Heatmap, Monatskalender zum Nachtragen,
  Erfolgsquoten über 7, 30 und 365 Tage sowie Verteilung nach Wochentag
- **Gesamtübersicht** über alle Gewohnheiten samt Rangliste
- **Sortieren** per Drag and Drop, auch auf dem Touchscreen
- **Themes**: Dunkel (Vorgabe), Hell, oder der Systemeinstellung folgend
- **Sicherung** als JSON mit Prüfung und Vorschau vor dem Überschreiben
- **Offline**: Nach dem ersten Laden funktioniert alles ohne Netzverbindung

## Technik

| Bereich | Verwendet |
| --- | --- |
| Oberfläche | React 19, TypeScript (strict), Tailwind CSS v4 |
| Build | Vite 8, vite-plugin-pwa (Workbox) |
| Daten | Dexie 4 auf IndexedDB, keine Server-Anbindung |
| Datum | date-fns, durchgehend lokale Zeitrechnung |
| Bewegung | Framer Motion, dnd-kit für Drag and Drop |
| Qualität | Vitest, Testing Library, ESLint 9 |

Bewusst **ohne** Diagrammbibliothek (Balken und Ringe sind CSS bzw. SVG) und
**ohne** Schema-Bibliothek für die Importprüfung — das hält das Paket klein und
die Abhängigkeitsliste kurz.

## Schnellstart

Vorausgesetzt wird Node.js 20 oder neuer.

```bash
git clone https://github.com/saltyflip/kachelwerk.git
cd kachelwerk
npm install
npm run dev
```

Die App läuft anschließend auf <http://localhost:5173>.

### npm-Skripte

| Befehl | Wirkung |
| --- | --- |
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm run build` | Typprüfung, Icons erzeugen, Produktionsbuild nach `dist/` |
| `npm run build:pages` | Build mit dem Unterpfad `/kachelwerk/` für GitHub Pages |
| `npm run preview` | Gebauten Stand ausliefern, inklusive Service Worker |
| `npm test` | Alle Tests einmal durchlaufen |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run lint` | ESLint über das gesamte Projekt |
| `npm run generate:icons` | App-Icons neu zeichnen |
| `npm run licenses` | Lizenzhinweise aus `node_modules` neu erzeugen |

Der Service Worker ist im Entwicklungsmodus abgeschaltet, sonst stört er das
Hot Reload. Zum Prüfen der Offline-Fähigkeit `npm run build && npm run preview`
verwenden.

## Projektaufbau

```
src/
├─ db/          Dexie-Schema und sämtliche Datenbankzugriffe
├─ lib/         Datums-, Serien-, Statistik-, Heatmap- und Sicherungslogik
├─ hooks/       Live-Abfragen, Theme, aktueller Tag, Sicherungserinnerung
├─ components/  layout · habit · heatmap · form · stats · ui
├─ pages/       Dashboard, Detail, Statistik, Einstellungen
└─ test/        Vitest-Setup mit fester Zeitzone
scripts/        Icon-Generator und Lizenzhinweise, beide ohne native Abhängigkeiten
```

Die gesamte Rechenlogik liegt in `src/lib/` und kennt kein React. Sie ist damit
unabhängig von der Oberfläche testbar.

## Wie gerechnet wird

Zwei Entscheidungen prägen das Verhalten der App und sind deshalb ausführlich
mit Tests abgesichert.

### Datum immer lokal

Alle Tage werden als Zeichenkette `YYYY-MM-DD` in **lokaler** Zeit geführt.
`toISOString()` kommt bewusst nirgends zum Einsatz: Es rechnet in UTC und würde
abends je nach Zeitzone den falschen Tag liefern. Als Anker innerhalb eines
Tages dient 12 Uhr mittags, wodurch Sprünge über Zeitumstellungen hinweg
unempfindlich gegen 23- und 25-Stunden-Tage sind.

### Serien

Ein Tag gilt als erfüllt, sobald die Anzahl das Tagesziel erreicht.

- **täglich** und **bestimmte Wochentage**: Rückwärts ab heute; nicht geplante
  Tage werden übersprungen, ohne die Serie zu unterbrechen. Ein heute noch
  offener Tag wird übergangen — die Serie reißt erst, wenn er vorbei ist.
- **X-mal pro Woche**: Die Einheit ist die Woche von Montag bis Sonntag. Die
  laufende Woche zählt mit, sobald das Ziel erreicht ist, bricht die Serie
  vorher aber nicht ab. Die Woche, in der die Gewohnheit angelegt wurde, wird
  anteilig bewertet, damit ein Start am Freitag nicht sofort als Fehlschlag
  gilt.

## Tests

```bash
npm test
```

Über hundert Testfälle decken unter anderem ab: alle drei Frequenztypen,
Kulanz für den laufenden Tag, Monats-, Jahres- und Schaltjahrwechsel, beide
Zeitumstellungen in Europa, den Umgang mit nachgetragenen Tagen sowie das
Prüfen, Reparieren und Ablehnen von Sicherungsdateien. Die Testumgebung ist
fest auf die Zeitzone `Europe/Vienna` gestellt, damit Datumsfälle
reproduzierbar bleiben.

## Deployment

Der Build ist auf zwei Ziele vorbereitet. Der Unterpfad wird über die
Umgebungsvariable `VITE_BASE` gesteuert, es gibt keinen fest verdrahteten Pfad
im Code.

### GitHub Pages

`.github/workflows/deploy.yml` prüft, testet, baut und veröffentlicht bei jedem
Push auf `main`. Der Unterpfad wird automatisch aus dem Repository-Namen
abgeleitet, ein Umbenennen des Repositorys erfordert also keine Codeänderung.

Einmalig nötig, bevor der erste Lauf durchgeht:

1. **Settings → Pages** öffnen
2. Unter *Build and deployment* bei **Source** den Eintrag **GitHub Actions**
   wählen
3. Unter **Actions** den letzten Lauf über *Re-run all jobs* neu starten

Danach ist die App unter <https://saltyflip.github.io/kachelwerk/> erreichbar.
Damit Deep Links wie `/kachelwerk/statistik` auch beim ersten Aufruf
funktionieren, legt der Workflow zusätzlich eine `404.html` an.

### Vercel

`vercel.json` liegt bei. Auf vercel.com **Add New → Project** wählen, das
Repository importieren und deployen — Vercel erkennt Vite selbstständig. Der
Unterpfad bleibt dabei `/`.

## Auf dem Handy installieren

**iPhone und iPad**

1. Die Seite in **Safari** öffnen — Chrome unter iOS kann keine Web-Apps
   installieren
2. Auf das Teilen-Symbol tippen
3. **Zum Home-Bildschirm** wählen und bestätigen

**Android**

1. Die Seite in Chrome öffnen
2. Im Menü **App installieren** bzw. **Zum Startbildschirm hinzufügen** wählen
3. Bestätigen

Danach startet Kachelwerk im Vollbild ohne Browserleiste und funktioniert auch
ohne Internetverbindung.

## Daten, Sicherungen und Datenschutz

Die App sendet nichts. Es gibt keine Konten, keine Analyse, keine externen
Aufrufe zur Laufzeit; auch Schriftarten kommen vom System. Alle Einträge liegen
in der IndexedDB-Datenbank `kachelwerk` des jeweiligen Browsers.

Daraus folgt:

- Es findet **keine Synchronisation** zwischen Geräten statt
- Werden die Browserdaten gelöscht oder die installierte App entfernt, sind die
  Einträge verloren
- iOS räumt Daten selten genutzter Web-Apps nach längerer Zeit selbstständig auf

Deshalb unter **Einstellungen → Datensicherung** regelmäßig exportieren. Liegt
die letzte Sicherung mehr als 14 Tage zurück, weist die App auf dem Dashboard
darauf hin. Beim Import wird die Datei vollständig geprüft und eine
Zusammenfassung angezeigt, bevor etwas überschrieben wird.

## Nicht enthalten

Erinnerungen und Push-Benachrichtigungen, Synchronisation zwischen Geräten,
Benutzerkonten.

## Mitwirken

Fehlermeldungen und Vorschläge gerne als
[Issue](https://github.com/saltyflip/kachelwerk/issues). Vor einem Pull Request
bitte `npm run lint` und `npm test` laufen lassen.

## Lizenz

[MIT](LICENSE) — Copyright (c) 2026 Filip Tomsik.

Die Software wird ohne jede Gewährleistung bereitgestellt; eine Haftung für
Schäden aus ihrer Nutzung ist im Rahmen des gesetzlich Zulässigen
ausgeschlossen. Der vollständige Wortlaut steht in [LICENSE](LICENSE).

### Fremde Software

Kachelwerk verwendet Open-Source-Pakete Dritter. Deren Lizenzen und
Rechteinhaber sind in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)
aufgeführt; die Datei wird mit `npm run licenses` aus den installierten
Paketen erzeugt.

Name, Gestaltung, Symbole und sämtliche Grafiken dieses Projekts sind eigens
dafür entstanden. Die App-Icons werden rechnerisch von
[`scripts/generate-icons.mjs`](scripts/generate-icons.mjs) gezeichnet. Die
Bedienidee ist von Anwendungen wie HabitKit und HabitBox angeregt; es wurden
weder Quelltext noch Grafiken, Schriftzüge oder sonstige Inhalte von dort
übernommen. Alle genannten Produktnamen gehören ihren jeweiligen Inhabern und
dienen hier ausschließlich der Einordnung.
