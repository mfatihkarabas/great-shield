import { test } from "node:test";
import assert from "node:assert/strict";
import { isCard, isIban, isTckn, isVkn } from "../src/checksums.ts";
import { classifyTask, detect, scan, toolForHost } from "../src/index.ts";
import { groupIban, makeCard, makeIban, makeTckn, makeVkn } from "./fixtures.ts";

test("checksums accept generated valid values", () => {
  for (let seed = 1; seed < 500; seed += 7) {
    assert.ok(isTckn(makeTckn(seed * 104729)));
    assert.ok(isVkn(makeVkn(seed * 7919)));
    assert.ok(isIban(makeIban(seed * 15485863)));
  }
  assert.ok(isCard(makeCard("4543")));
  assert.ok(isCard(makeCard("5400")));
});

test("checksums reject altered values", () => {
  const tckn = makeTckn(123456789);
  const broken = tckn.slice(0, 10) + ((Number(tckn[10]) + 1) % 10);
  assert.equal(isTckn(broken), false);
  assert.equal(isTckn("01234567890"), false);
  assert.equal(isIban("TR000000000000000000000000"), false);
  assert.equal(isCard("4111111111111112"), false);
});

test("detect counts every kind once in Turkish text", () => {
  const text = [
    `Müşteri TC: ${makeTckn(512341234)}`,
    `VKN ${makeVkn(123456789)}`,
    `IBAN ${groupIban(makeIban(4242424242))}`,
    `kart ${makeCard("4543").replace(/(.{4})/g, "$1 ").trim()}`,
    "tel 0532 123 45 67",
    "mail ayse.yilmaz@puls.com.tr",
    "plaka 34 ABC 1234",
  ].join("\n");
  assert.deepEqual(detect(text), { iban: 1, card: 1, tckn: 1, vkn: 1, phone: 1, email: 1, plate: 1 });
});

test("detect ignores ordinary numbers and prose", () => {
  assert.deepEqual(detect("Sipariş 2026 yılında 15 adet, toplam 12.500 TL oldu."), {});
  assert.deepEqual(detect(""), {});
});

test("detect sees through zero-width characters and full-width digits", () => {
  const tckn = makeTckn(712345678);
  const hidden = tckn.split("").join("​");
  const wide = [...tckn].map((ch) => String.fromCharCode(0xff10 + Number(ch))).join("");
  assert.equal(detect(hidden).tckn, 1);
  assert.equal(detect(wide).tckn, 1);
});

test("scan output never contains the input content", () => {
  for (let i = 0; i < 100000; i++) {
    const tckn = makeTckn(i * 9973 + 1);
    const text = `Lütfen bu müşteriye e-posta yaz: ${tckn} numaralı kişi ${i}`;
    const out = JSON.stringify(scan(text));
    assert.ok(!out.includes(tckn));
    assert.ok(!out.includes("müşteri"));
  }
});

test("classifyTask finds the task type with Turkish casing", () => {
  assert.equal(classifyTask("Bu metni İngilizceye ÇEVİR"), "translate");
  assert.equal(classifyTask("Müşteriye nazik bir e-posta yaz"), "email");
  assert.equal(classifyTask("Excel'de DÜŞEYARA formülü nasıl yazılır"), "spreadsheet");
  assert.equal(classifyTask("Bu teklif için fiyat teklifi hazırla"), "offer");
  assert.equal(classifyTask("Merhaba"), "other");
});

test("toolForHost maps known AI hosts only", () => {
  assert.equal(toolForHost("chatgpt.com"), "chatgpt");
  assert.equal(toolForHost("Claude.ai"), "claude");
  assert.equal(toolForHost("example.com"), null);
});
