import { build } from "esbuild";
import { cp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { TOOL_HOSTS } from "../engine/src/tools.ts";

const root = fileURLToPath(new URL("../extension/", import.meta.url));
const dist = `${root}dist/`;
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(`${root}public/`, dist, { recursive: true });

await build({
  entryPoints: {
    content: `${root}src/content.ts`,
    background: `${root}src/background.ts`,
    popup: `${root}src/popup.ts`,
  },
  outdir: dist,
  bundle: true,
  format: "iife",
  target: "chrome120",
  minify: true,
  legalComments: "none",
});

const matches = Object.keys(TOOL_HOSTS).map((host) => `https://${host}/*`);

const manifest = {
  manifest_version: 3,
  name: "__MSG_extName__",
  description: "__MSG_extDescription__",
  version: pkg.version ?? "0.1.0",
  default_locale: "tr",
  minimum_chrome_version: "120",
  permissions: ["storage", "alarms"],
  background: { service_worker: "background.js" },
  action: { default_popup: "popup.html", default_title: "__MSG_extName__" },
  content_scripts: [{ matches, js: ["content.js"], run_at: "document_idle", all_frames: false }],
  storage: { managed_schema: "managed_schema.json" },
};

await writeFile(`${dist}manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`extension built: ${dist}`);
