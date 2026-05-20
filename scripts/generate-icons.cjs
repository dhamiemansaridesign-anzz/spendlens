#!/usr/bin/env node
/**
 * Generates icon-192.png and icon-512.png in public/icons/
 * using pure Node.js built-ins — no external dependencies needed.
 * Run: node scripts/generate-icons.js
 */
const fs   = require('node:fs')
const path = require('node:path')
const zlib = require('node:zlib')

// ── CRC32 ────────────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c
}
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length)
  const crcVal = Buffer.allocUnsafe(4); crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcVal])
}

// ── 5×7 bitmap glyphs (1 = white pixel) ────────────────────────────────────
const GLYPHS = {
  S: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  L: [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
}
const CHAR_W = 5, CHAR_H = 7, GAP = 2

function makePNG(size) {
  const px = new Uint8Array(size * size * 4) // RGBA, starts transparent

  // Blue circle (#0052ff)
  const cx = size / 2, cy = size / 2, r = (size / 2) * 0.90
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
        const i = (y * size + x) * 4
        px[i] = 0x00; px[i+1] = 0x52; px[i+2] = 0xFF; px[i+3] = 0xFF
      }
    }
  }

  // "SL" in white
  const ps      = Math.max(2, Math.floor(size / 26))            // pixel scale
  const totalW  = (CHAR_W * 2 + GAP) * ps
  const startX  = Math.floor((size - totalW) / 2)
  const startY  = Math.floor((size - CHAR_H * ps) / 2)

  function drawGlyph(g, offsetX) {
    for (let row = 0; row < g.length; row++) {
      for (let col = 0; col < g[row].length; col++) {
        if (!g[row][col]) continue
        for (let dy = 0; dy < ps; dy++) {
          for (let dx = 0; dx < ps; dx++) {
            const x = startX + offsetX + col * ps + dx
            const y = startY + row * ps + dy
            if (x >= 0 && x < size && y >= 0 && y < size) {
              const i = (y * size + x) * 4
              px[i] = px[i+1] = px[i+2] = px[i+3] = 0xFF
            }
          }
        }
      }
    }
  }

  drawGlyph(GLYPHS.S, 0)
  drawGlyph(GLYPHS.L, (CHAR_W + GAP) * ps)

  // ── Encode PNG ─────────────────────────────────────────────────────────────
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = ihdr[11] = ihdr[12] = 0  // RGBA-8

  const stride = size * 4
  const rows   = Buffer.allocUnsafe(size * (stride + 1))
  for (let y = 0; y < size; y++) {
    rows[y * (stride + 1)] = 0  // filter byte: None
    Buffer.from(px.buffer, y * stride, stride).copy(rows, y * (stride + 1) + 1)
  }

  const idat = zlib.deflateSync(rows, { level: 9 })

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),  // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Write files ────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const buf  = makePNG(size)
  const file = path.join(outDir, `icon-${size}.png`)
  fs.writeFileSync(file, buf)
  console.log(`✓  icon-${size}.png  (${(buf.length / 1024).toFixed(1)} KB)`)
}
console.log('Done.')
