import { describe, expect, it } from 'vitest';
import { filterValidTrigger, type Trigger } from './pair';

const TRIGGERS: readonly Trigger[] = [
  { hour: 16, temp: 38 },
  { hour: 17, temp: 35 },
  { hour: 18, temp: 33 },
];

describe('filterValidTrigger', () => {
  it('should return an empty array when no given triggers', () => {
    expect(filterValidTrigger([], 0)).toEqual([]);
  });

  it('should return an empty array when no matches', () => {
    expect(filterValidTrigger(TRIGGERS, 0)).toEqual([]);
  });

  it.each([16, 17, 18, 19])('should return all matched pairs when now hour is %i', (now) => {
    const expected = TRIGGERS.filter((p) => now >= p.hour);
    expect(filterValidTrigger(TRIGGERS, now)).toEqual(expected);
  });

  it('should return all matched pairs which contains each pair whose temp is lower, when given an array which has a duplicated hour element', () => {
    const HOUR = 17;

    const lowerTempPair = TRIGGERS.find((p) => p.hour === HOUR);
    expect(lowerTempPair).toBeDefined();

    const higherTempPair = { ...lowerTempPair! };
    higherTempPair.temp = 100;
    expect(higherTempPair.temp).not.toBe(lowerTempPair!.temp);

    const map: readonly Trigger[] = [...TRIGGERS, higherTempPair];
    expect(filterValidTrigger(map, HOUR)).toContain(lowerTempPair);
    expect(filterValidTrigger(map, HOUR)).not.toContain(higherTempPair);
  });
});
