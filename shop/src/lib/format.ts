export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

export function formatToman(amount: number | bigint): string {
  const formatted = Number(amount).toLocaleString('en-US');
  return toPersianDigits(formatted);
}
