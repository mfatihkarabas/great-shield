import { MAX_ROWS, PROTOCOL_VERSION, type AiTool, type Batch, type CountRow, type Scan } from "../../engine/src/index.ts";

export type Counts = Record<string, CountRow>;

export interface Config {
  company: string;
  department: string;
  endpoint: string;
}

export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addScan(counts: Counts, day: string, tool: AiTool, scan: Scan): Counts {
  const key = `${day}|${tool}|${scan.task}`;
  const row = counts[key] ?? { day, tool, task: scan.task, prompts: 0, detections: {} };
  const detections = { ...row.detections };
  for (const [kind, n] of Object.entries(scan.detections) as Array<[keyof typeof detections, number]>) {
    detections[kind] = (detections[kind] ?? 0) + n;
  }
  return { ...counts, [key]: { ...row, prompts: row.prompts + 1, detections } };
}

export function toBatch(counts: Counts, config: Config, device: string): { batch: Batch; keys: string[] } | null {
  const keys = Object.keys(counts).slice(0, MAX_ROWS);
  if (keys.length === 0) return null;
  return {
    batch: {
      v: PROTOCOL_VERSION,
      company: config.company,
      department: config.department,
      device,
      rows: keys.map((key) => counts[key]),
    },
    keys,
  };
}

export function withoutKeys(counts: Counts, keys: string[]): Counts {
  return Object.fromEntries(Object.entries(counts).filter(([key]) => !keys.includes(key)));
}

export interface Summary {
  prompts: number;
  detections: number;
  topTool: AiTool | null;
}

export function summarize(counts: Counts, day: string): Summary {
  const rows = Object.values(counts).filter((row) => row.day === day);
  const byTool = new Map<AiTool, number>();
  let prompts = 0;
  let detections = 0;
  for (const row of rows) {
    prompts += row.prompts;
    detections += Object.values(row.detections).reduce((sum, n) => sum + (n ?? 0), 0);
    byTool.set(row.tool, (byTool.get(row.tool) ?? 0) + row.prompts);
  }
  const topTool = [...byTool.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { prompts, detections, topTool };
}
