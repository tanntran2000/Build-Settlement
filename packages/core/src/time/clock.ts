export interface GameDate {
  day: number;
  week: number;
  year: number;
}

export function advanceTime(current: GameDate): GameDate {
  if (
    !current ||
    typeof current !== "object" ||
    !Number.isSafeInteger(current.day) ||
    current.day < 1
  ) {
    throw new RangeError("GameDate day must be a positive safe integer");
  }

  if (current.day >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError("Cannot advance time: day exceeds MAX_SAFE_INTEGER");
  }

  const nextDay = current.day + 1;
  const nextWeek = Math.floor((nextDay - 1) / 7) + 1;
  const nextYear = Math.floor((nextDay - 1) / 365) + 1;
  return {
    day: nextDay,
    week: nextWeek,
    year: nextYear,
  };
}
