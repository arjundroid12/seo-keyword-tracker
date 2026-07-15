// scripts/migrate-add-datasource.mjs
// Adds dataSource column to Keyword table (idempotent — safe to run multiple times)
// Run with: node scripts/migrate-add-datasource.mjs

const TURSO_URL = process.env.DATABASE_URL?.replace("libsql://", "https://") + "/v2/pipeline";
const TURSO_TOKEN = process.env.LIBSQL_TOKEN;

if (!process.env.DATABASE_URL || !TURSO_TOKEN) {
  console.error("ERROR: DATABASE_URL and LIBSQL_TOKEN must be set.");
  process.exit(1);
}

async function exec(sql) {
  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TURSO_TOKEN}`,
    },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql } }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("SQL error:", JSON.stringify(data).slice(0, 300));
    return false;
  }
  return true;
}

async function query(sql) {
  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TURSO_TOKEN}`,
    },
    body: JSON.stringify({
      requests: [{ type: "execute", stmt: { sql } }],
    }),
  });
  const data = await res.json();
  const result = data.results?.[0]?.response?.result;
  if (!result?.rows) return [];
  return result.rows.map((raw) => {
    const row = {};
    result.cols.forEach((col, i) => {
      const cell = raw[i];
      row[col.name] = cell?.type === "null" ? null : cell?.value;
    });
    return row;
  });
}

async function main() {
  console.log("Checking Keyword table schema...");

  // Check if dataSource column already exists
  const cols = await query("PRAGMA table_info(Keyword)");
  const hasDataSource = cols.some((c) => c.name === "dataSource");

  if (hasDataSource) {
    console.log("✓ dataSource column already exists. No migration needed.");
    return;
  }

  console.log("Adding dataSource column to Keyword table...");
  const ok = await exec("ALTER TABLE Keyword ADD COLUMN dataSource TEXT DEFAULT 'ai_estimate'");
  if (!ok) {
    console.error("✗ Failed to add dataSource column.");
    process.exit(1);
  }

  console.log("✓ Column added. Verifying...");
  const cols2 = await query("PRAGMA table_info(Keyword)");
  console.log("Current columns:", cols2.map((c) => c.name).join(", "));
  console.log("\n✓ Migration complete.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
