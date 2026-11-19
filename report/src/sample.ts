import type { ReportResponse } from "../../api/src/worker.ts";

export const SAMPLE: ReportResponse = {
  company: "ornek",
  name: "Örnek Elektronik",
  from: "2026-12-28",
  to: "2027-01-10",
  devices: 5,
  rows: [
    { department: "satis", tool: "chatgpt", task: "email", prompts: 96, detections: { email: 14, phone: 9 } },
    { department: "satis", tool: "chatgpt", task: "offer", prompts: 41, detections: { vkn: 3 } },
    { department: "satis", tool: "gemini", task: "translate", prompts: 28, detections: {} },
    { department: "muhasebe", tool: "chatgpt", task: "spreadsheet", prompts: 63, detections: { iban: 4, vkn: 2 } },
    { department: "muhasebe", tool: "copilot", task: "summarize", prompts: 22, detections: { tckn: 2 } },
    { department: "uretim", tool: "chatgpt", task: "report", prompts: 31, detections: {} },
    { department: "uretim", tool: "deepseek", task: "code", prompts: 12, detections: { email: 1 } },
    { department: "uretim", tool: "chatgpt", task: "other", prompts: 119, detections: { phone: 2 } },
  ],
};
