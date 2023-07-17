import { encode } from 'base64-arraybuffer';
import { Buffer } from 'node:buffer';
import { type AirConditionerCommand, meterStatus, controlCommandResponse } from './zodSchema';
import { HttpError } from './error';

export class SwitchBotClient {
  private readonly url = 'https://api.switch-bot.com/v1.1/devices';

  private readonly token: string;

  private readonly secret: string;

  constructor(token: string, secret: string) {
    this.token = token;
    this.secret = secret;
  }

  getMeterStatus = async (deviceId: string) => {
    const path = `${deviceId}/status`;

    return this.getRequest(path)
      .then(async (res) => res.json())
      .then((data) => meterStatus.parse(data));
  };

  turnOnAirConditioner = async (deviceId: string, settingTemp: number) => {
    const path = `${deviceId}/commands`;
    const data: AirConditionerCommand = {
      commandType: 'command',
      command: 'setAll',
      // 運転モード: 1(自動)
      // 風量: 1(自動)
      parameter: `${settingTemp},1,1,on`,
    };

    return this.postRequest(path, data)
      .then(async (res) => res.json())
      .then((json) => controlCommandResponse.parse(json));
  };

  private generateSign = async (t: number, nonce: string) => {
    const data = `${this.token}${t}${nonce}`;
    const secretKeyData = new TextEncoder().encode(this.secret);
    const key = await crypto.subtle.importKey('raw', secretKeyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signTerm = await crypto.subtle.sign('HMAC', key, Buffer.from(data, 'utf-8'));

    return encode(signTerm);
  };

  private generateAuthorizationHeader = async () => {
    const t = Date.now();
    const nonce = crypto.randomUUID();
    const sign = await this.generateSign(t, nonce);

    return {
      Authorization: this.token,
      sign,
      nonce,
      t: t.toString(),
    };
  };

  private getRequest = async (path?: string) => {
    const authHeader = await this.generateAuthorizationHeader();
    const response = await fetch(`${this.url}/${path ?? ''}`, {
      method: 'GET',
      headers: { ...authHeader },
    });
    if (!response.ok) throw new HttpError(response.status, response.statusText, 'GET request');

    return response;
  };

  private postRequest = async (path: string, data: unknown) => {
    const authHeader = await this.generateAuthorizationHeader();
    const response = await fetch(`${this.url}/${path}`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new HttpError(response.status, response.statusText, 'POST request');

    return response;
  };
}
