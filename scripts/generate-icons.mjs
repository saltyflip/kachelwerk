/**
 * Erzeugt die PWA-Icons rein rechnerisch - ohne native Abhaengigkeiten.
 * Das Motiv ist ein 3x3-Kachelraster in der Akzentfarbe, passend zur
 * Heatmap in der App.
 *
 * Aufruf: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = dirname(fileURLToPath(import.meta.url));
const ZIEL = join(HIER, '..', 'public', 'icons');

const HINTERGRUND = [0x0b, 0x0d, 0x10];
const AKZENT = [0x6d, 0x7c, 0xff];

// Deckkraft je Kachel, zeilenweise von oben links
const MUSTER = [
  [0.3, 1.0, 0.55],
  [1.0, 0.72, 1.0],
  [0.55, 1.0, 0.3],
];

// ---------------------------------------------------------------- PNG-Ausgabe

const CRC_TABELLE = (() => {
  const tabelle = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabelle[n] = c >>> 0;
  }
  return tabelle;
})();

function crc32(puffer) {
  let c = 0xffffffff;
  for (const byte of puffer) c = CRC_TABELLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(typ, daten) {
  const laenge = Buffer.alloc(4);
  laenge.writeUInt32BE(daten.length);
  const koerper = Buffer.concat([Buffer.from(typ, 'ascii'), daten]);
  const pruefsumme = Buffer.alloc(4);
  pruefsumme.writeUInt32BE(crc32(koerper));
  return Buffer.concat([laenge, koerper, pruefsumme]);
}

function alsPng(breite, hoehe, rgba) {
  const kopf = Buffer.alloc(13);
  kopf.writeUInt32BE(breite, 0);
  kopf.writeUInt32BE(hoehe, 4);
  kopf[8] = 8; // Bittiefe
  kopf[9] = 6; // Farbtyp RGBA
  kopf[10] = 0;
  kopf[11] = 0;
  kopf[12] = 0;

  // Jede Zeile bekommt ein fuehrendes Filterbyte (0 = ohne Filter)
  const zeilen = Buffer.alloc(hoehe * (breite * 4 + 1));
  for (let y = 0; y < hoehe; y++) {
    const ziel = y * (breite * 4 + 1);
    zeilen[ziel] = 0;
    rgba.copy(zeilen, ziel + 1, y * breite * 4, (y + 1) * breite * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', kopf),
    chunk('IDAT', deflateSync(zeilen, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- Zeichnen

/** Vorzeichenbehafteter Abstand zu einem abgerundeten Rechteck. */
function abstandRundRechteck(px, py, cx, cy, halbBreite, halbHoehe, radius) {
  const qx = Math.abs(px - cx) - (halbBreite - radius);
  const qy = Math.abs(py - cy) - (halbHoehe - radius);
  const aussen = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return Math.min(Math.max(qx, qy), 0) + aussen - radius;
}

/** Weiche Kante ueber rund einen Pixel. */
function deckung(abstand, weichheit) {
  return Math.min(1, Math.max(0, 0.5 - abstand / weichheit));
}

function mische(ziel, index, farbe, alpha) {
  if (alpha <= 0) return;
  const gegen = 1 - alpha;
  ziel[index] = Math.round(farbe[0] * alpha + ziel[index] * gegen);
  ziel[index + 1] = Math.round(farbe[1] * alpha + ziel[index + 1] * gegen);
  ziel[index + 2] = Math.round(farbe[2] * alpha + ziel[index + 2] * gegen);
  ziel[index + 3] = Math.round(255 * alpha + ziel[index + 3] * gegen);
}

/**
 * @param {number} groesse Kantenlaenge in Pixeln
 * @param {{vollflaechig?: boolean}} optionen vollflaechig = ohne abgerundete
 *   Ecken, fuer maskierbare Icons und den iOS-Homescreen
 */
function zeichne(groesse, optionen = {}) {
  const { vollflaechig = false } = optionen;
  const bild = Buffer.alloc(groesse * groesse * 4, 0);
  const weich = 1.2;

  // Kachelraster: drei Spalten, Abstand dazwischen
  const anteilKachel = vollflaechig ? 0.17 : 0.2;
  const anteilLuecke = vollflaechig ? 0.055 : 0.065;
  const kachel = groesse * anteilKachel;
  const luecke = groesse * anteilLuecke;
  const gesamt = kachel * 3 + luecke * 2;
  const start = (groesse - gesamt) / 2;
  const kachelRadius = kachel * 0.22;

  const mitte = groesse / 2;
  const halb = groesse / 2;
  const hintergrundRadius = vollflaechig ? 0 : groesse * 0.22;

  for (let y = 0; y < groesse; y++) {
    for (let x = 0; x < groesse; x++) {
      const index = (y * groesse + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      const hintergrund = vollflaechig
        ? 1
        : deckung(abstandRundRechteck(px, py, mitte, mitte, halb, halb, hintergrundRadius), weich);
      mische(bild, index, HINTERGRUND, hintergrund);

      for (let zeile = 0; zeile < 3; zeile++) {
        for (let spalte = 0; spalte < 3; spalte++) {
          const cx = start + spalte * (kachel + luecke) + kachel / 2;
          const cy = start + zeile * (kachel + luecke) + kachel / 2;
          if (Math.abs(px - cx) > kachel || Math.abs(py - cy) > kachel) continue;

          const d = abstandRundRechteck(px, py, cx, cy, kachel / 2, kachel / 2, kachelRadius);
          const alpha = deckung(d, weich) * MUSTER[zeile][spalte] * hintergrund;
          mische(bild, index, AKZENT, alpha);
        }
      }
    }
  }

  return bild;
}

function svgFavicon() {
  const kacheln = MUSTER.flatMap((zeile, z) =>
    zeile.map((deckkraft, s) => {
      const x = (14 + s * 24).toFixed(0);
      const y = (14 + z * 24).toFixed(0);
      return `<rect x="${x}" y="${y}" width="20" height="20" rx="4.5" fill="#6d7cff" fill-opacity="${deckkraft}"/>`;
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" rx="21" fill="#0b0d10"/>
  ${kacheln.join('\n  ')}
</svg>
`;
}

// ---------------------------------------------------------------- Ausfuehrung

mkdirSync(ZIEL, { recursive: true });

const dateien = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { vollflaechig: true }],
  ['apple-touch-icon-180.png', 180, { vollflaechig: true }],
];

for (const [name, groesse, optionen] of dateien) {
  const png = alsPng(groesse, groesse, zeichne(groesse, optionen));
  writeFileSync(join(ZIEL, name), png);
  console.log(`${name.padEnd(28)} ${groesse}x${groesse}  ${(png.length / 1024).toFixed(1)} kB`);
}

writeFileSync(join(ZIEL, 'favicon.svg'), svgFavicon(), 'utf8');
console.log('favicon.svg                  96x96');
