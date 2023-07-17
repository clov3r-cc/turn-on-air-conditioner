import { utcToZonedTime } from 'date-fns-tz';
import { isHoliday } from '@holiday-jp/holiday_jp';
import { formatDate, isBannedHour, isWeekend } from './date';
import { type Trigger, findValidTrigger } from './pair';
import { SwitchBotClient } from './switchbot';

export type Env = {
  TURN_ON_AIR_CON_HISTORY: KVNamespace;

  SWITCHBOT_TOKEN: string;
  SWITCHBOT_CLIENT_SECRET: string;
  METER_DEVICE_ID: string;
  AIR_CONDITIONER_DEVICE_ID: string;
};

const TIME_ZONE = 'Asia/Tokyo';

const TRIGGERS: readonly Trigger[] = [
  { hour: 16, temp: 38 },
  { hour: 17, temp: 35 },
  { hour: 18, temp: 33 },
];

const isAlreadyTurnedOnToday = async (date: string, kv: KVNamespace) => kv.get(date).then((v) => !!v);

const worker: ExportedHandler<Env> = {
  async scheduled(_cont, env) {
    const zoned = utcToZonedTime(new Date(), TIME_ZONE);
    if (isWeekend(zoned.getDay()) || isHoliday(zoned)) return;
    if (isBannedHour(zoned.getHours())) return;
    const formattedDate = formatDate(zoned);
    if (await isAlreadyTurnedOnToday(formattedDate, env.TURN_ON_AIR_CON_HISTORY)) return;

    const triggerTemp = findValidTrigger(TRIGGERS, zoned.getHours())?.temp;
    if (!triggerTemp) return;

    const client = new SwitchBotClient(env.SWITCHBOT_TOKEN, env.SWITCHBOT_CLIENT_SECRET);
    const actualTemp = await client.getMeterStatus(env.METER_DEVICE_ID).then((stat) => stat.temperature);
    if (actualTemp < triggerTemp) return;

    await client.turnOnAirConditioner(env.AIR_CONDITIONER_DEVICE_ID, 28);
    env.TURN_ON_AIR_CON_HISTORY.put(formattedDate, 'done!');
  },
};

export default worker;
