import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { sha256, type ReportResponse } from "../src/worker.ts";
import { memoryD1 } from "./d1.ts";

const device = "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b";
const token = "test-report-token";

async function setup() {
  const { db, d1 } = memoryD1();
  db.prepare("INSERT INTO companies (code, name, report_token_hash) VALUES (?, ?, ?)").run("puls", "Puls Elektronik", await sha256(token));
  return { db, env: { DB: d1 } };
}

const post = (body: unknown) =>
  new Request("https://api.test/v1/counts", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });

const batch = (rows: unknown[], extra: Record<string, unknown> = {}) => ({
  v: 1,
  company: "puls",
  department: "satis",
  device,
  rows,
  ...extra,
});

const row = { day: "2026-12-28", tool: "chatgpt", task: "email", prompts: 3, detections: { tckn: 1, phone: 2 } };

test("POST /v1/counts stores counts and adds on repeat", async () => {
  const { db, env } = await setup();
  assert.equal((await worker.fetch(post(batch([row])), env)).status, 204);
  assert.equal((await worker.fetch(post(batch([row])), env)).status, 204);
  const stored = db.prepare("SELECT prompts, tckn, phone FROM counts").get();
  assert.deepEqual({ ...stored }, { prompts: 6, tckn: 2, phone: 4 });
});

test("POST /v1/counts rejects anything that could carry content", async () => {
  const { env } = await setup();
  const cases: unknown[] = [
    batch([{ ...row, text: "Ayşe Yılmaz 12345678901" }]),
    batch([row], { note: "secret" }),
    batch([{ ...row, detections: { tckn: 1, name: 1 } }]),
    batch([{ ...row, tool: "Ayşe" }]),
    batch([{ ...row, prompts: 1.5 }]),
    batch([{ ...row, day: "dün" }]),
    batch([row], { department: "Satış Ekibi" }),
    batch([]),
    "not json",
  ];
  for (const body of cases) assert.equal((await worker.fetch(post(body), env)).status, 400, JSON.stringify(body));
});

test("POST /v1/counts rejects unknown company and huge bodies", async () => {
  const { env } = await setup();
  assert.equal((await worker.fetch(post(batch([row], { company: "baska" })), env)).status, 404);
  assert.equal((await worker.fetch(post("x".repeat(70000)), env)).status, 413);
});

test("GET /v1/report needs the company token and sums the range", async () => {
  const { env } = await setup();
  await worker.fetch(post(batch([row, { ...row, day: "2026-12-29", task: "translate", detections: {} }])), env);
  const url = "https://api.test/v1/report?from=2026-12-28&to=2026-12-31";
  assert.equal((await worker.fetch(new Request(url), env)).status, 401);
  assert.equal((await worker.fetch(new Request(url, { headers: { authorization: "Bearer wrong" } }), env)).status, 401);
  const response = await worker.fetch(new Request(url, { headers: { authorization: `Bearer ${token}` } }), env);
  assert.equal(response.status, 200);
  const body = (await response.json()) as ReportResponse;
  assert.equal(body.name, "Puls Elektronik");
  assert.equal(body.devices, 1);
  assert.deepEqual(body.rows, [
    { department: "satis", tool: "chatgpt", task: "email", prompts: 3, detections: { tckn: 1, phone: 2 } },
    { department: "satis", tool: "chatgpt", task: "translate", prompts: 3, detections: {} },
  ]);
});

test("CORS preflight is open so the extension needs no host permission", async () => {
  const { env } = await setup();
  const response = await worker.fetch(new Request("https://api.test/v1/counts", { method: "OPTIONS" }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});
