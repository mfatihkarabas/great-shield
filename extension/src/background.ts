import { addScan, localDay, toBatch, withoutKeys, type Config, type Counts } from "./counter.ts";
import { FLUSH_ALARM, FLUSH_MINUTES, STORAGE, type ScanMessage } from "./messages.ts";

async function readCounts(): Promise<Counts> {
  const stored = await chrome.storage.local.get(STORAGE.counts);
  return (stored[STORAGE.counts] as Counts | undefined) ?? {};
}

async function deviceId(): Promise<string> {
  const stored = await chrome.storage.local.get(STORAGE.device);
  const existing = stored[STORAGE.device] as string | undefined;
  if (existing) return existing;
  const created = crypto.randomUUID();
  await chrome.storage.local.set({ [STORAGE.device]: created });
  return created;
}

async function readConfig(): Promise<Config | null> {
  const managed = (await chrome.storage.managed.get(["company", "department", "endpoint"]).catch(() => ({}))) as Partial<Config>;
  if (!managed.company || !managed.endpoint) return null;
  return { company: managed.company, department: managed.department ?? "genel", endpoint: managed.endpoint };
}

async function flush() {
  const config = await readConfig();
  if (!config) return;
  const prepared = toBatch(await readCounts(), config, await deviceId());
  if (!prepared) return;
  const response = await fetch(`${config.endpoint.replace(/\/$/, "")}/v1/counts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(prepared.batch),
  }).catch(() => null);
  if (!response?.ok) return;
  await chrome.storage.local.set({
    [STORAGE.counts]: withoutKeys(await readCounts(), prepared.keys),
    [STORAGE.lastSync]: new Date().toISOString(),
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(FLUSH_ALARM, { periodInMinutes: FLUSH_MINUTES });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === FLUSH_ALARM) void flush();
});

chrome.runtime.onMessage.addListener((message: ScanMessage) => {
  if (message?.type !== "scan") return;
  void readCounts().then((counts) =>
    chrome.storage.local.set({ [STORAGE.counts]: addScan(counts, localDay(new Date()), message.tool, message.scan) }),
  );
});
