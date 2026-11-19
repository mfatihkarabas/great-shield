import type { ReportResponse } from "../../api/src/worker.ts";
import { analyze } from "./analyze.ts";
import tr from "../locales/tr.json" with { type: "json" };
import en from "../locales/en.json" with { type: "json" };

export const LOCALES = { tr, en } as const;
export type Locale = keyof typeof LOCALES;
type Key = keyof typeof tr;

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);

export function translator(locale: Locale) {
  const messages = LOCALES[locale] as Record<Key, string>;
  return (key: Key | string, vars: Record<string, string | number> = {}) =>
    escape(messages[key as Key] ?? key).replace(/\{(\w+)\}/g, (_, name) => escape(String(vars[name] ?? "")));
}

const bars = (items: Array<[string, number]>, max: number) =>
  items
    .map(
      ([label, n]) =>
        `<li><span class="label">${label}</span><span class="track"><span class="fill" style="width:${max ? Math.max(2, Math.round((n / max) * 100)) : 0}%"></span></span><span class="value">${n}</span></li>`,
    )
    .join("");

export function renderReport(data: ReportResponse, locale: Locale = "tr"): string {
  const t = translator(locale);
  const a = analyze(data);
  const fmt = new Intl.NumberFormat(locale);
  const toolItems = a.byTool.map(([tool, n]) => [t(`tool_${tool}`), n] as [string, number]);
  const kindItems = a.byKind.map(([kind, n]) => [t(`kind_${kind}`), n] as [string, number]);
  const taskItems = a.topTasks.map(([task, n]) => [t(`task_${task}`), n] as [string, number]);
  const departmentRows = a.byDepartment
    .map((d) => `<tr><td>${escape(d.department)}</td><td>${fmt.format(d.prompts)}</td><td>${fmt.format(d.detections)}</td></tr>`)
    .join("");
  const candidates = a.candidates.length
    ? `<ol class="candidates">${a.candidates
        .map((c) => `<li>${t("candidate_line", { department: c.department, days: a.days, n: c.prompts, task: t(`task_${c.task}`) })}</li>`)
        .join("")}</ol>`
    : `<p class="muted">${t("no_candidates")}</p>`;

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t("title")} · ${escape(data.name)}</title>
<style>
:root{--bg:#0a0a0b;--surface:#121214;--line:#222226;--text:#f4f4f5;--muted:#9a9aa3;--green:#4ade80;--amber:#f59e0b;--blue:#3b9cff;color-scheme:dark}
@media (prefers-color-scheme: light){:root{--bg:#fff;--surface:#f6f6f7;--line:#e4e4e7;--text:#18181b;--muted:#6b6b73;--green:#16a34a;--amber:#b45309;--blue:#2563eb;color-scheme:light}}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:32px 16px}
main{max-width:760px;margin:0 auto;display:grid;gap:16px}
h1{font-size:28px;font-weight:650;letter-spacing:-.01em}
h2{font-size:14px;font-weight:600;color:var(--muted);margin-bottom:12px}
.sub{color:var(--muted)}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.kpi,.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px}
.kpi strong{display:block;font-size:28px;font-weight:650}
.kpi span{color:var(--muted);font-size:13px}
.kpi.warn strong{color:var(--amber)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
ul.bars{list-style:none;padding:0;display:grid;gap:8px}
ul.bars li{display:grid;grid-template-columns:120px 1fr 48px;align-items:center;gap:8px;font-size:14px}
.track{height:8px;background:var(--line);border-radius:4px;overflow:hidden}
.fill{display:block;height:100%;background:var(--blue);border-radius:4px}
.kinds .fill{background:var(--amber)}
.value{text-align:right;font-variant-numeric:tabular-nums}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:8px 0;border-bottom:1px solid var(--line)}
th{color:var(--muted);font-weight:500}
td:not(:first-child),th:not(:first-child){text-align:right;font-variant-numeric:tabular-nums}
.candidates{padding-left:20px;display:grid;gap:8px}
.candidates li::marker{color:var(--green);font-weight:600}
.muted,.foot{color:var(--muted);font-size:13px}
.foot{display:grid;gap:4px}
@media (max-width:640px){.grid,.kpis{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<header><h1>${t("title")}</h1><p class="sub">${t("subtitle", { company: data.name, from: data.from, to: data.to, days: a.days })}</p></header>
<section class="kpis">
<div class="kpi"><strong>${fmt.format(a.prompts)}</strong><span>${t("prompts")}</span></div>
<div class="kpi warn"><strong>${fmt.format(a.detections)}</strong><span>${t("detections")}</span></div>
<div class="kpi"><strong>${fmt.format(a.devices)}</strong><span>${t("devices")}</span></div>
</section>
<section class="card"><h2>${t("candidates")}</h2>${candidates}</section>
<section class="grid">
<div class="card"><h2>${t("by_tool")}</h2><ul class="bars">${bars(toolItems, a.byTool[0]?.[1] ?? 0)}</ul></div>
<div class="card kinds"><h2>${t("by_kind")}</h2>${kindItems.length ? `<ul class="bars">${bars(kindItems, a.byKind[0]?.[1] ?? 0)}</ul>` : `<p class="muted">${t("none")}</p>`}</div>
</section>
<section class="grid">
<div class="card"><h2>${t("top_tasks")}</h2><ul class="bars">${bars(taskItems, a.topTasks[0]?.[1] ?? 0)}</ul></div>
<div class="card"><h2>${t("by_department")}</h2><table><thead><tr><th></th><th>${t("col_prompts")}</th><th>${t("col_detections")}</th></tr></thead><tbody>${departmentRows}</tbody></table></div>
</section>
<section class="card"><h2>${t("kvkk_title")}</h2><p>${t("kvkk_body")}</p></section>
<footer class="foot"><p>${t("privacy")}</p><p>${t("scope")}</p></footer>
</main>
</body>
</html>`;
}
