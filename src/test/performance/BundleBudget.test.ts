/**
 * Bundle Budget Tests
 *
 * Validates that production bundle sizes stay within defined budgets.
 * Run after `npm run build` to check chunk sizes.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const ASSETS_DIR = join(DIST_DIR, 'assets');

// Budget limits in KB
const BUDGETS = {
  totalJsExclMonaco: 2000,
  indexChunk: 600,
  largestNonMonaco: 600,
};

function getChunkSizes() {
  if (!existsSync(ASSETS_DIR)) return null;

  const files = readdirSync(ASSETS_DIR).filter(f => f.endsWith('.js'));
  const chunks: { name: string; kb: number; isMonaco: boolean; isIndex: boolean }[] = [];

  for (const f of files) {
    const stat = statSync(join(ASSETS_DIR, f));
    const kb = Math.round((stat.size / 1024) * 10) / 10;
    chunks.push({
      name: f,
      kb,
      isMonaco: f.includes('monaco'),
      isIndex: f.startsWith('index-'),
    });
  }

  return chunks;
}

describe('Bundle Size Budgets', () => {
  const chunks = getChunkSizes();
  const hasDist = chunks !== null;

  it.skipIf(!hasDist)('total JS (excl monaco) is within budget', () => {
    const total = chunks!.filter(c => !c.isMonaco).reduce((sum, c) => sum + c.kb, 0);
    expect(total).toBeLessThanOrEqual(BUDGETS.totalJsExclMonaco);
  });

  it.skipIf(!hasDist)('index chunk is within budget', () => {
    const indexChunk = chunks!.find(c => c.isIndex);
    expect(indexChunk).toBeDefined();
    expect(indexChunk!.kb).toBeLessThanOrEqual(BUDGETS.indexChunk);
  });

  it.skipIf(!hasDist)('no non-monaco chunk exceeds budget', () => {
    const nonMonaco = chunks!.filter(c => !c.isMonaco);
    for (const chunk of nonMonaco) {
      expect(chunk.kb, `Chunk ${chunk.name} exceeds budget`).toBeLessThanOrEqual(
        BUDGETS.largestNonMonaco
      );
    }
  });

  it.skipIf(!hasDist)('vb6-runtime is in a separate chunk', () => {
    const runtimeChunk = chunks!.find(c => c.name.includes('vb6-runtime'));
    expect(runtimeChunk, 'vb6-runtime chunk should exist').toBeDefined();
    expect(runtimeChunk!.kb).toBeGreaterThan(0);
  });

  it.skipIf(!hasDist)('react-vendor is in a separate chunk', () => {
    const reactChunk = chunks!.find(c => c.name.includes('react-vendor'));
    expect(reactChunk, 'react-vendor chunk should exist').toBeDefined();
  });

  it.skipIf(!hasDist)('monaco is in a separate chunk', () => {
    const monacoChunk = chunks!.find(c => c.isMonaco);
    expect(monacoChunk, 'monaco chunk should exist').toBeDefined();
  });
});
