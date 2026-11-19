import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { scan, validateBatch } from "../../engine/src/index.ts";
import { addScan, localDay, summarize, toBatch, withoutKeys, type Counts } from "../src/counter.ts";

const config = { company: "puls", department: "satis", endpoint: "http://localhost:8787" };
const device = "3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b";

test("addScan groups prompts by day, tool and task", () => {
  let counts: Counts = {};
  counts = addScan(counts, "2026-12-28", "chatgpt", scan("Müşteriye e-posta yaz, tel 0532 123 45 67"));
  counts = addScan(counts, "2026-12-28", "chatgpt", scan("Bir e-posta daha yaz"));
  counts = addScan(counts, "2026-12-28", "gemini", scan("Bunu İngilizceye çevir"));
  assert.equal(Object.keys(counts).length, 2);
  assert.deepEqual(counts["2026-12-28|chatgpt|email"], {
    day: "2026-12-28",
    tool: "chatgpt",
    task: "email",
    prompts: 2,
    detections: { phone: 1 },
  });
});

test("toBatch builds a batch that the API accepts", () => {
  const counts = addScan({}, "2026-12-28", "claude", scan("Özetle: ayse@puls.com.tr"));
  const prepared = toBatch(counts, config, device);
  assert.ok(prepared);
  assert.deepEqual(validateBatch(prepared.batch), { ok: true, batch: prepared.batch });
  assert.deepEqual(withoutKeys(counts, prepared.keys), {});
  assert.equal(toBatch({}, config, device), null);
});

test("summarize reports today's totals and the top tool", () => {
  let counts: Counts = {};
  counts = addScan(counts, "2026-12-28", "chatgpt", scan("e-posta yaz 0532 123 45 67"));
  counts = addScan(counts, "2026-12-28", "chatgpt", scan("özetle"));
  counts = addScan(counts, "2026-12-28", "gemini", scan("çevir"));
  counts = addScan(counts, "2026-12-27", "gemini", scan("çevir"));
  assert.deepEqual(summarize(counts, "2026-12-28"), { prompts: 3, detections: 1, topTool: "chatgpt" });
  assert.equal(localDay(new Date(2026, 0, 5)), "2026-01-05");
});

test("every locale has the same keys", async () => {
  const read = async (lang: string) =>
    Object.keys(JSON.parse(await readFile(new URL(`../public/_locales/${lang}/messages.json`, import.meta.url), "utf8"))).sort();
  assert.deepEqual(await read("tr"), await read("en"));
});

test("popup uses only keys that exist in locales", async () => {
  const html = await readFile(new URL("../public/popup.html", import.meta.url), "utf8");
  const source = await readFile(new URL("../src/popup.ts", import.meta.url), "utf8");
  const messages = JSON.parse(await readFile(new URL("../public/_locales/tr/messages.json", import.meta.url), "utf8"));
  const used = [...html.matchAll(/data-i18n="([^"]+)"/g), ...source.matchAll(/\bt\("([^"]+)"/g)].map((m) => m[1]);
  for (const key of used) assert.ok(key in messages, key);
});
