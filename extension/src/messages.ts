import type { AiTool, Scan } from "../../engine/src/index.ts";

export interface ScanMessage {
  type: "scan";
  tool: AiTool;
  scan: Scan;
}

export const STORAGE = {
  counts: "counts",
  device: "device",
  lastSync: "lastSync",
} as const;

export const FLUSH_ALARM = "flush";
export const FLUSH_MINUTES = 60;
