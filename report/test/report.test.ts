import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, CANDIDATE_MIN, daysBetween } from "../src/analyze.ts";
import { LOCALES, renderReport } from "../src/render.ts";
import { SAMPLE } from "../src/sample.ts";
import { DETECTION_KINDS, TASK_TYPES, AI_TOOLS } from "../../engine/src/index.ts";

test("analyze sums totals and finds automation candidates", () => {
  const a = analyze(SAMPLE);
  assert.equal(a.days, 14);
  assert.equal(a.prompts, 412);
  assert.equal(a.detections, 37);
  assert.deepEqual(a.byTool[0], ["chatgpt", 350]);
  assert.deepEqual(a.byKind[0], ["email", 15]);
  assert.ok(a.candidates.every((c) => c.prompts >= CANDIDATE_MIN && c.task !== "other"));
  assert.deepEqual(a.candidates.map((c) => `${c.department}:${c.task}`), [
    "satis:email",
    "muhasebe:spreadsheet",
    "satis:offer",
    "uretim:report",
    "satis:translate",
    "muhasebe:summarize",
  ]);
  assert.ok(!a.topTasks.some(([task]) => task === "other"));
});

test("daysBetween counts both ends", () => {
  assert.equal(daysBetween("2026-12-28", "2026-12-28"), 1);
  assert.equal(daysBetween("2026-12-28", "2027-01-10"), 14);
});

test("renderReport escapes department names", () => {
  const html = renderReport({ ...SAMPLE, rows: [{ ...SAMPLE.rows[0], department: "<script>x</script>" }] });
  assert.ok(!html.includes("<script>x"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("renderReport shows the key numbers in Turkish", () => {
  const html = renderReport(SAMPLE, "tr");
  assert.ok(html.includes("Örnek Elektronik"));
  assert.ok(html.includes("412"));
  assert.ok(html.includes("Otomasyon adayları"));
});

test("locales share keys and cover every enum", () => {
  assert.deepEqual(Object.keys(LOCALES.tr).sort(), Object.keys(LOCALES.en).sort());
  const keys = new Set(Object.keys(LOCALES.tr));
  for (const k of DETECTION_KINDS) assert.ok(keys.has(`kind_${k}`), k);
  for (const k of TASK_TYPES) assert.ok(keys.has(`task_${k}`), k);
  for (const k of AI_TOOLS) assert.ok(keys.has(`tool_${k}`), k);
});
