import { isCard, isIban, isTckn, isVkn } from "./checksums.ts";

export const DETECTION_KINDS = ["iban", "card", "tckn", "vkn", "phone", "email", "plate"] as const;
export type DetectionKind = (typeof DETECTION_KINDS)[number];
export type Detections = Partial<Record<DetectionKind, number>>;

interface Rule {
  kind: DetectionKind;
  pattern: RegExp;
  valid?: (match: string) => boolean;
}

const RULES: Rule[] = [
  { kind: "iban", pattern: /\bTR\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/gi, valid: isIban },
  { kind: "card", pattern: /\b[3-6]\d{3}(?:[\s-]?\d{3,4}){2,4}\b/g, valid: isCard },
  { kind: "tckn", pattern: /\b[1-9]\d{10}\b/g, valid: isTckn },
  { kind: "vkn", pattern: /\b\d{10}\b/g, valid: isVkn },
  { kind: "phone", pattern: /(?:\+90|\b0)[\s-]?\(?[2-5]\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g },
  { kind: "email", pattern: /\b[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}\b/gu },
  { kind: "plate", pattern: /\b(?:0[1-9]|[1-7]\d|8[01])\s?[A-PR-VYZ]{1,3}\s?\d{2,4}\b/g },
];

export function normalize(text: string): string {
  return text.normalize("NFKC").replace(/[​-‍﻿­]/g, "");
}

export function detect(text: string): Detections {
  const source = normalize(text);
  const taken: Array<[number, number]> = [];
  const overlaps = (start: number, end: number) => taken.some(([s, e]) => start < e && end > s);
  const counts: Detections = {};
  for (const rule of RULES) {
    for (const match of source.matchAll(rule.pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      if (overlaps(start, end)) continue;
      if (rule.valid && !rule.valid(match[0])) continue;
      taken.push([start, end]);
      counts[rule.kind] = (counts[rule.kind] ?? 0) + 1;
    }
  }
  return counts;
}
