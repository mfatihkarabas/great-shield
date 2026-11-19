import { scan, toolForHost } from "../../engine/src/index.ts";
import type { ScanMessage } from "./messages.ts";

const tool = toolForHost(location.hostname);
const SEND_LABEL = /send|gönder|submit/i;
const DEDUPE_MS = 1500;

let lastEditor: HTMLElement | null = null;
let lastText = "";
let lastAt = 0;

const isEditor = (el: EventTarget | null): el is HTMLElement =>
  el instanceof HTMLTextAreaElement || (el instanceof HTMLElement && el.isContentEditable);

const textOf = (el: HTMLElement) => (el instanceof HTMLTextAreaElement ? el.value : el.innerText);

function report(el: HTMLElement | null) {
  if (!tool || !el) return;
  const text = textOf(el).trim();
  const now = Date.now();
  if (!text || (text === lastText && now - lastAt < DEDUPE_MS)) return;
  lastText = text;
  lastAt = now;
  const message: ScanMessage = { type: "scan", tool, scan: scan(text) };
  chrome.runtime.sendMessage(message).catch(() => undefined);
}

document.addEventListener("focusin", (event) => {
  if (isEditor(event.target)) lastEditor = event.target;
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  if (isEditor(event.target)) report(event.target);
}, true);

document.addEventListener("click", (event) => {
  const button = (event.target as Element | null)?.closest?.("button");
  if (!button) return;
  const label = `${button.getAttribute("aria-label") ?? ""} ${button.getAttribute("data-testid") ?? ""}`;
  if (SEND_LABEL.test(label)) report(lastEditor);
}, true);
