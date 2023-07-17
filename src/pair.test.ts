import { assert, describe, expect, it } from 'vitest';
import { findValidTrigger, type Trigger } from './pair';

const TRIGGERS: readonly Trigger[] = [
	{ hour: 16, temp: 38 },
	{ hour: 17, temp: 35 },
	{ hour: 18, temp: 33 },
];

describe('findValidTrigger', () => {
	it('should return a falsy value when given an empty array', () => {
		expect(findValidTrigger([], 0)).toBeUndefined();
	});

	it('should return a falsy value when no matches', () => {
		expect(findValidTrigger(TRIGGERS, 0)).toBeUndefined();
	});

	it.each([16, 17, 18, 19])('should return the earliest pair when now hour is %i', (now) => {
		const HOUR = 16;
		const expected = TRIGGERS.find((p) => p.hour === HOUR);
		expect(expected).toBeDefined();
		expect(findValidTrigger(TRIGGERS, now)).toBe(expected);
	});

	it('should return a pair which has lower temp when given an array which has a duplicated hour element', () => {
		const HOUR = 16;

		const expected = TRIGGERS.find((p) => p.hour === HOUR);
		expect(expected).toBeDefined();

		const e = { ...expected!! };
		e.temp = 100;
		expect(e.temp).not.toBe(expected!!.temp);

		const map: readonly Trigger[] = [...TRIGGERS, e];
		expect(findValidTrigger(map, HOUR)).toBe(expected);
	});
});
