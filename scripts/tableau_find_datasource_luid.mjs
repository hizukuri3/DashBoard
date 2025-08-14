// Find Tableau datasource LUID by name using credentials in Claude Desktop config
// Usage: node find_tableau_datasource_luid.mjs [targetName]

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const DEFAULT_TARGETS = [
  "Superstore Datasource",
  "Superstore",
  "Sample - Superstore",
];

function readClaudeConfig() {
  const home = os.homedir();
  const candidates = [
    path.join(
      home,
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    ),
    path.join(home, ".config", "Claude", "claude_desktop_config.json"),
  ];
  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, "utf8");
      const json = JSON.parse(text);
      const env = json?.mcpServers?.tableau?.env || {};
      const SERVER = (env.SERVER || "").replace(/\/?$/, "") || "";
      const SITE_NAME = env.SITE_NAME ?? "";
      const PAT_NAME = env.PAT_NAME || "";
      const PAT_VALUE = env.PAT_VALUE || "";
      if (SERVER && PAT_NAME && PAT_VALUE) {
        return { SERVER, SITE_NAME, PAT_NAME, PAT_VALUE };
      }
    } catch {}
  }
  return null;
}

async function rest(url, options = {}) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${t.slice(0, 300)}`);
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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  const token = json?.credentials?.token;
  const siteId = json?.credentials?.site?.id;
  if (!token || !siteId) throw new Error("Failed to sign in");
  return { token, siteId };
}

async function signOut({ SERVER, token }) {
  try {
    await rest(`${SERVER}/api/3.24/auth/signout`, {
      method: "POST",
      headers: { "X-Tableau-Auth": token },
    });
  } catch {}
}

async function listDatasources({ SERVER, siteId, token, pageSize = 1000 }) {
  let pageNumber = 1;
  const all = [];
  for (;;) {
    const url = `${SERVER}/api/3.24/sites/${siteId}/datasources?pageSize=${pageSize}&pageNumber=${pageNumber}`;
    const res = await rest(url, { headers: { "X-Tableau-Auth": token } });
    const json = await res.json();
    const items = json?.datasources?.datasource || json?.datasources || [];
    const arr = Array.isArray(items) ? items : [];
    all.push(...arr);
    const pagination = json?.pagination || {};
    const totalAvailable = Number(pagination?.totalAvailable ?? all.length);
    const pageCount = Math.ceil(totalAvailable / pageSize) || 1;
    if (pageNumber >= pageCount || arr.length === 0) break;
    pageNumber += 1;
  }
  return all;
}

function pickMatches(list, names) {
  const targets = [process.argv[2], ...DEFAULT_TARGETS].filter(Boolean);
  const lower = (s) => (s || "").toString().toLowerCase();
  const results = [];
  for (const ds of list) {
    const nm = ds.name || ds.contentUrl || "";
    const lnm = lower(nm);
    for (const t of targets) {
      const lt = lower(t);
      if (lnm === lt || lnm.includes(lt)) {
        results.push({
          id: ds.id || ds.luid,
          name: nm,
          projectName: ds.projectName || ds.project?.name,
        });
        break;
      }
    }
  }
  return results;
}

function printResults(matches) {
  if (!matches.length) {
    console.log("No matching datasources found.");
    return;
  }
  console.log("Candidates:");
  for (const m of matches) {
    console.log(
      `- name: ${m.name} | project: ${m.projectName || "-"} | id: ${m.id}`,
    );
  }
  console.log(`\nBest match (first): ${matches[0].id}`);
}

async function main() {
  const cfg = readClaudeConfig();
  const { token, siteId } = await signIn(cfg);
  try {
    const list = await listDatasources({ SERVER: cfg.SERVER, siteId, token });
    const matches = pickMatches(list, DEFAULT_TARGETS);
    printResults(matches);
  } finally {
    await signOut({ SERVER: cfg.SERVER, token });
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
