import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcVal = crc32(crcTarget);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

function generatePng(size) {
  const width = size;
  const height = size;

  // Each scanline: 1 byte filter (0) + width * 4 bytes (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = size * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Gradient background: Rose (#e11d48) to Purple (#9333ea) to Amber (#d97706)
      const t = (x + y) / (width + height);
      let r = 0, g = 0, b = 0, a = 255;

      if (t < 0.5) {
        const factor = t / 0.5;
        r = Math.round(225 * (1 - factor) + 147 * factor);
        g = Math.round(29 * (1 - factor) + 51 * factor);
        b = Math.round(72 * (1 - factor) + 234 * factor);
      } else {
        const factor = (t - 0.5) / 0.5;
        r = Math.round(147 * (1 - factor) + 217 * factor);
        g = Math.round(51 * (1 - factor) + 119 * factor);
        b = Math.round(234 * (1 - factor) + 6 * factor);
      }

      // Rounded squircle corner clipping
      const cornerRadius = size * 0.22;
      let inBounds = true;
      if (x < cornerRadius && y < cornerRadius) {
        const dx = cornerRadius - x;
        const dy = cornerRadius - y;
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) inBounds = false;
      } else if (x > width - cornerRadius && y < cornerRadius) {
        const dx = x - (width - cornerRadius);
        const dy = cornerRadius - y;
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) inBounds = false;
      } else if (x < cornerRadius && y > height - cornerRadius) {
        const dx = cornerRadius - x;
        const dy = y - (height - cornerRadius);
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) inBounds = false;
      } else if (x > width - cornerRadius && y > height - cornerRadius) {
        const dx = x - (width - cornerRadius);
        const dy = y - (height - cornerRadius);
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) inBounds = false;
      }

      if (!inBounds) {
        a = 0;
      } else {
        // Inner circle highlight
        const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (distFromCenter < radius) {
          r = Math.min(255, r + 25);
          g = Math.min(255, g + 25);
          b = Math.min(255, b + 35);
        }
        // Center icon highlight (stylized mic + speech dots)
        if (Math.abs(x - cx) < size * 0.08 && y > size * 0.35 && y < size * 0.65) {
          r = 255; g = 255; b = 255;
        }
        if (Math.abs(y - cy) < size * 0.04 && x > size * 0.28 && x < size * 0.72) {
          r = 255; g = 245; b = 180;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const outDir = path.resolve('public');
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), generatePng(192));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), generatePng(512));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), generatePng(512));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), generatePng(180));
console.log('PWA PNG icons generated successfully in public/');
