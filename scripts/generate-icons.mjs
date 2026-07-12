/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 12/07/2026 (Ora di Roma)
 * Problema Risolto: Generazione one-off delle icone PWA (192, 512, maskable-512)
 * a partire da un SVG puro-vettoriale (nessun font/glyph, rasterizzazione
 * affidabile), nello stile dell'header: corona bianca su sfondo color accento.
 *
 * Uso: `node scripts/generate-icons.mjs` (richiede la devDependency "sharp").
 * I PNG generati vengono committati in public/icons/.
 */

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ACCENT = '#92400E'; // --color-app-accent (tema principale)
const WHITE = '#FFFFFF';  // --color-app-on-accent

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT_DIR, { recursive: true });

/**
 * Corona (re degli scacchi) definita in coordinate locali ~[40..260]x[18..258],
 * centro locale (150, 138). Punte + base + crocetta in cima + "gemme" (fori che
 * mostrano lo sfondo accento sulla banda).
 */
function crownGroup(scale) {
  // Traslazione per centrare il box locale (centro 150,138) al centro del canvas 512.
  const tx = 256 - 150 * scale;
  const ty = 256 - 138 * scale;
  return `
    <g transform="translate(${tx} ${ty}) scale(${scale})">
      <path fill="${WHITE}" stroke-linejoin="round"
        d="M40,205 L70,95 L120,165 L150,80 L180,165 L230,95 L260,205
           L260,248 Q260,258 250,258 L50,258 Q40,258 40,248 Z" />
      <!-- Crocetta del re in cima alla punta centrale -->
      <rect x="145" y="22" width="10" height="62" rx="3" fill="${WHITE}" />
      <rect x="132" y="40" width="36" height="10" rx="3" fill="${WHITE}" />
      <!-- Gemme (fori) sulla banda, mostrano il colore di sfondo -->
      <circle cx="100" cy="232" r="8" fill="${ACCENT}" />
      <circle cx="150" cy="232" r="8" fill="${ACCENT}" />
      <circle cx="200" cy="232" r="8" fill="${ACCENT}" />
    </g>`;
}

function svg({ maskable }) {
  // "any": tile arrotondata (come nell'header). "maskable": full-bleed quadrato
  // (nessun angolo trasparente) e corona più piccola (padding di sicurezza).
  const bg = maskable
    ? `<rect width="512" height="512" fill="${ACCENT}" />`
    : `<rect width="512" height="512" rx="96" ry="96" fill="${ACCENT}" />`;
  const scale = maskable ? 1.15 : 1.55;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${bg}
    ${crownGroup(scale)}
  </svg>`;
}

async function render(svgString, size, filename) {
  const outPath = path.join(OUT_DIR, filename);
  await sharp(Buffer.from(svgString)).resize(size, size).png().toFile(outPath);
  console.log(`[generate-icons] Creato ${path.relative(path.join(__dirname, '..'), outPath)} (${size}x${size})`);
}

const anySvg = svg({ maskable: false });
const maskableSvg = svg({ maskable: true });

await render(anySvg, 192, 'icon-192.png');
await render(anySvg, 512, 'icon-512.png');
await render(maskableSvg, 512, 'maskable-icon-512.png');

console.log('[generate-icons] Icone PWA generate in public/icons/.');
