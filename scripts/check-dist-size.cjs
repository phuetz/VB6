#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distDir = path.join(process.cwd(), 'dist');
const assetsDir = path.join(distDir, 'assets');

const MAX_TOTAL_JS_KB = 1500; // 1.5 MB
const MAX_CHUNK_KB = 600; // 0.6 MB per chunk

function formatKB(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

if (!fs.existsSync(distDir) || !fs.existsSync(assetsDir)) {
  console.error('dist/assets not found. Run `npm run build` first.');
  process.exit(2);
}

const files = fs.readdirSync(assetsDir).filter(f => /(\.js|\.css)$/.test(f));
let totalJsBytes = 0;
let largestChunkBytes = 0;

for (const f of files) {
  const p = path.join(assetsDir, f);
  const stat = fs.statSync(p);
  if (f.endsWith('.js')) totalJsBytes += stat.size;
  if (stat.size > largestChunkBytes) largestChunkBytes = stat.size;
}

const totalJsKB = formatKB(totalJsBytes);
const largestKB = formatKB(largestChunkBytes);

let ok = true;
if (totalJsKB > MAX_TOTAL_JS_KB) {
  console.error(`❌ Total JS size ${totalJsKB}KB exceeds budget ${MAX_TOTAL_JS_KB}KB`);
  ok = false;
}
if (largestKB > MAX_CHUNK_KB) {
  console.error(`❌ Largest chunk ${largestKB}KB exceeds budget ${MAX_CHUNK_KB}KB`);
  ok = false;
}

if (ok) {
  console.log(`✅ Bundle within budget. Total JS: ${totalJsKB}KB, Largest: ${largestKB}KB`);
  process.exit(0);
} else {
  process.exit(1);
}

