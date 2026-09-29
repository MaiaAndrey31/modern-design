// One-off dev script: generates elegant gradient placeholder PNGs so the
// site has visual placeholders without downloading external stock photos.
// Run: node scripts/generate-placeholders.mjs
// Replace every /public/images/placeholder-*.png with official photography
// before launch (see README).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images");
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

/** Vertical gradient + very subtle horizontal vignette, encoded as a baseline PNG. */
function generateGradientPng(width, height, topHex, bottomHex) {
  const top = hexToRgb(topHex);
  const bottom = hexToRgb(bottomHex);
  const rowSize = width * 3 + 1;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const r = lerp(top[0], bottom[0], t);
    const g = lerp(top[1], bottom[1], t);
    const b = lerp(top[2], bottom[2], t);
    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const vignette = 1 - Math.abs(x / width - 0.5) * 0.25;
      const px = rowStart + 1 + x * 3;
      raw[px] = Math.max(0, Math.min(255, Math.round(r * vignette)));
      raw[px + 1] = Math.max(0, Math.min(255, Math.round(g * vignette)));
      raw[px + 2] = Math.max(0, Math.min(255, Math.round(b * vignette)));
    }
  }

  const idat = deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const LANDSCAPE = [1920, 1080];
const PORTRAIT = [1200, 1500];
const SQUARE = [1200, 1200];

const PLACEHOLDERS = [
  { name: "placeholder-hero", size: LANDSCAPE, top: "#3a2a12", bottom: "#050505" },
  { name: "placeholder-story", size: LANDSCAPE, top: "#2a2a2a", bottom: "#050505" },
  { name: "placeholder-stage", size: LANDSCAPE, top: "#101820", bottom: "#050505" },
  { name: "placeholder-transition", size: LANDSCAPE, top: "#3a120f", bottom: "#050505" },
  { name: "placeholder-experience-1", size: LANDSCAPE, top: "#332211", bottom: "#050505" },
  { name: "placeholder-experience-2", size: PORTRAIT, top: "#221a10", bottom: "#050505" },
  { name: "placeholder-experience-3", size: PORTRAIT, top: "#101010", bottom: "#050505" },
  { name: "placeholder-experience-4", size: LANDSCAPE, top: "#1c1c1c", bottom: "#050505" },
  { name: "placeholder-gallery-1", size: LANDSCAPE, top: "#2e2313", bottom: "#050505" },
  { name: "placeholder-gallery-2", size: PORTRAIT, top: "#241f14", bottom: "#050505" },
  { name: "placeholder-gallery-3", size: SQUARE, top: "#1a1a1a", bottom: "#050505" },
  { name: "placeholder-gallery-4", size: PORTRAIT, top: "#141414", bottom: "#050505" },
  { name: "placeholder-gallery-5", size: LANDSCAPE, top: "#26170f", bottom: "#050505" },
  { name: "placeholder-gallery-6", size: PORTRAIT, top: "#1f1a12", bottom: "#050505" },
  { name: "placeholder-gallery-7", size: SQUARE, top: "#181818", bottom: "#050505" },
  { name: "placeholder-gallery-8", size: LANDSCAPE, top: "#20140c", bottom: "#050505" },
];

for (const { name, size, top, bottom } of PLACEHOLDERS) {
  const png = generateGradientPng(size[0], size[1], top, bottom);
  writeFileSync(join(outDir, `${name}.png`), png);
  console.log(`generated ${name}.png (${size[0]}x${size[1]})`);
}
