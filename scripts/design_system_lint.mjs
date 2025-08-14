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
const APP_JS = path.join(SITE_DIR, 'assets', 'app.js');

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

function ensureNoNowrapInTables(html) {
  const errs = [];
  // Flag whitespace-nowrap inside table cells; prefer wrap+truncate utilities
  const cellNowrap = /<t[hd][^>]*class="[^"]*whitespace-nowrap[^"]*"/g;
  if (cellNowrap.test(html)) {
    errs.push(
      error(
        'Avoid `whitespace-nowrap` in table cells. Use truncation (overflow-hidden text-ellipsis) or allow wrap.',
      ),
    );
  }
  return errs;
}

function ensureKPICompactFormatting(js) {
  const errs = [];
  // Geography KPI must not use formatCurrency/toLocaleString inside updateGeographyKPIs
  const geoFn = /function\s+updateGeographyKPIs\([\s\S]*?\)\s*\{([\s\S]*?)\}/m;
  const geoMatch = js.match(geoFn);
  if (geoMatch) {
    const body = geoMatch[1];
    if (/formatCurrency\(/.test(body)) {
      errs.push(error('updateGeographyKPIs: use compact formatters (formatCompactCurrency/Number)'));
    }
  }
  // Shipping KPI must not use toLocaleString/formatCurrency for totals
  const shipFn = /function\s+updateShippingKPIs\([\s\S]*?\)\s*\{([\s\S]*?)\}/m;
  const shipMatch = js.match(shipFn);
  if (shipMatch) {
    const body = shipMatch[1];
    if (/toLocaleString\(/.test(body)) {
      errs.push(error('updateShippingKPIs: use formatCompactNumber for counts'));
    }
    if (/formatCurrency\(/.test(body) && !/formatCompactCurrency\(/.test(body)) {
      errs.push(error('updateShippingKPIs: use formatCompactCurrency for amounts'));
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
  const js = fs.existsSync(APP_JS) ? read(APP_JS) : '';
  const errors = [
    ...ensureDisallowLegacyGrid(html),
    ...ensurePageContentWrapper(html),
    ...ensureTwelveColGrid(html),
    ...ensureNoNowrapInTables(html),
    ...ensureKPICompactFormatting(js),
  ];
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(ok('Design system lint passed.'));
}

main();


