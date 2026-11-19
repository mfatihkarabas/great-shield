import { mkdir, writeFile } from "node:fs/promises";
import { renderReport } from "../report/src/render.ts";
import { SAMPLE } from "../report/src/sample.ts";

const dist = new URL("../report/dist/", import.meta.url);
await mkdir(dist, { recursive: true });
for (const locale of ["tr", "en"]) {
  await writeFile(new URL(`sample.${locale}.html`, dist), renderReport(SAMPLE, locale));
}
console.log(`report samples written: ${dist.pathname}`);
