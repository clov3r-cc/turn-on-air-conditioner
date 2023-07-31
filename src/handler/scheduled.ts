import { isHoliday } from '@holiday-jp/holiday_jp';
import { utcToZonedTime } from 'date-fns-tz';
import { TIME_ZONE, TRIGGERS } from '../lib/const';
import { isWeekend, isBannedHour, formatDate } from '../lib/date';
import { notifyAirConditionerOnToDiscord } from '../lib/discord';
import { initSentry } from '../lib/sentry';
import { SwitchBotClient } from '../lib/switchbot';
import { filterValidTrigger } from '../lib/trigger';
import { Handler } from './type';

/**
 * 与えられた日付において、本プログラムによってエアコンがつけられたかどうかを返す
 * @param date 確認したい日付
 * @param kv Cloudflare KVのインスタンス
 * @returns 与えられた日付において、本プログラムによってエアコンがつけられたかどうか
 */
const isAlreadyTurnedOnToday = async (date: string, kv: KVNamespace) => kv.get(date).then((v) => !!v);

export const scheduled: Handler['scheduled'] = async (cont, env, context) => {
  const sentry = initSentry(env.SENTRY_DSN, env.SENTRY_CLIENT_ID, env.SENTRY_CLIENT_SECRET, context);

  try {
    const jstNow = utcToZonedTime(new Date(), TIME_ZONE);
    if (isWeekend(jstNow.getDay()) || isHoliday(jstNow)) return;
    if (isBannedHour(jstNow.getHours())) return;
    const formattedDate = formatDate(jstNow);
    if (await isAlreadyTurnedOnToday(formattedDate, env.HISTORY)) return;

    const triggerTemps = [...new Set(filterValidTrigger(TRIGGERS, jstNow.getHours()).map((t) => t.temp))];
    if (triggerTemps.length === 0) return;

    const client = new SwitchBotClient(env.SWITCHBOT_TOKEN, env.SWITCHBOT_CLIENT_SECRET);
    const actualTemp = await client.getMeterStatus(env.METER_DEVICE_ID).then((stat) => stat.temperature);
    const isTempHigherThanTriggers = !!triggerTemps.find((triggerTemp) => actualTemp >= triggerTemp);
    if (!isTempHigherThanTriggers) return;

    await client.turnOnAirConditioner(env.AIR_CONDITIONER_DEVICE_ID, 28);
    // 1日でKVに書き込んだものを削除
    await env.HISTORY.put(formattedDate, 'done!', { expirationTtl: 60 * 60 * 24 });
    await notifyAirConditionerOnToDiscord(env.NOTIFICATION_WEBHOOK_URL, jstNow, actualTemp);
  } catch (e: unknown) {
    if (e instanceof Error && env.NODE_ENV === 'production') {
      sentry.captureException(e);
    }
  }
};
