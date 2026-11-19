import { DETECTION_KINDS, validateBatch, type CountRow, type DetectionKind } from "../../engine/src/index.ts";

export interface Env {
  DB: D1Database;
}

export interface ReportRow {
  department: string;
  tool: CountRow["tool"];
  task: CountRow["task"];
  prompts: number;
  detections: Partial<Record<DetectionKind, number>>;
}

export interface ReportResponse {
  company: string;
  name: string;
  from: string;
  to: string;
  devices: number;
  rows: ReportRow[];
}

const MAX_BODY = 64 * 1024;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-max-age": "86400",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const KIND_COLUMNS = DETECTION_KINDS.join(", ");
const KIND_UPDATES = DETECTION_KINDS.map((k) => `${k} = ${k} + excluded.${k}`).join(", ");
const KIND_SUMS = DETECTION_KINDS.map((k) => `SUM(${k}) AS ${k}`).join(", ");

const UPSERT = `INSERT INTO counts (company, department, device, day, tool, task, prompts, ${KIND_COLUMNS})
VALUES (?, ?, ?, ?, ?, ?, ?, ${DETECTION_KINDS.map(() => "?").join(", ")})
ON CONFLICT (company, device, day, tool, task) DO UPDATE SET
department = excluded.department, prompts = prompts + excluded.prompts, ${KIND_UPDATES},
updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`;

async function postCounts(request: Request, env: Env): Promise<Response> {
  const text = await request.text();
  if (text.length > MAX_BODY) return json(413, { error: "too_large" });
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return json(400, { error: "json" });
  }
  const result = validateBatch(input);
  if (!result.ok) return json(400, { error: result.error });
  const { batch } = result;
  const company = await env.DB.prepare("SELECT code FROM companies WHERE code = ?").bind(batch.company).first();
  if (!company) return json(404, { error: "company" });
  const statement = env.DB.prepare(UPSERT);
  await env.DB.batch(
    batch.rows.map((row) =>
      statement.bind(
        batch.company,
        batch.department,
        batch.device,
        row.day,
        row.tool,
        row.task,
        row.prompts,
        ...DETECTION_KINDS.map((kind) => row.detections[kind] ?? 0),
      ),
    ),
  );
  return new Response(null, { status: 204, headers: CORS });
}

async function getReport(request: Request, env: Env): Promise<Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return json(401, { error: "auth" });
  const company = await env.DB.prepare("SELECT code, name FROM companies WHERE report_token_hash = ?")
    .bind(await sha256(token))
    .first<{ code: string; name: string }>();
  if (!company) return json(401, { error: "auth" });
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!DAY.test(from) || !DAY.test(to) || from > to) return json(400, { error: "range" });
  const { results } = await env.DB.prepare(
    `SELECT department, tool, task, SUM(prompts) AS prompts, ${KIND_SUMS}
     FROM counts WHERE company = ? AND day BETWEEN ? AND ?
     GROUP BY department, tool, task ORDER BY department, tool, task`,
  )
    .bind(company.code, from, to)
    .all<Record<string, string | number>>();
  const devices = await env.DB.prepare(
    "SELECT COUNT(DISTINCT device) AS n FROM counts WHERE company = ? AND day BETWEEN ? AND ?",
  )
    .bind(company.code, from, to)
    .first<{ n: number }>();
  const rows: ReportRow[] = results.map((r) => ({
    department: String(r.department),
    tool: r.tool as ReportRow["tool"],
    task: r.task as ReportRow["task"],
    prompts: Number(r.prompts),
    detections: Object.fromEntries(
      DETECTION_KINDS.filter((k) => Number(r[k]) > 0).map((k) => [k, Number(r[k])]),
    ),
  }));
  const body: ReportResponse = { company: company.code, name: company.name, from, to, devices: devices?.n ?? 0, rows };
  return json(200, body);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (pathname === "/health") return json(200, { ok: true });
    if (pathname === "/v1/counts" && request.method === "POST") return postCounts(request, env);
    if (pathname === "/v1/report" && request.method === "GET") return getReport(request, env);
    return json(404, { error: "not_found" });
  },
} satisfies ExportedHandler<Env>;
