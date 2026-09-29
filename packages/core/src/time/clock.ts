export interface GameDate {
  day: number;
  week: number;
  year: number;
}

export function advanceTime(current: GameDate): GameDate {
  const nextDay = current.day + 1;
  const nextWeek = Math.floor((nextDay - 1) / 7) + 1;
  const nextYear = Math.floor((nextDay - 1) / 365) + 1;
  return {
    day: nextDay,
    week: nextWeek,
    year: nextYear,
  };
}
