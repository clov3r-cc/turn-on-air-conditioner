import { formatDateTimeWithTz } from './date';
import { HttpError } from './error';

export const notifyAirConditionerOnToDiscord = async (webhookUrl: string, now: Date, currentTemp: number) => {
  const body = {
    embeds: [
      {
        title: 'エアコンをONにしました',
        description: '室温が指定の気温を上回ったことを確認したため、エアコンをONにしました。',
        timestamp: formatDateTimeWithTz(now),
        color: 5620992,
        fields: [{ name: '現在の気温', value: `${currentTemp}℃`, inline: true }],
      },
    ],
  };

  const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText, 'POST request');
  }
};
