// Fetch Tableau records from a datasource LUID and save to site/data/latest.json
// Usage: node scripts/tableau_fetch_by_luid.mjs <DATASOURCE_LUID> [MONTHS|ALL]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function readClaudeConfig() {
  const home = os.homedir();
  const candidates = [];
  // macOS
  candidates.push(path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'));
  // Linux (typical)
  candidates.push(path.join(home, '.config', 'Claude', 'claude_desktop_config.json'));
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, 'utf8');
      const json = JSON.parse(text);
      const env = json?.mcpServers?.tableau?.env || {};
      const SERVER = (env.SERVER || '').replace(/\/?$/, '');
      const SITE_NAME = env.SITE_NAME ?? '';
      const PAT_NAME = env.PAT_NAME || '';
      const PAT_VALUE = env.PAT_VALUE || '';
      if (SERVER && PAT_NAME && PAT_VALUE) {
        return { SERVER, SITE_NAME, PAT_NAME, PAT_VALUE };
      }
    } catch {}
  }
  return null;
}

function readCursorConfig() {
  const home = os.homedir();
  const candidates = [
    path.join(home, '.cursor', 'mcp.json'),
    path.join(process.cwd(), '.cursor', 'mcp.json'),
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, 'utf8');
      const json = JSON.parse(text);
      const env = json?.mcpServers?.tableau?.env || {};
      const SERVER = (env.SERVER || env.SERVER_URL || '').replace(/\/?$/, '');
      const SITE_NAME = env.SITE_NAME ?? '';
      const PAT_NAME = env.PAT_NAME || '';
      const PAT_VALUE = env.PAT_VALUE || '';
      if (SERVER && PAT_NAME && PAT_VALUE) {
        return { SERVER, SITE_NAME, PAT_NAME, PAT_VALUE };
      }
    } catch {}
  }
  return null;
}

function readEnvConfig() {
  const SERVER = (process.env.TABLEAU_SERVER || '').replace(/\/?$/, '');
  const SITE_NAME = process.env.TABLEAU_SITE_NAME || '';
  const PAT_NAME = process.env.TABLEAU_PAT_NAME || '';
  const PAT_VALUE = process.env.TABLEAU_PAT_VALUE || '';
  if (SERVER && PAT_NAME && PAT_VALUE) {
    return { SERVER, SITE_NAME, PAT_NAME, PAT_VALUE };
  }
  return null;
}

function readAnyConfig() {
  return (
    readEnvConfig() ||
    readCursorConfig() ||
    readClaudeConfig() ||
    null
  );
}

