/**
 * Menghasilkan raster favicon dari public/images/icon.png ke public/images/favicons/.
 * Jalankan: npm run generate:favicons (setelah npm install).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "images", "icon.png");
const OUT = path.join(ROOT, "public", "images", "favicons");
const APP_ICON = path.join(ROOT, "src", "app", "icon.png");

const OUTPUTS: [string, number][] = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
  ["apple-touch-icon.png", 180],
  ["apple-touch-icon-152x152.png", 152],
  ["apple-touch-icon-120x120.png", 120],
  ["apple-touch-icon-76x76.png", 76],
  ["apple-touch-icon-60x60.png", 60],
  ["mstile-150x150.png", 150],
];

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`Sumber tidak ada: ${SRC}`);
  }
  await fs.promises.mkdir(OUT, { recursive: true });

  for (const [filename, size] of OUTPUTS) {
    await sharp(SRC).resize(size, size).png().toFile(path.join(OUT, filename));
  }

  await fs.promises.mkdir(path.dirname(APP_ICON), { recursive: true });
  await fs.promises.copyFile(SRC, APP_ICON);

  console.log(`OK: ${OUTPUTS.length} file di public/images/favicons + src/app/icon.png`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
