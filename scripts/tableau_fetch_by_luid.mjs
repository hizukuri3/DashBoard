// Fetch Tableau records from a datasource LUID and save to dashboard/data/latest.json
// Usage: node tests/fetch_tableau_by_luid.mjs <DATASOURCE_LUID> [MONTHS]

import fs from 'node:fs';

function readClaudeConfig() {
  const p = '/Users/hizukuri/Library/Application Support/Claude/claude_desktop_config.json';
  if (!fs.existsSync(p)) throw new Error('Claude config not found');
  const text = fs.readFileSync(p, 'utf8');
  const json = JSON.parse(text);
  const env = json?.mcpServers?.tableau?.env || {};
  const SERVER = env.SERVER?.replace(/\/?$/, '') || '';
  const SITE_NAME = env.SITE_NAME ?? '';
  const PAT_NAME = env.PAT_NAME || '';
  const PAT_VALUE = env.PAT_VALUE || '';
  if (!SERVER || !PAT_NAME || !PAT_VALUE) {
    throw new Error('Claude config missing required env');
  }
  return { SERVER, SITE_NAME, PAT_NAME, PAT_VALUE };
}

function readCursorConfig() {
  const p = '/Users/hizukuri/.cursor/mcp.json';
  if (!fs.existsSync(p)) throw new Error('Cursor config not found');
  const text = fs.readFileSync(p, 'utf8');
  const json = JSON.parse(text);
  const env = json?.mcpServers?.tableau?.env || {};
  const SERVER = (env.SERVER || env.SERVER_URL || '').replace(/\/?$/, '');
  const SITE_NAME = env.SITE_NAME ?? '';
  const PAT_NAME = env.PAT_NAME || '';
  const PAT_VALUE = env.PAT_VALUE || '';
  if (!SERVER || !PAT_NAME || !PAT_VALUE) {
    throw new Error('Cursor config missing required env');
  }
  return { SERVER, SITE_NAME, PAT_NAME, PAT_VALUE };
}

function readAnyConfig() {
  try { return readClaudeConfig(); } catch {}
  try { return readCursorConfig(); } catch {}
  throw new Error('No Tableau MCP config found (Claude or Cursor)');
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
        { fieldCaption: 'Order Date', function: 'TRUNC_DAY', fieldAlias: 'Date' },
        { fieldCaption: 'Category', fieldAlias: 'Category' },
        { fieldCaption: 'Segment', fieldAlias: 'Segment' },
        { fieldCaption: 'Sales', function: 'SUM', fieldAlias: 'Value' },
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
    .map((r) => ({
      date: normalizeDate(r.Date ?? r['Order Date'] ?? r.date),
      category: r.Category ?? r.category,
      segment: r.Segment ?? r.segment,
      value: Number(r.Value ?? r.Sales ?? r.value) || 0,
    }))
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

async function main() {
  const datasourceLuid = process.argv[2];
  const monthsArg = (process.argv[3] || '3').toString();
  const months = /^(?i:all)$/.test(monthsArg) || monthsArg === '0' ? null : Number(monthsArg);
  if (!datasourceLuid) {
    console.error('Usage: node tests/fetch_tableau_by_luid.mjs <DATASOURCE_LUID> [MONTHS]');
    process.exit(1);
  }

  const cfg = readAnyConfig();
  const { token } = await signIn(cfg);
  try {
    const rows = await queryDatasource({ SERVER: cfg.SERVER, token, datasourceLuid, months });
    const records = toRecords(rows);
    const out = {
      meta: { generatedAt: new Date().toISOString(), source: 'tableau', datasourceLuid, months: months ?? 'ALL' },
      records,
    };
    fs.mkdirSync('dashboard/data', { recursive: true });
    fs.writeFileSync('dashboard/data/latest.json', JSON.stringify(out, null, 2));
    console.log(`Saved ${records.length} records to dashboard/data/latest.json`);
  } finally {
    await signOut({ SERVER: cfg.SERVER, token });
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});


