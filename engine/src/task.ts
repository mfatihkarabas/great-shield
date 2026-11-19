import { normalize } from "./detect.ts";

export const TASK_TYPES = ["email", "translate", "summarize", "code", "spreadsheet", "offer", "report", "other"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

const KEYWORDS: Record<Exclude<TaskType, "other">, string[]> = {
  email: ["e-posta", "eposta", "mail", "email", "yanıt yaz", "cevap yaz", "reply"],
  translate: ["çevir", "tercüme", "ingilizce", "translate", "translation", "almanca"],
  summarize: ["özetle", "özet", "summarize", "summary", "kısalt", "tl;dr"],
  code: ["kod", "fonksiyon", "sql", "python", "javascript", "hata veriyor", "function", "regex", "bug"],
  spreadsheet: ["excel", "formül", "formula", "pivot", "düşeyara", "vlookup", "tablo", "sheets"],
  offer: ["teklif", "fiyat teklifi", "proforma", "quotation", "quote", "proposal"],
  report: ["rapor", "sunum", "report", "presentation", "toplantı notu", "dilekçe"],
};

export function classifyTask(text: string): TaskType {
  const lower = normalize(text).toLocaleLowerCase("tr");
  let best: TaskType = "other";
  let bestScore = 0;
  for (const [task, words] of Object.entries(KEYWORDS) as Array<[TaskType, string[]]>) {
    const score = words.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
    if (score > bestScore) {
      best = task;
      bestScore = score;
    }
  }
  return best;
}
