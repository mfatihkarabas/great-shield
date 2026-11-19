import { detect, type Detections } from "./detect.ts";
import { classifyTask, type TaskType } from "./task.ts";

export { DETECTION_KINDS, detect, normalize, type DetectionKind, type Detections } from "./detect.ts";
export { TASK_TYPES, classifyTask, type TaskType } from "./task.ts";
export { AI_TOOLS, TOOL_HOSTS, toolForHost, type AiTool } from "./tools.ts";
export { MAX_COUNT, MAX_ROWS, PROTOCOL_VERSION, validateBatch, type Batch, type CountRow } from "./protocol.ts";

export interface Scan {
  task: TaskType;
  detections: Detections;
}

export function scan(text: string): Scan {
  return { task: classifyTask(text), detections: detect(text) };
}
