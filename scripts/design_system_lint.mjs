#!/usr/bin/env node

/**
 * Design System Lint (HTML conventions)
 * - Enforce 12-col grid
 * - Enforce page content wrapper (max-w-5xl)
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const SITE_DIR = path.join(ROOT, "site");
const APP_JS = path.join(SITE_DIR, "assets", "app.js");

function read(file) {
  return fs.readFileSync(file, "utf8");
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
    return [
      error(
        'Use of legacy grid "grid-cols-1 lg:grid-cols-2" is forbidden. Use "grid grid-cols-12" and col-span.',
      ),
    ];
  }
  return [];
}

function ensurePageContentWrapper(html) {
  const pages = [
    "overview",
    "geography",
    "products",
    "customers",
    "time",
    "operations",
  ];
  const errs = [];
  for (const pageId of pages) {
    const pageIdx = html.indexOf(`<div id="${pageId}"`);
    if (pageIdx === -1) continue; // page not present
    const slice = html.slice(pageIdx, pageIdx + 2000);
    if (!/max-w-5xl\s+mx-auto/.test(slice)) {
      errs.push(
        error(
          `Page "${pageId}": missing page content wrapper (max-w-5xl mx-auto).`,
        ),
      );
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
        errs.push(
          error(
            `Grid without grid-cols-12 detected: ${chunk.slice(0, 120)}...`,
          ),
        );
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
        "Avoid `whitespace-nowrap` in table cells. Use truncation (overflow-hidden text-ellipsis) or allow wrap.",
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
      errs.push(
        error(
          "updateGeographyKPIs: use compact formatters (formatCompactCurrency/Number)",
        ),
      );
    }
  }
  // Shipping KPI must not use toLocaleString/formatCurrency for totals
  const shipFn = /function\s+updateShippingKPIs\([\s\S]*?\)\s*\{([\s\S]*?)\}/m;
  const shipMatch = js.match(shipFn);
  if (shipMatch) {
    const body = shipMatch[1];
    if (/toLocaleString\(/.test(body)) {
      errs.push(
        error("updateShippingKPIs: use formatCompactNumber for counts"),
      );
    }
    if (
      /formatCurrency\(/.test(body) &&
      !/formatCompactCurrency\(/.test(body)
    ) {
      errs.push(
        error("updateShippingKPIs: use formatCompactCurrency for amounts"),
      );
    }
  }
  return errs;
}

function ensureNoNowrapInJS(js) {
  const errs = [];
  if (!js) return errs;
  if (/whitespace-nowrap/.test(js)) {
    errs.push(
      error(
        "Avoid `whitespace-nowrap` in JS-generated table cells. Use wrapping or truncation utilities instead.",
      ),
    );
  }
  return errs;
}

function ensureGridChildrenHaveColSpan(html) {
  const errs = [];
  // Heuristic: after each grid-cols-12 occurrence, within the next 500 chars expect at least one col-span-
  const regex = /grid\s+grid-cols-12[^"]*"([\s\S]{0,500})/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const snippet = match[1] || "";
    if (!/col-span-\d+/.test(snippet)) {
      errs.push(
        error(
          "A `grid grid-cols-12` container appears without any `col-span-*` children nearby. Ensure children define responsive spans.",
        ),
      );
    }
  }
  return errs;
}

function ensureDateInputsHaveColSpan(html) {
  const errs = [];
  const startMatch = html.match(/id="start-date"[^"]*class="([^"]+)"/);
  const endMatch = html.match(/id="end-date"[^"]*class="([^"]+)"/);
  if (startMatch && !/col-span-\d+/.test(startMatch[1])) {
    errs.push(
      error("#start-date should have a `col-span-*` class inside 12-col grid"),
    );
  }
  if (endMatch && !/col-span-\d+/.test(endMatch[1])) {
    errs.push(
      error("#end-date should have a `col-span-*` class inside 12-col grid"),
    );
  }
  return errs;
}

function ensureChartContainersHaveHeight(html, js) {
  const errs = [];
  const check = (text, where) => {
    const re =
      /<div[^"]*id="([^"]*chart)"[^"]*class="([^"]*)"[^"]*?(style="[^"]*")?[^"]*>/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const id = m[1];
      const cls = m[2] || "";
      const styleAttr = m[3] || "";
      const hasClassHeight = /\b(h-\d+|h-\[.*?\])\b/.test(cls);
      const hasInlineHeight = /height\s*:\s*\d+/.test(styleAttr) || /height\s*:\s*\d+px/.test(styleAttr);

      if (!hasClassHeight && !hasInlineHeight) {
        errs.push(
          error(
            `${where}: chart container #${id} must specify explicit height (h-* or style="height:")`,
          ),
        );
      }
    }
  };
  if (html) check(html, "HTML");
  if (js) check(js, "JS");
  return errs;
}

function ensureChartsRegistered(js) {
  const errs = [];
  if (!js) return errs;
  
  // より正確なチェック：echarts.initの後の行でregisterChartInstanceを探す
  const lines = js.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('echarts.init(')) {
      // 次の数行でregisterChartInstanceを探す
      let found = false;
      for (let j = i + 1; j <= Math.min(i + 5, lines.length - 1); j++) {
        if (lines[j].includes('registerChartInstance(')) {
          found = true;
          break;
        }
      }
      if (!found) {
        errs.push(
          error(
            "After echarts.init(...), call registerChartInstance(instance) to enable global resize.",
          ),
        );
      }
    }
  }
  return errs;
}

function ensureMixedRowItemsStart(html, js) {
  const errs = [];
  const check = (text, where) => {
    const re =
      /<div[^>]*class="([^"]*grid[^\"]*grid-cols-12[^"]*)"[\s\S]{0,800}?<div[^>]*id="[^"]*-chart"[\s\S]{0,800}?<table/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const cls = m[1];
      if (!/items-start/.test(cls)) {
        errs.push(
          error(
            `${where}: grids that mix charts and tables must include items-start to avoid equal-height stretching.`,
          ),
        );
      }
    }
  };
  if (html) check(html, "HTML");
  if (js) check(js, "JS");
  return errs;
}

function ensureLegendTopAndGrid(js) {
  const errs = [];
  if (!js) return errs;
  
  // より正確なチェック：setOptionのブロックごとにチェック
  const lines = js.split('\n');
  let inSetOption = false;
  let hasLegend = false;
  let legendTop = false;
  let gridTop = false;
  let gridTopValue = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('setOption(')) {
      inSetOption = true;
      hasLegend = false;
      legendTop = false;
      gridTop = false;
      gridTopValue = 0;
      continue;
    }
    
    if (inSetOption) {
      if (line.includes('legend:')) {
        hasLegend = true;
      }
      if (hasLegend && line.includes('top:')) {
        legendTop = true;
      }
      if (line.includes('grid:')) {
        // grid:の行の次の行から検索を開始
        for (let j = i; j <= Math.min(i + 15, lines.length - 1); j++) {
          if (lines[j].includes('top:')) {
            const match = lines[j].match(/top:\s*(\d+)/);
            if (match) {
              gridTop = true;
              gridTopValue = parseInt(match[1]);
            }
            break;
          }
          // gridブロックの終了を検出
          if (j > i && (lines[j].includes('},') || lines[j].includes('}'))) {
            break;
          }
        }
      }
      
      // setOptionブロックの終了を検出
      if (line.includes('});')) {
        if (hasLegend) {
          if (!legendTop) {
            errs.push(
              error("Chart with legend must set legend.top to avoid overlap"),
            );
          }
          if (!gridTop || gridTopValue < 56) {
            errs.push(
              error(
                "Chart with legend must set grid.top >= 56 when legend.present",
              ),
            );
          }
        }
        inSetOption = false;
      }
    }
  }
  return errs;
}

function main() {
  const indexPath = path.join(SITE_DIR, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.log(ok("No site/index.html found (skipping)."));
    process.exit(0);
  }
  const html = read(indexPath);
  const js = fs.existsSync(APP_JS) ? read(APP_JS) : "";
  const errors = [
    ...ensureDisallowLegacyGrid(html),
    ...ensurePageContentWrapper(html),
    ...ensureTwelveColGrid(html),
    ...ensureNoNowrapInTables(html),
    ...ensureKPICompactFormatting(js),
    ...ensureNoNowrapInJS(js),
    ...ensureGridChildrenHaveColSpan(html),
    ...ensureDateInputsHaveColSpan(html),
    ...ensureChartContainersHaveHeight(html, js),
    ...ensureChartsRegistered(js),
    ...ensureMixedRowItemsStart(html, js),
    ...ensureLegendTopAndGrid(js),
  ];
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(ok("Design system lint passed."));
}

main();
