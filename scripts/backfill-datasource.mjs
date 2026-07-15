// scripts/backfill-datasource.mjs
// Sets dataSource = 'ai_estimate' for all existing keywords with null dataSource
const TURSO_URL = process.env.DATABASE_URL.replace("libsql://", "https://") + "/v2/pipeline";
const TURSO_TOKEN = process.env.LIBSQL_TOKEN;

async function main() {
  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TURSO_TOKEN}`,
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql: "UPDATE Keyword SET dataSource = 'ai_estimate' WHERE dataSource IS NULL",
          },
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Failed:", JSON.stringify(data).slice(0, 300));
    process.exit(1);
  }
  console.log("✓ Backfilled null dataSource values to 'ai_estimate'");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
