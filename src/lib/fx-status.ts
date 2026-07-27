const ASTANA_OFFSET_MINUTES = 5 * 60;
const OPEN_MINUTES = 10 * 60 + 30;
const CLOSE_MINUTES = 18 * 60;

export interface FxStatus {
  isOpen: boolean;
  isWeekday: boolean;
  astanaTime: Date;
  astanaLabel: string;
}

export function getAstanaTime(date: Date): Date {
  // date.getTime() is already an absolute UTC epoch, independent of the
  // local timezone the code happens to run in — no extra offset needed.
  return new Date(date.getTime() + ASTANA_OFFSET_MINUTES * 60000);
}

export function getFxStatus(date: Date): FxStatus {
  const astana = getAstanaTime(date);
  const day = astana.getUTCDay();
  const timeMinutes = astana.getUTCHours() * 60 + astana.getUTCMinutes();
  const isWeekday = day >= 1 && day <= 5;
  const isOpen = isWeekday && timeMinutes >= OPEN_MINUTES && timeMinutes < CLOSE_MINUTES;

  const astanaLabel = `${String(astana.getUTCHours()).padStart(2, "0")}:${String(
    astana.getUTCMinutes()
  ).padStart(2, "0")}`;

  return { isOpen, isWeekday, astanaTime: astana, astanaLabel };
}
