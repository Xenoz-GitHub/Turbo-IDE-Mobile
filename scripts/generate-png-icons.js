import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  table[i] = c;
}

function writeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

/**
 * Creates an authentic Borland Turbo C++ App Icon PNG
 * - Blue matrix punch-hole grids in top-left and bottom-right corners
 * - Golden yellow diagonal rails
 * - Vermilion red diagonal banner
 * - 3D Cyan "C++" with black drop shadow and white highlights
 */
function createTcIconPng(width, height, isMaskable = false) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = writeChunk('IHDR', ihdr);

  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    const ny = y / height;

    for (let x = 0; x < width; x++) {
      const nx = x / width;

      // Base color: Borland deep blue #000088
      let r = 0x00, g = 0x00, b = 0x88, a = 0xFF;

      // Diagonal coordinate along the split: (nx + ny)
      const d = nx + ny;

      // Top-Left corner (d < 0.65)
      if (d < 0.65) {
        // Grid pattern for punch-hole matrix
        const gx = Math.floor(nx * 14);
        const gy = Math.floor(ny * 14);
        const subX = (nx * 14) % 1;
        const subY = (ny * 14) % 1;

        if (subX > 0.3 && subX < 0.8 && subY > 0.3 && subY < 0.8) {
          r = 0xFF; g = 0xFF; b = 0xFF; // White punch-hole center
        } else {
          r = 0x00; g = 0x00; b = 0xAA; // Blue grid body
        }
      }
      // Bottom-Right corner (d > 1.35)
      else if (d > 1.35) {
        const gx = Math.floor(nx * 14);
        const gy = Math.floor(ny * 14);
        const subX = (nx * 14) % 1;
        const subY = (ny * 14) % 1;

        if (subX > 0.3 && subX < 0.8 && subY > 0.3 && subY < 0.8) {
          r = 0xFF; g = 0xFF; b = 0xFF;
        } else {
          r = 0x00; g = 0x00; b = 0xAA;
        }
      }
      // Diagonal Yellow Rails
      else if (Math.abs(d - 0.65) < 0.025 || Math.abs(d - 1.35) < 0.025) {
        r = 0xFF; g = 0xDD; b = 0x00; // Gold rail
      }
      // Center Red Banner (0.65 <= d <= 1.35)
      else {
        // Vermilion base
        r = 0xDD; g = 0x22; b = 0x00;

        // Gold stipple dither texture
        if ((x + y * 2) % 5 === 0) {
          r = 0xFF; g = 0x88; b = 0x00;
        }

        // Central "C" glyph (approx normalized center)
        const cx = nx - 0.38;
        const cy = ny - 0.50;
        const dist = Math.sqrt(cx * cx + cy * cy);

        // Letter C
        if (dist > 0.12 && dist < 0.23 && !(cx > 0.04 && Math.abs(cy) < 0.12)) {
          // Drop shadow
          r = 0x00; g = 0xEE; b = 0xEE; // Cyan face
          if (cy < -0.08 || (cx < -0.08 && cy < 0.05)) {
            r = 0xFF; g = 0xFF; b = 0xFF; // White top highlight
          }
        } else if (dist > 0.12 && dist < 0.25 && cx > -0.05 && cy > 0.04 && !(cx > 0.06 && Math.abs(cy) < 0.10)) {
          // Black drop shadow
          r = 0x00; g = 0x00; b = 0x00;
        }

        // First Plus "+"
        const p1x = Math.abs(nx - 0.60);
        const p1y = Math.abs(ny - 0.38);
        if ((p1x < 0.03 && p1y < 0.09) || (p1x < 0.09 && p1y < 0.03)) {
          r = 0x00; g = 0xEE; b = 0xEE;
          if (ny < 0.35 || nx < 0.56) {
            r = 0xFF; g = 0xFF; b = 0xFF; // highlight
          }
        } else if ((Math.abs(nx - 0.62) < 0.03 && Math.abs(ny - 0.40) < 0.09) ||
                   (Math.abs(nx - 0.62) < 0.09 && Math.abs(ny - 0.40) < 0.03)) {
          r = 0x00; g = 0x00; b = 0x00; // shadow
        }

        // Second Plus "+"
        const p2x = Math.abs(nx - 0.76);
        const p2y = Math.abs(ny - 0.52);
        if ((p2x < 0.03 && p2y < 0.09) || (p2x < 0.09 && p2y < 0.03)) {
          r = 0x00; g = 0xEE; b = 0xEE;
          if (ny < 0.49 || nx < 0.72) {
            r = 0xFF; g = 0xFF; b = 0xFF; // highlight
          }
        } else if ((Math.abs(nx - 0.78) < 0.03 && Math.abs(ny - 0.54) < 0.09) ||
                   (Math.abs(nx - 0.78) < 0.09 && Math.abs(ny - 0.54) < 0.03)) {
          r = 0x00; g = 0x00; b = 0x00; // shadow
        }
      }

      // Outer black bevel border
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        r = 0x00; g = 0x00; b = 0x00;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = writeChunk('IDAT', compressed);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Generate all target PNGs
fs.writeFileSync('public/pwa-192x192.png', createTcIconPng(192, 192));
fs.writeFileSync('public/pwa-512x512.png', createTcIconPng(512, 512));
fs.writeFileSync('public/pwa-maskable-512x512.png', createTcIconPng(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', createTcIconPng(180, 180));

console.log('Successfully generated authentic Borland C++ icon PNGs!');
