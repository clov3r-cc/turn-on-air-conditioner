import { utcToZonedTime } from 'date-fns-tz';
import { isHoliday } from '@holiday-jp/holiday_jp';
import { Toucan } from 'toucan-js';
import { formatDate, isBannedHour, isWeekend } from './date';
import { filterValidTrigger, type Trigger } from './pair';
import { SwitchBotClient } from './switchbot';
import { notifyAirConditionerOnToDiscord } from './discord';

export type Env = {
  TURN_ON_AIR_CON_HISTORY: KVNamespace;

  // region wrangler.tomlに直接書き込まれている環境変数
  METER_DEVICE_ID: string;
  AIR_CONDITIONER_DEVICE_ID: string;
  SENTRY_DSN: string;
  // endregion

  // region GitHubの秘密変数に設定があって、GitHubActionsによって注入されている環境変数
  NODE_ENV: 'production' | 'dev';
  SWITCHBOT_TOKEN: string;
  SWITCHBOT_CLIENT_SECRET: string;
  SENTRY_CLIENT_ID: string;
  SENTRY_CLIENT_SECRET: string;
  NOTIFICATION_WEBHOOK_URL: string;
  // endregion
};

const TIME_ZONE = 'Asia/Tokyo';

const TRIGGERS: readonly Trigger[] = [
  { hour: 16, temp: 38 },
  { hour: 17, temp: 35 },
  { hour: 18, temp: 33 },
];

/**
 * 与えられた日付において、本プログラムによってエアコンがつけられたかどうかを返す
 * @param date 確認したい日付
 * @param kv Cloudflare KVのインスタンス
 * @returns 与えられた日付において、本プログラムによってエアコンがつけられたかどうか
 */
const isAlreadyTurnedOnToday = async (date: string, kv: KVNamespace) => kv.get(date).then((v) => !!v);

type Handler = ExportedHandler<Env>;

// See: https://github.com/cloudflare/worker-sentry/blob/main/index.mjs
const initSentry = (sentryDsn: string, sentryClientId: string, sentryClientSecret: string, context: ExecutionContext) =>
  new Toucan({
    dsn: sentryDsn,
    context,
    requestDataOptions: {
      allowedHeaders: [
        'user-agent',
        'cf-challenge',
        'accept-encoding',
        'accept-language',
        'cf-ray',
        'content-length',
        'content-type',
        'x-real-ip',
        'host',
      ],
      allowedSearchParams: /(.*)/,
    },
    transportOptions: {
      headers: {
        'CF-Access-Client-ID': sentryClientId,
        'CF-Access-Client-Secret': sentryClientSecret,
      },
    },
    sampleRate: 0.25,
  });

const scheduled: Handler['scheduled'] = async (cont, env, context) => {
  const sentry = initSentry(env.SENTRY_DSN, env.SENTRY_CLIENT_ID, env.SENTRY_CLIENT_SECRET, context);

  try {
    const now = utcToZonedTime(new Date(), TIME_ZONE);
    if (isWeekend(now.getDay()) || isHoliday(now)) return;
    if (isBannedHour(now.getHours())) return;
    const formattedDate = formatDate(now);
    if (await isAlreadyTurnedOnToday(formattedDate, env.TURN_ON_AIR_CON_HISTORY)) return;

    const triggerTemps = [...new Set(filterValidTrigger(TRIGGERS, now.getHours()).map((t) => t.temp))];
    if (triggerTemps.length === 0) return;

    const client = new SwitchBotClient(env.SWITCHBOT_TOKEN, env.SWITCHBOT_CLIENT_SECRET);
    const actualTemp = await client.getMeterStatus(env.METER_DEVICE_ID).then((stat) => stat.temperature);
    const isTempHigherThanTriggers = !!triggerTemps.find((triggerTemp) => actualTemp >= triggerTemp);
    if (!isTempHigherThanTriggers) return;

    context.waitUntil(client.turnOnAirConditioner(env.AIR_CONDITIONER_DEVICE_ID, 28));
    // 1日でKVに書き込んだものを削除
    context.waitUntil(env.TURN_ON_AIR_CON_HISTORY.put(formattedDate, 'done!', { expirationTtl: 60 * 60 * 24 }));
    context.waitUntil(notifyAirConditionerOnToDiscord(env.NOTIFICATION_WEBHOOK_URL, now, actualTemp));
  } catch (e: unknown) {
    if (e instanceof Error && env.NODE_ENV === 'production') {
      sentry.captureException(e);
    }
  }
};

const app: Handler = {
  scheduled,
};

export default app;
