export type Trigger = {
  hour: number;
  temp: number;
};

export const findValidTrigger = (source: readonly Trigger[], hour: number) => {
  // TODO: #toSortedを使いたいが未実装のよう
  const pairs = [...source];
  // 時刻が同じならば気温の低い方を先に判定し、そうでなければ時刻が早い方から判定していく
  pairs.sort((a, b) => (a.hour === b.hour ? a.temp - b.temp : a.hour - b.hour));

  return pairs.find((pair) => hour >= pair.hour);
};
