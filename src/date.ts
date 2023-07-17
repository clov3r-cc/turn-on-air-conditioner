import { format } from 'date-fns-tz';

export const isWeekend = (dayOfWeek: number) => {
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  return isSaturday || isSunday;
};

export const isBannedHour = (hour: number) => 0 <= hour && hour <= 6;

export const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
