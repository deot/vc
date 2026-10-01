import { Utils } from '@deot/vc-shared';

describe('utils.ts', () => {
	it('autoCatch', () => {
		const OUTPUT = new Error();
		Utils.autoCatch(() => {
			return Promise.reject(OUTPUT);
		}, {
			onError: (e: any) => {
				expect(e).toBe(OUTPUT);
			}
		});

		Utils.autoCatch(() => {
			expect(OUTPUT).toBe(OUTPUT);
		});
	});

	it('bisectFirst: 首个满足条件的下标，无匹配返回 length', () => {
		const list = [1, 3, 5, 7, 9];
		expect(Utils.bisectFirst(list.length, i => list[i] >= 5)).toBe(2);
		expect(Utils.bisectFirst(list.length, i => list[i] >= 0)).toBe(0);
		expect(Utils.bisectFirst(list.length, i => list[i] > 9)).toBe(5);
		expect(Utils.bisectFirst(0, () => true)).toBe(0);
	});

	it('bisectLast: 最后一个满足条件的下标，无匹配返回 -1', () => {
		const list = [1, 3, 5, 7, 9];
		expect(Utils.bisectLast(list.length, i => list[i] <= 5)).toBe(2);
		expect(Utils.bisectLast(list.length, i => list[i] <= 9)).toBe(4);
		expect(Utils.bisectLast(list.length, i => list[i] < 1)).toBe(-1);
		expect(Utils.bisectLast(0, () => true)).toBe(-1);
	});
});
