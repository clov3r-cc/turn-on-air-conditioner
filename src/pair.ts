export type Trigger = {
  hour: number;
  temp: number;
};

export const filterValidTrigger = (source: readonly Trigger[], nowHour: number) => {
  // TODO: #toSortedを使いたいが未実装のようなので、破壊的メソッドである#sortを使うため、スプレッド構文で別の配列を作成
  const copiedSource = [...source];
  // 時刻が同じならば気温の高い方を先に並べ、そうでなければ時刻が早い方を先に並べる
  copiedSource.sort((a, b) => (a.hour === b.hour ? b.temp - a.temp : a.hour - b.hour));
  // 時刻が等しい組を排除する。すでに時刻でソートしてあるので、後に並んでいる気温の低い方の組だけが残る
  const pairs = Array.from(new Map(copiedSource.map((pair) => [pair.hour, pair])).values());

  // 現在時刻が基準時間を超えているものだけを抽出
  return pairs.filter((pair) => nowHour >= pair.hour);
};
