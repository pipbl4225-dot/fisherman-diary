import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath   = join(__dirname, '../public/icons/icon.svg');
const svg       = readFileSync(svgPath);

const sizes = [
  { name: 'icon-72.png',   size: 72 },
  { name: 'icon-96.png',   size: 96 },
  { name: 'icon-128.png',  size: 128 },
  { name: 'icon-144.png',  size: 144 },
  { name: 'icon-152.png',  size: 152 },
  { name: 'icon-192.png',  size: 192 },
  { name: 'icon-384.png',  size: 384 },
  { name: 'icon-512.png',  size: 512 },
];

for (const { name, size } of sizes) {
  const out = join(__dirname, '../public/icons', name);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`✓ ${name}`);
}
