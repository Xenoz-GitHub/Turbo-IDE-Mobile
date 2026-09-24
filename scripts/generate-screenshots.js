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

function createScreenshotPng(width, height, isMobile) {
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = writeChunk('IHDR', ihdr);
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    const ny = y / height;

    for (let x = 0; x < width; x++) {
      const nx = x / width;

      // Borland Turbo C++ Blue #0000AA
      let r = 0x00, g = 0x00, b = 0xAA, a = 0xFF;

      // Top Menu Bar (height ~ 32px)
      if (y < 36) {
        // Cyan background #00AAAA
        r = 0x00; g = 0xAA; b = 0xAA;
        if (x % 140 < 100 && y > 8 && y < 28) {
          // Menu item contrast text
          r = 0x00; g = 0x00; b = 0x00;
        }
      }
      // Bottom Status Bar (height ~ 32px)
      else if (y > height - 36) {
        r = 0x00; g = 0xAA; b = 0xAA;
        if (x % 120 < 90 && y > height - 28 && y < height - 8) {
          r = 0x00; g = 0x00; b = 0x00;
        }
      }
      // Mobile Virtual Keyboard Area (lower 35% on mobile)
      else if (isMobile && ny > 0.65) {
        // Dark grey keyboard background #18181b
        r = 0x18; g = 0x18; b = 0x1B;
        // Key grid
        const kx = Math.floor(nx * 10);
        const ky = Math.floor((ny - 0.65) / 0.35 * 4);
        const subX = (nx * 10) % 1;
        const subY = ((ny - 0.65) / 0.35 * 4) % 1;
        if (subX > 0.08 && subX < 0.92 && subY > 0.12 && subY < 0.88) {
          r = 0x27; g = 0x27; b = 0x2A; // Key cap
          if (subY < 0.20) {
            r = 0x3F; g = 0x3F; b = 0x46; // Key highlight
          }
        }
      }
      // Editor Window Frame
      else {
        // Window Border
        const marginX = isMobile ? 12 : 32;
        const marginTop = 48;
        const marginBottom = isMobile ? Math.floor(height * 0.35) + 12 : 48;

        if (x >= marginX && x <= width - marginX && y >= marginTop && y <= height - marginBottom) {
          // Border edges
          if (x === marginX || x === width - marginX || y === marginTop || y === height - marginBottom) {
            r = 0xFF; g = 0xFF; b = 0xFF; // White double border
          } else if (x === marginX + 1 || x === width - marginX - 1 || y === marginTop + 1 || y === height - marginBottom - 1) {
            r = 0x00; g = 0xAA; b = 0xAA; // Cyan inner
          } else {
            // Editor background: classic Borland Blue #000088
            r = 0x00; g = 0x00; b = 0x88;

            // Fake code lines
            const lineY = (y - marginTop - 16) % 20;
            const lineIdx = Math.floor((y - marginTop - 16) / 20);
            if (lineIdx >= 0 && lineIdx < 25 && lineY > 4 && lineY < 14) {
              const lineLen = ((lineIdx * 73 + 19) % 55) / 100 * (width - marginX * 2);
              if (x - marginX - 24 > 0 && x - marginX - 24 < lineLen) {
                // Syntax coloring: Yellow/White/Cyan
                if (lineIdx % 4 === 0) {
                  r = 0xFF; g = 0xFF; b = 0x55; // Yellow keywords
                } else if (lineIdx % 4 === 1) {
                  r = 0x00; g = 0xAA; b = 0xAA; // Cyan includes
                } else if (lineIdx % 4 === 2) {
                  r = 0x55; g = 0xFF; b = 0x55; // Green strings
                } else {
                  r = 0xFF; g = 0xFF; b = 0xFF; // White text
                }
              }
            }
          }
        } else {
          // Desktop Dither Pattern
          if ((x + y) % 4 === 0) {
            r = 0x55; g = 0x55; b = 0xAA;
          } else {
            r = 0x00; g = 0x00; b = 0x88;
          }
        }
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

if (!fs.existsSync('public/screenshots')) {
  fs.mkdirSync('public/screenshots', { recursive: true });
}

fs.writeFileSync('public/screenshots/screenshot-desktop.png', createScreenshotPng(1280, 720, false));
fs.writeFileSync('public/screenshots/screenshot-mobile.png', createScreenshotPng(720, 1280, true));

console.log('Successfully generated PWA screenshots for desktop & mobile!');
