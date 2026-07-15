// scripts/init-db.mjs
// Creates the Restaurant, Keyword, and RankingHistory tables in Turso
// via the REST API. Run with: npm run db:init
//
// Requires env vars:
//   DATABASE_URL  (e.g. libsql://my-db.turso.io)
//   LIBSQL_TOKEN  (Turso auth token)

const TURSO_URL = process.env.DATABASE_URL?.replace("libsql://", "https://") + "/v2/pipeline";
const TURSO_TOKEN = process.env.LIBSQL_TOKEN;

if (!process.env.DATABASE_URL || !TURSO_TOKEN) {
  console.error("ERROR: DATABASE_URL and LIBSQL_TOKEN must be set in .env or environment.");
  console.error("Create a .env file with:");
  console.error("  DATABASE_URL=libsql://your-db.turso.io");
  console.error("  LIBSQL_TOKEN=your-turso-token");
  process.exit(1);
}

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS Restaurant (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    website TEXT,
    cuisine TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS Keyword (
    id TEXT PRIMARY KEY,
    restaurantId TEXT NOT NULL,
    keyword TEXT NOT NULL,
    searchVolume INTEGER NOT NULL DEFAULT 0,
    difficulty INTEGER NOT NULL DEFAULT 0,
    organicRanking INTEGER,
    gbpRanking INTEGER,
    dataSource TEXT DEFAULT 'ai_estimate',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (restaurantId) REFERENCES Restaurant(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_keyword_restaurant ON Keyword(restaurantId)`,
  `CREATE INDEX IF NOT EXISTS idx_keyword_volume ON Keyword(searchVolume DESC)`,
  `CREATE TABLE IF NOT EXISTS RankingHistory (
    id TEXT PRIMARY KEY,
    keywordId TEXT NOT NULL,
    month TEXT NOT NULL,
    organicRanking INTEGER,
    gbpRanking INTEGER,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (keywordId) REFERENCES Keyword(id) ON DELETE CASCADE,
    UNIQUE (keywordId, month)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ranking_keyword ON RankingHistory(keywordId)`,
  `CREATE INDEX IF NOT EXISTS idx_ranking_month ON RankingHistory(month)`,
];

async function main() {
  console.log("Initializing Turso database...");
  console.log("URL:", TURSO_URL);

  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TURSO_TOKEN}`,
    },
    body: JSON.stringify({
      requests: STATEMENTS.map(sql => ({ type: "execute", stmt: { sql } })),
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("FAILED:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const results = data.results || [];
  console.log(`\n✓ Executed ${results.length} statements:`);
  STATEMENTS.forEach((sql, i) => {
    const short = sql.replace(/\s+/g, " ").slice(0, 70);
    console.log(`  ${i + 1}. ${short}${sql.length > 70 ? "..." : ""}`);
  });
  console.log("\n✓ Database initialized successfully.");
  console.log("Tables created: Restaurant, Keyword, RankingHistory");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
