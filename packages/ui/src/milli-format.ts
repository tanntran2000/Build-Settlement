// Tile display accepts safe integer milli values, including signed ledger deltas.
export function formatMilli(milli: number): string {
  const digits = String(Math.abs(milli)).padStart(4, '0');
  const whole = digits.slice(0, -3).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = digits.slice(-3).replace(/0+$/, '');
  const sign = milli < 0 || Object.is(milli, -0) ? '-' : '';
  return `${sign}${whole}${fraction ? '.' + fraction : ''}`;
}
