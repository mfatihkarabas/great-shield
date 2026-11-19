const digitsOf = (value: string): number[] => [...value].map(Number);

export function isTckn(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = digitsOf(value);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const tenth = (((odd * 7 - even) % 10) + 10) % 10;
  if (tenth !== d[9]) return false;
  const eleventh = d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10;
  return eleventh === d[10];
}

export function isVkn(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const d = digitsOf(value);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const shifted = (d[i] + 9 - i) % 10;
    let weighted = (shifted * 2 ** (9 - i)) % 9;
    if (shifted !== 0 && weighted === 0) weighted = 9;
    sum += weighted;
  }
  return (10 - (sum % 10)) % 10 === d[9];
}

export function isIban(value: string): boolean {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  if (!/^TR\d{24}$/.test(compact)) return false;
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) remainder = (remainder * 10 + Number(ch)) % 97;
  return remainder === 1;
}

export function isCard(value: string): boolean {
  const compact = value.replace(/[\s-]/g, "");
  if (!/^[3-6]\d{12,18}$/.test(compact)) return false;
  let sum = 0;
  let double = false;
  for (let i = compact.length - 1; i >= 0; i--) {
    let n = Number(compact[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}
