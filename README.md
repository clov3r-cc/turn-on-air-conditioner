# turn-on-air-conditioner

一定時間ごとに室内の気温を確認して、設定した値を超えた室温になっている場合に1日1回エアコンをつけるプログラムです。

## 仕様詳細

- 初期状態として、プログラムは15分ごとに実行される（[wrangler.toml](./wrangler.toml)の`triggers.cron`を変更することで変更可能）
- 日本の週末または祝日には実行されない
- 当日にすでに本プログラムによってエアコンがONになっている場合はその日はもう実行されない
- プログラム内にハードコードされた基準値に従って、設定された時刻にすでに設定された室温を上回っている場合はエアコンをつける
  - 例えば、16時時点で35℃を基準としている場合に、17時にプログラムが作動し室温が37℃であればエアコンをつけるし、30℃であればつけない
  - 同じ時刻に別々の気温設定がされている場合は、低いほうが基準となる
    - 例えば、16時時点で30℃と35℃の設定があった場合は、前者を室温が超えているかという判定をする
  - 室温は夜に近づくにつれて下がっていくことを前提としているため、「後続の時刻のほうが高い室温を基準としているといった以下の設定のとき、例えば確認時刻が17時で室温が30℃だった場合は正常に動作しない。（ #11 で修正予定 ）
    - 正確に説明すれば、現在時刻を過ぎているもののうち、設定時刻が一番早いものでのみ判定を行うので、以下の例の場合は`{ hour: 16, temp: 32 }`のみ判定対象とし続けることになる

```typescript
const TRIGGERS: readonly Trigger[] = [
  { hour: 16, temp: 32 },
  { hour: 17, temp: 35 },
  { hour: 18, temp: 33 },
];
```

## 実行に必要なもの

- SwitchBot ハブ（ハブミニでも可）
- SwitchBot 温湿度計（温湿度計プラスでも可）
- Cloudflareアカウント（Free Planで可）

## 実行準備と手順

1. SwitchBotの設定を済ませ、ハブとエアコンを連携する
1. [SwitchBotのアプリをスマートフォンにインストールして、APIトークンとクライアントシークレットの値を控える](https://github.com/OpenWonderLabs/SwitchBotAPI#getting-started)
1. [.dev.vars.example](./.dev.vars.example)を`.dev.vars`に改名して、先程取得したSwitchBotのAPIトークンとクライアントシークレットを入力する
1. wranglerをインストール
`npm install -g wrangler@2`
1. Cloudflareにwranglerからログインする
`wrangler login`
1. `wrangler whoami`を実行して表示されるCloudflareのアカウントIDを[wrangler.toml](./wrangler.toml)の`account_id`に入力する
1. Cloudflare KVにnamespaceを作成
`wrangler kv:namespace create "TURN_ON_AIR_CON_HISTORY"`
1. Cloudflare KVにnamespaceを作成（デバッグ用なのでなくてもよい）
`wrangler kv:namespace create --preview "TURN_ON_AIR_CON_HISTORY"`
1. デバイスの一覧から温湿度計（`Meter`）とエアコン（`Air Conditioner`）の`deviceId`を探し、[wrangler.toml](./wrangler.toml)の`METER_DEVICE_ID`と`AIR_CONDITIONER_DEVICE_ID`にそれぞれ入力する
1. [worker.ts](./src/worker.ts)の中にある`TRIGGERS`の値を好きなように変更する
1. `npm run deploy`で、Cloudflare上にデプロイされる

※ デバイスの一覧表示のコマンドと結果例は以下のような感じ（[yq](https://github.com/mikefarah/yq)によって結果は整形済み）
`curl -X GET "https://api.switch-bot.com/v1.0/devices" -H "Authorization: <your token>"`

```yaml
statusCode: 100
body:
  deviceList:
    - deviceId: DC49091D8404
      deviceName: 温湿度計
      deviceType: MeterPlus
      enableCloudService: true
      hubDeviceId: DEDF729CD1E4
  infraredRemoteList:
    - deviceId: 02-202306140644-28427602
      deviceName: エアコン
      remoteType: Air Conditioner
      hubDeviceId: DEDF729CD1E4
message: success
```
