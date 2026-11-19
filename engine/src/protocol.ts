import { DETECTION_KINDS, type Detections } from "./detect.ts";
import { TASK_TYPES, type TaskType } from "./task.ts";
import { AI_TOOLS, type AiTool } from "./tools.ts";

export const PROTOCOL_VERSION = 1;
export const MAX_ROWS = 500;
export const MAX_COUNT = 100000;

export interface CountRow {
  day: string;
  tool: AiTool;
  task: TaskType;
  prompts: number;
  detections: Detections;
}

export interface Batch {
  v: typeof PROTOCOL_VERSION;
  company: string;
  department: string;
  device: string;
  rows: CountRow[];
}

export type Invalid = { ok: false; error: string };
export type Valid = { ok: true; batch: Batch };

const CODE = /^[a-z0-9][a-z0-9-]{2,39}$/;
const DEVICE = /^[a-f0-9-]{36}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_COUNT;
const hasOnly = (value: object, keys: readonly string[]) => Object.keys(value).every((k) => keys.includes(k));
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function validRow(row: unknown): row is CountRow {
  if (!isObject(row) || !hasOnly(row, ["day", "tool", "task", "prompts", "detections"])) return false;
  if (typeof row.day !== "string" || !DAY.test(row.day)) return false;
  if (!AI_TOOLS.includes(row.tool as AiTool)) return false;
  if (!TASK_TYPES.includes(row.task as TaskType)) return false;
  if (!isCount(row.prompts)) return false;
  const detections = row.detections;
  if (!isObject(detections) || !hasOnly(detections, DETECTION_KINDS)) return false;
  return Object.values(detections).every(isCount);
}

export function validateBatch(input: unknown): Valid | Invalid {
  if (!isObject(input) || !hasOnly(input, ["v", "company", "department", "device", "rows"])) {
    return { ok: false, error: "shape" };
  }
  if (input.v !== PROTOCOL_VERSION) return { ok: false, error: "version" };
  if (typeof input.company !== "string" || !CODE.test(input.company)) return { ok: false, error: "company" };
  if (typeof input.department !== "string" || !CODE.test(input.department)) return { ok: false, error: "department" };
  if (typeof input.device !== "string" || !DEVICE.test(input.device)) return { ok: false, error: "device" };
  if (!Array.isArray(input.rows) || input.rows.length === 0 || input.rows.length > MAX_ROWS) {
    return { ok: false, error: "rows" };
  }
  if (!input.rows.every(validRow)) return { ok: false, error: "row" };
  return { ok: true, batch: input as unknown as Batch };
}
