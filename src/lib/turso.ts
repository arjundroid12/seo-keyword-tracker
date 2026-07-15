// Shared Turso DB helper — works on Vercel serverless
const TURSO_URL = process.env.DATABASE_URL?.replace("libsql://", "https://") + "/v2/pipeline";
const TURSO_TOKEN = process.env.LIBSQL_TOKEN;

function toArg(val: any) {
  if (val === null || val === undefined) return { type: "null" };
  if (typeof val === "number") return { type: "float", value: val };
  if (typeof val === "boolean") return { type: "integer", value: val ? 1 : 0 };
  return { type: "text", value: String(val) };
}

export async function tursoQuery(sql: string, args: any[] = []): Promise<any[]> {
  const res = await fetch(TURSO_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TURSO_TOKEN}` },
    body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql, args: args.map(toArg) } }] }),
  });
  const data = await res.json();
  const result = data.results?.[0]?.response?.result;
  if (!result?.rows || !result.cols) return [];
  return result.rows.map((raw: any[]) => {
    const row: any = {};
    result.cols.forEach((col: any, i: number) => {
      const cell = raw[i];
      if (!cell || cell.type === "null") {
        row[col.name] = null;
      } else if (cell.type === "integer") {
        row[col.name] = parseInt(cell.value, 10);
      } else if (cell.type === "float") {
        row[col.name] = parseFloat(cell.value);
      } else {
        row[col.name] = cell.value;
      }
    });
    return row;
  });
}

export async function tursoExecute(sql: string, args: any[] = []): Promise<void> {
  await fetch(TURSO_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TURSO_TOKEN}` },
    body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql, args: args.map(toArg) } }] }),
  });
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function now(): string {
  return new Date().toISOString();
}
