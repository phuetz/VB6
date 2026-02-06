#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distDir = path.join(process.cwd(), 'dist');
const assetsDir = path.join(distDir, 'assets');

// Budgets (KB) - Monaco is excluded as it's a known large vendor chunk
const BUDGETS = {
  totalJsExclMonaco: 2000, // All JS except monaco
  indexChunk: 600, // Main index chunk
  largestNonMonaco: 600, // Largest non-monaco chunk
};

// Chunks excluded from per-chunk budget (known large vendor chunks)
const EXCLUDED_CHUNKS = ['monaco'];

function formatKB(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

function isExcludedChunk(filename) {
  return EXCLUDED_CHUNKS.some(name => filename.includes(name));
}

if (!fs.existsSync(distDir) || !fs.existsSync(assetsDir)) {
  console.error('dist/assets not found. Run `npm run build` first.');
  process.exit(2);
}

const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
let totalJsBytes = 0;
let totalJsExclMonacoBytes = 0;
let indexChunkBytes = 0;
let largestNonMonacoBytes = 0;
let largestNonMonacoName = '';
const chunks = [];

for (const f of files) {
  const p = path.join(assetsDir, f);
  const stat = fs.statSync(p);
  const kb = formatKB(stat.size);
  totalJsBytes += stat.size;

  const excluded = isExcludedChunk(f);
  if (!excluded) {
    totalJsExclMonacoBytes += stat.size;
    if (stat.size > largestNonMonacoBytes) {
      largestNonMonacoBytes = stat.size;
      largestNonMonacoName = f;
    }
  }

  if (f.startsWith('index-')) {
    indexChunkBytes = stat.size;
  }

  chunks.push({ name: f, kb, excluded });
}

const totalKB = formatKB(totalJsBytes);
const totalExclKB = formatKB(totalJsExclMonacoBytes);
const indexKB = formatKB(indexChunkBytes);
const largestNonMonacoKB = formatKB(largestNonMonacoBytes);

// Report
console.log('Bundle Size Report:');
console.log(`  Total JS:              ${totalKB} KB`);
console.log(
  `  Total JS (excl monaco): ${totalExclKB} KB (budget: ${BUDGETS.totalJsExclMonaco} KB)`
);
console.log(`  Index chunk:           ${indexKB} KB (budget: ${BUDGETS.indexChunk} KB)`);
console.log(
  `  Largest non-monaco:    ${largestNonMonacoKB} KB (budget: ${BUDGETS.largestNonMonaco} KB) [${largestNonMonacoName}]`
);
console.log('');

// Top 10 chunks by size
const sorted = chunks.sort((a, b) => b.kb - a.kb);
console.log('Top chunks:');
for (const c of sorted.slice(0, 10)) {
  const tag = c.excluded ? ' [excluded from budget]' : '';
  console.log(`  ${c.kb.toString().padStart(8)} KB  ${c.name}${tag}`);
}
console.log('');

// Check budgets
let ok = true;
if (totalExclKB > BUDGETS.totalJsExclMonaco) {
  console.error(
    `FAIL: Total JS (excl monaco) ${totalExclKB} KB exceeds budget ${BUDGETS.totalJsExclMonaco} KB`
  );
  ok = false;
}
if (indexKB > BUDGETS.indexChunk) {
  console.error(`FAIL: Index chunk ${indexKB} KB exceeds budget ${BUDGETS.indexChunk} KB`);
  ok = false;
}
if (largestNonMonacoKB > BUDGETS.largestNonMonaco) {
  console.error(
    `FAIL: Largest non-monaco chunk ${largestNonMonacoKB} KB exceeds budget ${BUDGETS.largestNonMonaco} KB`
  );
  ok = false;
}

if (ok) {
  console.log('PASS: All bundle budgets met.');
  process.exit(0);
} else {
  process.exit(1);
}
