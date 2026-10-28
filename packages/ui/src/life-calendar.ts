export function formatLifeWeek(absoluteWeek: number): string {
  if (!Number.isSafeInteger(absoluteWeek) || absoluteWeek <= 0) return 'Unavailable';
  const elapsed = absoluteWeek - 1;
  return `Week ${elapsed % 40 + 1} · Year ${Math.floor(elapsed / 40) + 1}`;
}
