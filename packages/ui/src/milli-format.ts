// Tile display accepts safe integer milli values, including signed ledger deltas.
export function formatMilli(milli: number): string {
  const digits = String(Math.abs(milli)).padStart(4, '0');
  const whole = digits.slice(0, -3).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = digits.slice(-3).replace(/0+$/, '');
  const sign = milli < 0 || Object.is(milli, -0) ? '-' : '';
  return `${sign}${whole}${fraction ? '.' + fraction : ''}`;
}

export function formatFulfillment(suppliedMilli: unknown, demandMilli: unknown): string {
  if (typeof suppliedMilli !== 'number' || !Number.isSafeInteger(suppliedMilli) || suppliedMilli < 0 ||
      typeof demandMilli !== 'number' || !Number.isSafeInteger(demandMilli) || demandMilli < 0 ||
      suppliedMilli > demandMilli) return 'Unavailable';
  if (demandMilli === 0) return 'No demand';
  const basisPoints = Number((BigInt(suppliedMilli) * 10000n) / BigInt(demandMilli));
  const fraction = String(basisPoints % 100).padStart(2, '0').replace(/0+$/, '');
  return `${Math.floor(basisPoints / 100)}${fraction ? '.' + fraction : ''}%`;
}
