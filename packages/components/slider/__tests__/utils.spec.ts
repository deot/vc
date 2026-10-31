import { clamp, getMarks, getRanges, getTickValues, normalizeValue, snap, stepValue, toOffset, toRate, toValue } from '../utils';

describe('utils.ts', () => {
	it('clamp / toRate', () => {
		expect(clamp(Number.NaN, 1, 5)).toBe(1);
		expect(toRate('50%')).toBe(0.5);
		expect(toRate(0.3)).toBe(0.3);
		expect(toRate(30)).toBeUndefined();
		expect(toRate('')).toBeUndefined();
		expect(toRate(undefined)).toBeUndefined();
	});

	it('normalizeValue: 排序、夹紧并补齐范围值', () => {
		const options = { min: 0, max: 10, range: true };

		expect(normalizeValue([8, 3], options)).toEqual([3, 8]);
		expect(normalizeValue([12, -1, 5], options)).toEqual([0, 5, 10]);
		expect(normalizeValue(4, options)).toEqual([4, 4]);
		expect(normalizeValue([], options)).toEqual([0, 0]);
		expect(normalizeValue([6, 2], { ...options, range: false })).toEqual([6]);
	});

	it('getRanges: 先分配给定宽度，剩余按值域长度分', () => {
		const ranges = getRanges({
			min: 0,
			max: 100,
			step: 1,
			segments: [{ end: 60, step: 5 }, { end: 10, width: 0.5 }]
		});

		expect(ranges).toEqual([
			{ start: 0, end: 10, step: 1, startOffset: 0, endOffset: 0.5 },
			{ start: 10, end: 60, step: 5, startOffset: 0.5, endOffset: 0.5 + 0.5 * (50 / 90) },
			{ start: 60, end: 100, step: 1, startOffset: 0.5 + 0.5 * (50 / 90), endOffset: 1 }
		]);
	});

	it('getRanges: 宽度都给了时余量补给最后一段，超出部分截断，越界的段忽略', () => {
		const filled = getRanges({
			min: 0,
			max: 10,
			step: 1,
			segments: [{ end: 5, width: '20%' }, { end: 10, width: '30%' }]
		});
		expect(filled.map(item => item.endOffset)).toEqual([0.2, 1]);

		const overflow = getRanges({
			min: 0,
			max: 10,
			step: 1,
			segments: [{ end: -5 }, { end: 5, width: 0.8 }, { end: 20, width: 0.8 }]
		});
		expect(overflow.map(item => [item.start, item.end, item.endOffset])).toEqual([[0, 5, 0.8], [5, 10, 1]]);

		expect(getRanges({ min: 5, max: 5, step: 1 })).toEqual([{ start: 5, end: 5, step: 1, startOffset: 0, endOffset: 1 }]);
	});

	it('toOffset / toValue: 互为逆运算', () => {
		const ranges = getRanges({ min: 0, max: 50, step: 1, segments: [{ end: 10, width: '50%' }] });

		expect(toOffset(5, ranges)).toBe(0.25);
		expect(toOffset(30, ranges)).toBe(0.75);
		expect(toOffset(-1, ranges)).toBe(0);
		expect(toOffset(60, ranges)).toBe(1);
		expect(toValue(0.25, ranges)).toBe(5);
		expect(toValue(0.75, ranges)).toBe(30);
		expect(toValue(2, ranges)).toBe(50);
	});

	it('snap: 最近步长点、段终点、小数精度与 marks', () => {
		const ranges = getRanges({ min: 0, max: 10, step: 3 });
		const options = { ranges, step: 3, marks: [] };

		expect(snap(4.4, options)).toBe(3);
		expect(snap(4.6, options)).toBe(6);
		// 9 与 10 之间更靠近终点
		expect(snap(9.6, options)).toBe(10);
		expect(snap(20, options)).toBe(10);

		const decimal = getRanges({ min: 0, max: 1, step: 0.1 });
		expect(snap(0.34, { ranges: decimal, step: 0.1, marks: [] })).toBe(0.3);
		expect(snap(0.75, { ranges: decimal, step: 0.1, marks: [] })).toBe(0.8);

		expect(snap(40, { ranges, step: null, marks: [0, 3, 8] })).toBe(8);
		expect(snap(1.4, { ranges, step: null, marks: [0, 3, 8] })).toBe(0);
		expect(snap(6, { ranges, step: null, marks: [] })).toBe(10);
	});

	it('getTickValues: 不含两端，包含段断点', () => {
		const ranges = getRanges({ min: 0, max: 10, step: 1, segments: [{ end: 4, step: 2 }] });

		expect(getTickValues({ ranges, step: 1, marks: [] })).toEqual([2, 4, 5, 6, 7, 8, 9]);
		expect(getTickValues({ ranges, step: null, marks: [0, 3, 10] })).toEqual([3]);
		expect(getTickValues({ ranges: getRanges({ min: 0, max: 0.3, step: 0.1 }), step: 0.1, marks: [] })).toEqual([0.1, 0.2]);
	});

	it('getMarks: 过滤越界、排序并展开对象', () => {
		expect(getMarks({ 50: 'B', 0: 'A', 120: 'C', 20: { label: 'D', class: 'x' } }, 0, 100)).toEqual([
			{ value: 0, label: 'A' },
			{ value: 20, label: 'D', class: 'x' },
			{ value: 50, label: 'B' }
		]);
		expect(getMarks(undefined, 0, 100)).toEqual([]);
	});

	it('stepValue: 段内步长、段边界、小数与标签', () => {
		const ranges = getRanges({ min: 0, max: 50, step: 1, segments: [{ end: 10 }, { end: 50, step: 8 }] });
		const options = { ranges, step: 1, marks: [] };

		expect(stepValue(9, 1, options)).toBe(10);
		expect(stepValue(10, 1, options)).toBe(18);
		expect(stepValue(13, 1, options)).toBe(18);
		expect(stepValue(42, 1, options)).toBe(50);
		expect(stepValue(50, 1, options)).toBe(50);
		expect(stepValue(18, -1, options)).toBe(10);
		expect(stepValue(13, -1, options)).toBe(10);
		expect(stepValue(10, -1, options)).toBe(9);
		expect(stepValue(9.5, -1, options)).toBe(9);
		expect(stepValue(0, -1, options)).toBe(0);

		const decimal = { ranges: getRanges({ min: 0, max: 1, step: 0.1 }), step: 0.1, marks: [] };
		expect(stepValue(0.3, 1, decimal)).toBe(0.4);
		expect(stepValue(0.3, -1, decimal)).toBe(0.2);

		const marks = { ranges, step: null, marks: [0, 20, 40] };
		expect(stepValue(20, 1, marks)).toBe(40);
		expect(stepValue(40, 1, marks)).toBe(40);
		expect(stepValue(25, -1, marks)).toBe(20);
		expect(stepValue(30, 1, { ranges, step: null, marks: [] })).toBe(50);
	});
});
