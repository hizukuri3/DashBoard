#!/usr/bin/env node

/**
 * Design System Lint (HTML conventions)
 * - Enforce 12-col grid
 * - Enforce page content wrapper (max-w-5xl)
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const SITE_DIR = path.join(ROOT, 'site');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function error(msg) {
  return `❌ ${msg}`;
}

function ok(msg) {
  return `✅ ${msg}`;
}

function ensureDisallowLegacyGrid(html) {
  const legacy = /grid-cols-1\s+lg:grid-cols-2/;
  if (legacy.test(html)) {
    return [error('Use of legacy grid "grid-cols-1 lg:grid-cols-2" is forbidden. Use "grid grid-cols-12" and col-span.')];
  }
  return [];
}

function ensurePageContentWrapper(html) {
  const pages = ['overview', 'geography', 'products', 'customers', 'time', 'operations'];
  const errs = [];
  for (const pageId of pages) {
    const pageIdx = html.indexOf(`<div id="${pageId}"`);
    if (pageIdx === -1) continue; // page not present
    const slice = html.slice(pageIdx, pageIdx + 2000);
    if (!/max-w-5xl\s+mx-auto/.test(slice)) {
      errs.push(error(`Page "${pageId}": missing page content wrapper (max-w-5xl mx-auto).`));
    }
  }
  return errs;
}

function ensureTwelveColGrid(html) {
  // Require grid-cols-12 whenever a grid is used (best-effort)
  const errs = [];
  const gridRegex = /<div[^>]*class="[^"]*\bgrid\b[^"]*"/g;
  let m;
  while ((m = gridRegex.exec(html))) {
    const chunk = m[0];
    if (!/grid-cols-12/.test(chunk)) {
      // Allow explicit exception for table wrappers without columns
      if (!/table|overflow-x-auto/.test(chunk)) {
        errs.push(error(`Grid without grid-cols-12 detected: ${chunk.slice(0, 120)}...`));
      }
    }
  }
  return errs;
}

function main() {
  const indexPath = path.join(SITE_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log(ok('No site/index.html found (skipping).'));
    process.exit(0);
  }
  const html = read(indexPath);
  const errors = [
    ...ensureDisallowLegacyGrid(html),
    ...ensurePageContentWrapper(html),
    ...ensureTwelveColGrid(html),
  ];
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(ok('Design system lint passed.'));
}

main();


