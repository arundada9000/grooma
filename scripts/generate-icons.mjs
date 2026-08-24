/**
 * Generates the PWA icon set under public/icons without any image
 * dependencies: a tiny hand-rolled PNG encoder plus pixel math for the
 * barber-pole mark. Run once via `node scripts/generate-icons.mjs` and
 * commit the outputs.
 *
 *   icon-{48,192,512}.png       rounded badge, transparent corners
 *   maskable-{192,512}.png      full-bleed background, art in safe circle
 *   apple-touch-icon.png        180px full-bleed square (iOS masks it)
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "icons");

const ACCENT = [132, 87, 42]; // classic barbershop espresso #84572a
const CREAM = [245, 239, 230]; // #f5efe6

/* ---------- minimal PNG encoder (truecolor + alpha) ---------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- artwork ---------- */

/** Rounded-square signed distance; negative inside. */
function roundedRectSdf(x, y, size, radius) {
  const half = size / 2;
  const cx = Math.abs(x - half) - (half - radius);
  const cy = Math.abs(y - half) - (half - radius);
  const outside = Math.hypot(Math.max(cx, 0), Math.max(cy, 0));
  return outside + Math.min(Math.max(cx, cy), 0) - radius;
}

/** Barber-pole diagonal stripe sample in [0,1]; 1 means cream. */
function stripe(x, y, period) {
  const phase = (((x + y) % period) + period) % period;
  return phase < period * 0.45 ? 1 : 0;
}

/**
 * Renders one pixel with 3x3 supersampling. painter(x, y) returns
 * [r, g, b, a] in 0..255 for sub-sample coordinates.
 */
function samplePixel(size, px, py, painter) {
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  for (let sy = 0; sy < 3; sy++) {
    for (let sx = 0; sx < 3; sx++) {
      const [pr, pg, pb, pa] = painter(px + (sx + 0.5) / 3, py + (sy + 0.5) / 3);
      r += pr * pa;
      g += pg * pa;
      b += pb * pa;
      a += pa;
    }
  }
  const n = 9;
  if (a === 0) return [0, 0, 0, 0];
  return [Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round((a / n) * 255)];
}

/** Badge icon: rounded square, diagonal stripes, transparent corners. */
function renderBadge(size) {
  const radius = size * 0.22;
  const period = size * 0.24;
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = samplePixel(size, x, y, (fx, fy) => {
        const d = roundedRectSdf(fx, fy, size, radius);
        const coverage = Math.min(1, Math.max(0, 0.5 - d));
        const cream = stripe(fx, fy, period) === 1;
        const c = cream ? CREAM : ACCENT;
        return [c[0], c[1], c[2], coverage];
      });
      const i = (y * size + x) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = a;
    }
  }
  return encodePng(size, size, rgba);
}

/** Full-bleed background with stripes clipped to the maskable safe circle. */
function renderMaskable(size) {
  const center = size / 2;
  const safeRadius = size * 0.38;
  const period = size * 0.19;
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = samplePixel(size, x, y, (fx, fy) => {
        const dist = Math.hypot(fx - center, fy - center);
        const coverage = Math.min(1, Math.max(0, 0.5 - (dist - safeRadius)));
        if (coverage <= 0) return [ACCENT[0], ACCENT[1], ACCENT[2], 1];
        const cream = stripe(fx, fy, period) === 1;
        const c = cream ? CREAM : ACCENT;
        return [c[0], c[1], c[2], coverage];
      });
      const i = (y * size + x) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = a;
    }
  }
  return encodePng(size, size, rgba);
}

mkdirSync(OUT, { recursive: true });

for (const size of [48, 192, 512]) {
  writeFileSync(join(OUT, `icon-${size}.png`), renderBadge(size));
}
for (const size of [192, 512]) {
  writeFileSync(join(OUT, `maskable-${size}.png`), renderMaskable(size));
}
writeFileSync(join(OUT, "apple-touch-icon.png"), renderBadge(180));

console.log("icons written to public/icons");