async function rest(url, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${t.slice(0, 500)}`);
  }
  return res;
}

async function signIn({ SERVER, SITE_NAME, PAT_NAME, PAT_VALUE }) {
  const url = `${SERVER}/api/3.24/auth/signin`;
  const body = {
    credentials: {
      personalAccessTokenName: PAT_NAME,
      personalAccessTokenSecret: PAT_VALUE,
      site: { contentUrl: SITE_NAME },
    },
  };
  const res = await rest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const token = json?.credentials?.token;
  const siteId = json?.credentials?.site?.id;
  if (!token || !siteId) throw new Error('Failed to sign in');
  return { token, siteId };
}

async function signOut({ SERVER, token }) {
  try {
    await rest(`${SERVER}/api/3.24/auth/signout`, { method: 'POST', headers: { 'X-Tableau-Auth': token } });
  } catch {}
}

async function queryDatasource({ SERVER, token, datasourceLuid, months = 3 }) {
  const url = `${SERVER}/api/v1/vizql-data-service/query-datasource`;
  // 可変フィルタ: months が数値なら直近Nヶ月、'ALL'等の場合はフィルタ無し
  const dateFilter =
    typeof months === 'number' && months > 0
      ? [{
          field: { fieldCaption: 'Order Date' },
          filterType: 'DATE',
          dateRangeType: 'LASTN',
          periodType: 'MONTHS',
          rangeN: months,
        }]
      : [];

  const body = {
    datasource: { datasourceLuid },
    query: {
      fields: [
        // 日付
        { fieldCaption: 'Order Date', function: 'TRUNC_DAY', fieldAlias: 'OrderDate' },
        { fieldCaption: 'Ship Date', function: 'TRUNC_DAY', fieldAlias: 'ShipDate' },
        // ディメンション
        { fieldCaption: 'Category', fieldAlias: 'Category' },
        { fieldCaption: 'Segment', fieldAlias: 'Segment' },
        { fieldCaption: 'Region', fieldAlias: 'Region' },
        { fieldCaption: 'State/Province', fieldAlias: 'State' },
        { fieldCaption: 'City', fieldAlias: 'City' },
        { fieldCaption: 'Postal Code', fieldAlias: 'PostalCode' },
        { fieldCaption: 'Customer Name', fieldAlias: 'CustomerName' },
        { fieldCaption: 'Product Name', fieldAlias: 'ProductName' },
        { fieldCaption: 'Ship Mode', fieldAlias: 'ShipMode' },
        // メジャー
        { fieldCaption: 'Sales', function: 'SUM', fieldAlias: 'Sales' },
        { fieldCaption: 'Profit', function: 'SUM', fieldAlias: 'Profit' },
        { fieldCaption: 'Quantity', function: 'SUM', fieldAlias: 'Quantity' },
      ],
      filters: dateFilter,
    },
    options: { returnFormat: 'OBJECTS', disaggregate: false, debug: false },
  };
  const res = await rest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tableau-Auth': token },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json?.data ?? [];
}

function toRecords(rows) {
  return rows
    .map((r) => {
      const orderDate = normalizeDate(r.OrderDate ?? r['Order Date'] ?? r.date);
      const shipDate = normalizeDate(r.ShipDate ?? r['Ship Date'] ?? r.shipDate);
      const shippingDays = orderDate && shipDate ? diffDays(orderDate, shipDate) : null;
      return {
        date: orderDate,
        category: r.Category ?? r.category ?? null,
        segment: r.Segment ?? r.segment ?? null,
        value: Number(r.Sales ?? r.Value ?? r.value) || 0,
        profit: Number(r.Profit ?? r.profit) || 0,
        quantity: Number(r.Quantity ?? r.quantity) || 0,
        region: r.Region ?? null,
        state: r.State ?? r['State/Province'] ?? null,
        city: r.City ?? null,
        postal_code: (r.PostalCode ?? r['Postal Code'] ?? '').toString(),
        shipping_mode: r.ShipMode ?? r['Ship Mode'] ?? null,
        ship_date: shipDate,
        shipping_days: shippingDays,
        customer_name: r.CustomerName ?? r['Customer Name'] ?? null,
        product_name: r.ProductName ?? r['Product Name'] ?? null,
      };
    })
    .filter((x) => x.date && x.category && x.segment);
}

function normalizeDate(input) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function diffDays(fromYmd, toYmd) {
  try {
    const a = new Date(fromYmd);
    const b = new Date(toYmd);
    const ms = b.getTime() - a.getTime();
    if (Number.isNaN(ms)) return null;
    return Math.max(0, Math.round(ms / 86400000));
  } catch {
    return null;
  }
}

async function main() {
  const datasourceLuid = process.argv[2];
  const monthsArg = (process.argv[3] || '3').toString();
  const months = monthsArg.toLowerCase() === 'all' || monthsArg === '0' ? null : Number(monthsArg);
  if (!datasourceLuid) {
    console.error('Usage: node scripts/tableau_fetch_by_luid.mjs <DATASOURCE_LUID> [MONTHS|ALL]');
    process.exit(1);
  }

  const cfg = readAnyConfig();
  if (!cfg) {
    throw new Error('Missing Tableau credentials. Set env TABLEAU_SERVER/TABLEAU_PAT_NAME/TABLEAU_PAT_VALUE (and optional TABLEAU_SITE_NAME), or configure MCP (Cursor/Claude).');
  }
  const { token } = await signIn(cfg);
  try {
    const rows = await queryDatasource({ SERVER: cfg.SERVER, token, datasourceLuid, months });
    const records = toRecords(rows);
    const out = {
      meta: {
        generatedAt: new Date().toISOString(),
        source: 'tableau',
        datasourceLuid,
        months: months ?? 'ALL',
        fields: {
          required: ['date', 'category', 'segment', 'value'],
          optional: ['profit','quantity','region','state','city','postal_code','shipping_mode','ship_date','shipping_days','customer_name','product_name']
        }
      },
      records,
    };
    fs.mkdirSync('site/data', { recursive: true });
    fs.writeFileSync('site/data/latest.json', JSON.stringify(out, null, 2));
    console.log(`Saved ${records.length} records to site/data/latest.json`);
  } finally {
    await signOut({ SERVER: cfg.SERVER, token });
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});


