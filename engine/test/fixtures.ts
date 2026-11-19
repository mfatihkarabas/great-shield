export function makeTckn(seed: number): string {
  const d = String(100000000 + (seed % 900000000)).split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  d.push((((odd * 7 - even) % 10) + 10) % 10);
  d.push(d.reduce((s, n) => s + n, 0) % 10);
  return d.join("");
}

export function makeVkn(seed: number): string {
  const d = String(seed % 1000000000).padStart(9, "0").split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const shifted = (d[i] + 9 - i) % 10;
    let weighted = (shifted * 2 ** (9 - i)) % 9;
    if (shifted !== 0 && weighted === 0) weighted = 9;
    sum += weighted;
  }
  d.push((10 - (sum % 10)) % 10);
  return d.join("");
}

export function makeIban(seed: number): string {
  const bban = String(seed).padStart(22, "0").slice(-22);
  const numeric = bban + "2927" + "00";
  let remainder = 0;
  for (const ch of numeric) remainder = (remainder * 10 + Number(ch)) % 97;
  const check = String(98 - remainder).padStart(2, "0");
  return `TR${check}${bban}`;
}

export function makeCard(prefix: string): string {
  const body = prefix.padEnd(15, "0");
  for (let last = 0; last < 10; last++) {
    const candidate = body + last;
    let sum = 0;
    let double = false;
    for (let i = candidate.length - 1; i >= 0; i--) {
      let n = Number(candidate[i]);
      if (double) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      double = !double;
    }
    if (sum % 10 === 0) return candidate;
  }
  throw new Error("unreachable");
}

export function groupIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}
