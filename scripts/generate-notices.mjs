/**
 * Erzeugt THIRD-PARTY-NOTICES.md aus den tatsaechlich installierten Paketen.
 * Copyright-Zeilen und Lizenzangaben werden aus node_modules gelesen, nicht
 * von Hand gepflegt - so bleibt die Datei nach jedem Update korrekt.
 *
 * Aufruf: npm run licenses
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');

function paketDaten(name) {
  const ordner = join(WURZEL, 'node_modules', name);
  const manifest = JSON.parse(readFileSync(join(ordner, 'package.json'), 'utf8'));

  // Der Apache-2.0-Volltext enthaelt das Wort "copyright" mehrfach in seinen
  // Definitionen und einen Platzhalter im Anhang. Solche Zeilen sind keine
  // Rechteinhaber und werden aussortiert.
  const istPlatzhalter = (zeile) =>
    /\[yyyy\]|\[name of copyright owner\]|owner or entity|included in or attached/i.test(zeile);

  const ausDatei = (muster) => {
    try {
      const datei = readdirSync(ordner).find((f) => muster.test(f));
      if (!datei) return '';
      const treffer = readFileSync(join(ordner, datei), 'utf8')
        .split('\n')
        .map((z) => z.trim())
        .find((z) => /^Copyright\s+(\(c\)|©|\d{4}|[A-Z])/.test(z) && !istPlatzhalter(z));
      return treffer ? treffer.replace(/[.,]$/, '') : '';
    } catch {
      return '';
    }
  };

  const autor =
    typeof manifest.author === 'string' ? manifest.author : (manifest.author?.name ?? '');

  // NOTICE hat Vorrang (Apache-2.0), danach die Lizenzdatei, zuletzt das Manifest
  const copyright =
    ausDatei(/^NOTICE/i) ||
    ausDatei(/^(LICENSE|LICENCE|COPYING)/i) ||
    (autor ? `${autor} (laut package.json)` : '');

  return {
    name,
    version: manifest.version ?? '?',
    lizenz: typeof manifest.license === 'string' ? manifest.license : (manifest.license?.type ?? 'unbekannt'),
    copyright,
    homepage: manifest.homepage ?? `https://www.npmjs.com/package/${name}`,
  };
}

function tabelle(pakete) {
  const zeilen = pakete.map(
    (p) => `| [${p.name}](${p.homepage}) | ${p.version} | ${p.lizenz} | ${p.copyright || '—'} |`,
  );
  return ['| Paket | Version | Lizenz | Copyright |', '| --- | --- | --- | --- |', ...zeilen].join('\n');
}

const pkg = JSON.parse(readFileSync(join(WURZEL, 'package.json'), 'utf8'));
const laufzeit = Object.keys(pkg.dependencies ?? {}).sort().map(paketDaten);
const entwicklung = Object.keys(pkg.devDependencies ?? {}).sort().map(paketDaten);
const alle = [...laufzeit, ...entwicklung];

const lizenzarten = [...new Set(alle.map((p) => p.lizenz))].sort();

const inhalt = `# Lizenzhinweise zu Drittanbieter-Software

Kachelwerk selbst steht unter der MIT-Lizenz (siehe [LICENSE](LICENSE)).
Daneben verwendet das Projekt die unten aufgeführte Open-Source-Software.
Alle Rechte an diesen Paketen liegen bei den jeweiligen Urheberinnen und
Urhebern; die Nennung erfolgt, um deren Lizenzbedingungen zu erfüllen.

Verwendete Lizenzarten: ${lizenzarten.join(', ')}.

Diese Datei wird erzeugt, nicht von Hand gepflegt. Aktualisieren mit:

\`\`\`bash
npm run licenses
\`\`\`

Stand: ${new Date().toISOString().slice(0, 10)}

## In die Anwendung eingebunden

Diese Pakete werden mit ausgeliefert und laufen im Browser der Nutzerinnen und Nutzer.

${tabelle(laufzeit)}

## Nur für Entwicklung und Build

Diese Pakete werden zum Bauen, Testen und Prüfen verwendet und sind **nicht** Teil
der ausgelieferten Anwendung.

${tabelle(entwicklung)}

## Lizenztexte

### MIT

Für alle oben mit \`MIT\` gekennzeichneten Pakete gilt der folgende Text; als
Copyright-Inhaber ist jeweils die in der Tabelle genannte Partei einzusetzen.

\`\`\`
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
\`\`\`

### ISC

\`\`\`
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
\`\`\`

### Apache License 2.0

Der vollständige Text ist unter <https://www.apache.org/licenses/LICENSE-2.0>
abrufbar und liegt jedem betroffenen Paket im Ordner \`node_modules\` bei.
An diesen Paketen wurden **keine Änderungen** vorgenommen; sie werden
unverändert eingebunden.

## Weitere Inhalte

- **Icons in der Anwendung**: Symbole stammen aus [Lucide](https://lucide.dev)
  (ISC). Die als Habit-Symbole wählbaren Emojis werden vom Betriebssystem des
  jeweiligen Geräts gerendert und sind nicht Teil dieses Projekts.
- **App-Icons und Favicon**: eigens für dieses Projekt erzeugt, siehe
  [scripts/generate-icons.mjs](scripts/generate-icons.mjs). Es wurden keine
  fremden Grafiken übernommen.
- **Schriftart**: die Anwendung verwendet ausschließlich Systemschriften, es
  werden keine Schriftdateien ausgeliefert.
`;

writeFileSync(join(WURZEL, 'THIRD-PARTY-NOTICES.md'), inhalt, 'utf8');
console.log(
  `THIRD-PARTY-NOTICES.md geschrieben: ${laufzeit.length} Laufzeit-, ${entwicklung.length} Entwicklungspakete (${lizenzarten.join(', ')})`,
);
