/**
 * Prepare static WAPS deployment for an independent Cloudflare Pages site.
 * Deliberately leaves GitHub Pages and the existing WAPS source untouched.
 * Cloudflare Pages build command: node scripts/build-cloudflare-pages.mjs
 * Output directory: dist
 */
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = process.cwd();
const output = join(root, 'dist');
const sourceAssets = join(root, 'assets');
const allowed = new Set([
  '.html', '.css', '.js', '.json', '.webmanifest', '.svg',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.avif',
  '.b64', '.woff2', '.woff', '.ttf', '.otf', '.mp3', '.wav',
  '.ogg', '.m4a', '.mp4', '.webm', '.pdf', '.txt', '.xml', '.wasm'
]);

if (!existsSync(join(root, 'index.html')) || !existsSync(sourceAssets)) {
  throw new Error('Run this script from the WAPS repository root.');
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && allowed.has(extname(entry.name).toLowerCase())) {
    copyFileSync(join(root, entry.name), join(output, entry.name));
  }
}
cpSync(sourceAssets, join(output, 'assets'), { recursive: true });

const html = readFileSync(join(output, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) {
  const relativePath = match[1].slice(2).split(/[?#]/)[0];
  if (!existsSync(join(output, relativePath))) {
    throw new Error('Cloudflare Pages output missing WAPS HTML asset: ' + relativePath);
  }
}
for (const needed of ['app.js', 'app.css', 'sw.js', 'manifest.webmanifest', 'data.js', 'storage.js']) {
  if (!existsSync(join(output, needed)) || !statSync(join(output, needed)).isFile()) {
    throw new Error('Cloudflare Pages output missing WAPS core file: ' + needed);
  }
}
if (existsSync(join(output, 'CNAME'))) {
  throw new Error('GitHub Pages CNAME must not be deployed for dual-domain hosting.');
}
console.log('WAPS Cloudflare Pages static bundle ready: dist (GitHub Pages unaffected).');
