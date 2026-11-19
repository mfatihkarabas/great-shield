import { localDay, summarize, type Counts } from "./counter.ts";
import { STORAGE } from "./messages.ts";

const t = (key: string, subs?: string[]) => chrome.i18n.getMessage(key, subs);

function translate(root: ParentNode) {
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n ?? "");
  }
}

async function render() {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  translate(document);
  const stored = await chrome.storage.local.get([STORAGE.counts, STORAGE.lastSync]);
  const summary = summarize((stored[STORAGE.counts] as Counts | undefined) ?? {}, localDay(new Date()));
  const managed = await chrome.storage.managed.get(["company"]).catch(() => ({}) as Record<string, unknown>);
  const set = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  set("prompts", String(summary.prompts));
  set("detections", String(summary.detections));
  set("tool", summary.topTool ? t(`tool_${summary.topTool}`) : t("popup_none"));
  set("status", managed.company ? t("popup_connected", [String(managed.company)]) : t("popup_local"));
}

void render();
