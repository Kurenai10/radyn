'use strict';

/**
 * Uygulama ve görev çubuğu ikonlarını PNG olarak üretir (harici bağımlılık yok).
 * Çalıştırma: npm run icons
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets');
const SS = 4; // süper örnekleme: kenar yumuşatma

// ---- PNG kodlayıcı -------------------------------------------------------

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
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filtre: yok
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit derinliği
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Geometri (koordinatlar 0..1 aralığında) -----------------------------

const inRect = (x0, y0, x1, y1) => (u, v) => u >= x0 && u <= x1 && v >= y0 && v <= y1;

function inTriangle(ax, ay, bx, by, cx, cy) {
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  return (u, v) => {
    const d1 = sign(u, v, ax, ay, bx, by);
    const d2 = sign(u, v, bx, by, cx, cy);
    const d3 = sign(u, v, cx, cy, ax, ay);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  };
}

/** Merkezden açılan yay: r1..r2 halkası, ±halfAngle içinde. */
function inArc(cx, cy, r1, r2, halfAngle) {
  return (u, v) => {
    const dx = u - cx;
    const dy = v - cy;
    const d = Math.hypot(dx, dy);
    if (d < r1 || d > r2) return false;
    return Math.abs(Math.atan2(dy, dx)) <= halfAngle;
  };
}

function inRoundRect(x0, y0, x1, y1, r) {
  return (u, v) => {
    if (u < x0 || u > x1 || v < y0 || v > y1) return false;
    const cx = Math.min(Math.max(u, x0 + r), x1 - r);
    const cy = Math.min(Math.max(v, y0 + r), y1 - r);
    return Math.hypot(u - cx, v - cy) <= r;
  };
}

const anyOf = (...fns) => (u, v) => fns.some((fn) => fn(u, v));

// ---- Çizim ----------------------------------------------------------------

/**
 * @param {number} size piksel boyutu
 * @param {{ fill: [number,number,number], inside: (u,v)=>boolean }[]} layers
 *   sırayla üst üste çizilir; her katmanın kendi rengi ve alanı vardır
 */
function rasterize(size, layers) {
  const out = Buffer.alloc(size * size * 4);
  const samples = SS * SS;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          for (const layer of layers) {
            if (layer.inside(u, v)) {
              r += layer.fill[0];
              g += layer.fill[1];
              b += layer.fill[2];
              a += 255;
              break; // üst katman kazanır
            }
          }
        }
      }
      const i = (y * size + x) * 4;
      const covered = a / 255;
      if (covered > 0) {
        out[i] = Math.round(r / covered);
        out[i + 1] = Math.round(g / covered);
        out[i + 2] = Math.round(b / covered);
      }
      out[i + 3] = Math.round(a / samples);
    }
  }
  return out;
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// Uygulama simgesi: koyu-mavi rozet, beyaz oynat üçgeni ve radyo dalgaları.
function appIcon(size) {
  const white = hex('#ffffff');
  // Kompozisyon yatayda ortalı: üçgen solda, dalgalar sağda.
  const play = inTriangle(0.22, 0.33, 0.22, 0.67, 0.46, 0.5);
  const waves = anyOf(
    inArc(0.14, 0.5, 0.36, 0.4, 0.7),
    inArc(0.14, 0.5, 0.48, 0.52, 0.7),
    inArc(0.14, 0.5, 0.6, 0.64, 0.7),
  );
  return rasterize(size, [
    { fill: white, inside: anyOf(play, waves) },
    { fill: hex('#2f5fe0'), inside: inRoundRect(0.02, 0.02, 0.98, 0.98, 0.22) },
  ]);
}

// Görev çubuğu düğmeleri: açık gri glif (koyu ve açık temalarda okunur).
function buttonIcon(size, shape) {
  const glyph = hex('#e8ebf0');
  const shapes = {
    play: [inTriangle(0.32, 0.25, 0.32, 0.75, 0.8, 0.5)],
    pause: [inRect(0.28, 0.25, 0.44, 0.75), inRect(0.56, 0.25, 0.72, 0.75)],
    prev: [inRect(0.18, 0.25, 0.28, 0.75), inTriangle(0.82, 0.25, 0.82, 0.75, 0.36, 0.5)],
    next: [inRect(0.72, 0.25, 0.82, 0.75), inTriangle(0.18, 0.25, 0.18, 0.75, 0.64, 0.5)],
  };
  return rasterize(size, [{ fill: glyph, inside: anyOf(...shapes[shape]) }]);
}

// Tepsi simgesi: uygulama simgesiyle aynı, küçük boyutta.
function trayIcon(size) {
  return appIcon(size);
}

// ---- Dosyalar -------------------------------------------------------------

fs.mkdirSync(OUT, { recursive: true });
const files = [
  ['icon.png', encodePng(512, appIcon(512))],
  ['tray.png', encodePng(32, trayIcon(32))],
  ['btn-prev.png', encodePng(32, buttonIcon(32, 'prev'))],
  ['btn-play.png', encodePng(32, buttonIcon(32, 'play'))],
  ['btn-pause.png', encodePng(32, buttonIcon(32, 'pause'))],
  ['btn-next.png', encodePng(32, buttonIcon(32, 'next'))],
];
for (const [name, data] of files) {
  fs.writeFileSync(path.join(OUT, name), data);
  console.log(`yazıldı: ${path.join(OUT, name)} (${data.length} bayt)`);
}
