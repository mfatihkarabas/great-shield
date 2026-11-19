import { DETECTION_KINDS, type DetectionKind, type TaskType, type AiTool } from "../../engine/src/index.ts";
import type { ReportResponse } from "../../api/src/worker.ts";

export const CANDIDATE_MIN = 20;
export const TOP_TASKS = 5;

export interface Candidate {
  department: string;
  task: TaskType;
  prompts: number;
}

export interface Analysis {
  days: number;
  prompts: number;
  detections: number;
  devices: number;
  byTool: Array<[AiTool, number]>;
  byDepartment: Array<{ department: string; prompts: number; detections: number }>;
  byKind: Array<[DetectionKind, number]>;
  topTasks: Array<[TaskType, number]>;
  candidates: Candidate[];
}

const sumDetections = (d: Partial<Record<DetectionKind, number>>) =>
  Object.values(d).reduce((s, n) => s + (n ?? 0), 0);

const sorted = <K>(map: Map<K, number>) => [...map.entries()].sort((a, b) => b[1] - a[1]);

const add = <K>(map: Map<K, number>, key: K, n: number) => map.set(key, (map.get(key) ?? 0) + n);

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
}

export function analyze(data: ReportResponse): Analysis {
  const byTool = new Map<AiTool, number>();
  const byTask = new Map<TaskType, number>();
  const byKind = new Map<DetectionKind, number>();
  const departments = new Map<string, { prompts: number; detections: number }>();
  const pairs = new Map<string, Candidate>();
  for (const row of data.rows) {
    add(byTool, row.tool, row.prompts);
    if (row.task !== "other") add(byTask, row.task, row.prompts);
    for (const kind of DETECTION_KINDS) if (row.detections[kind]) add(byKind, kind, row.detections[kind] ?? 0);
    const dep = departments.get(row.department) ?? { prompts: 0, detections: 0 };
    departments.set(row.department, { prompts: dep.prompts + row.prompts, detections: dep.detections + sumDetections(row.detections) });
    if (row.task !== "other") {
      const key = `${row.department}|${row.task}`;
      const pair = pairs.get(key) ?? { department: row.department, task: row.task, prompts: 0 };
      pairs.set(key, { ...pair, prompts: pair.prompts + row.prompts });
    }
  }
  const byDepartment = [...departments.entries()]
    .map(([department, v]) => ({ department, ...v }))
    .sort((a, b) => b.prompts - a.prompts);
  return {
    days: daysBetween(data.from, data.to),
    prompts: data.rows.reduce((s, r) => s + r.prompts, 0),
    detections: data.rows.reduce((s, r) => s + sumDetections(r.detections), 0),
    devices: data.devices,
    byTool: sorted(byTool),
    byDepartment,
    byKind: sorted(byKind),
    topTasks: sorted(byTask).slice(0, TOP_TASKS),
    candidates: [...pairs.values()].filter((c) => c.prompts >= CANDIDATE_MIN).sort((a, b) => b.prompts - a.prompts),
  };
}
