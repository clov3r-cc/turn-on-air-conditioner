import { format } from 'date-fns-tz';

/**
 * 週末かどうかを判定する
 * @param dayOfWeek 週のうちの何曜日か。0から6までの値をとる。0が日曜日で、1が月曜日。
 * @returns 土曜日または日曜日であればtrue、それ以外はfalse
 */
export const isWeekend = (dayOfWeek: number) => {
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  return isSaturday || isSunday;
};

/**
 * 判定を行わない時間かどうかを判定する
 * @param hour 判定する時刻（n時）
 * @returns 0時から6時の間であればtrue、それ以外はfalse
 */
export const isBannedHour = (hour: number) => hour >= 0 && hour <= 6;

/**
 * `Date`をフォーマットした日付の文字列を返す
 * @param date フォーマットする日付
 * @returns 'yyyy-MM-dd'形式にフォーマットした文字列
 */
export const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
