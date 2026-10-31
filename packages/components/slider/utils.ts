import type { SliderMark, SliderSegment, SliderValue } from './slider-props';

export interface SliderRange {
	start: number;
	end: number;
	step: number;
	// 段起止在整条轨道上的比例（0–1）
	startOffset: number;
	endOffset: number;
}

export interface SliderValueOptions {
	min: number;
	max: number;
	range: boolean;
}

export interface SliderRangeOptions {
	min: number;
	max: number;
	// 未在段里单独设置时的步长
	step: number;
	segments?: SliderSegment[];
}

export interface SliderSnapOptions {
	ranges: SliderRange[];
	// null：只能落在 marks 上
	step: number | null;
	// 升序的标签值
	marks: number[];
}

export interface SliderMarkItem {
	value: number;
	label?: string | number;
	class?: any;
	style?: any;
}

export const clamp = (value: number, min: number, max: number) => {
	if (Number.isNaN(value)) return min;
	return Math.min(max, Math.max(min, value));
};

export const getDecimalLength = (value: number) => {
	return (String(value).split('.')[1] || '').length;
};

const toFixed = (value: number, decimals: number) => Number(value.toFixed(decimals));

/**
 * 段宽：0–1 的数值或百分比字符串，其他值视为未设置
 * @param value ~
 * @returns 0–1 的比例
 */
export const toRate = (value?: number | string) => {
	const rate = typeof value === 'string' && value.trim().endsWith('%')
		? parseFloat(value) / 100
		: Number(value);

	return value !== undefined && value !== '' && rate >= 0 && rate <= 1 ? rate : undefined;
};

/**
 * 范围模式为长度至少 2 的升序数组，单值模式只取一个值；都会夹到 [min, max]
 * @param value ~
 * @param options ~
 * @returns 内部使用的值
 */
export const normalizeValue = (value: SliderValue, options: SliderValueOptions): number[] => {
	const { min, max, range } = options;
	const source = (Array.isArray(value) ? value : [value]).map(item => clamp(Number(item), min, max));

	if (!range) return [source[0] ?? min];
	if (!source.length) return [min, min];
	if (source.length === 1) return [source[0], source[0]];

	return source.sort((a, b) => a - b);
};

/**
 * 按断点切分轨道：给了 width 的段先分宽度，剩余宽度按值域长度分给其余段
 * @param options ~
 * @returns 首尾相接、覆盖 [min, max] 的段
 */
export const getRanges = (options: SliderRangeOptions): SliderRange[] => {
	const { min, max, step } = options;
	if (max <= min) return [{ start: min, end: min, step, startOffset: 0, endOffset: 1 }];

	const items: Array<Omit<SliderRange, 'startOffset' | 'endOffset'> & { width?: number }> = [];
	const segments = [...(options.segments || [])].sort((a, b) => a.end - b.end);
	let start = min;

	for (const segment of segments) {
		if (start >= max) break;
		if (!(segment.end > start)) continue;

		const end = Math.min(segment.end, max);
		items.push({
			start,
			end,
			step: Math.abs(segment.step || 0) || step,
			width: toRate(segment.width)
		});
		start = end;
	}

	start < max && items.push({ start, end: max, step });

	let remainWidth = 1;
	let remainLength = 0;
	items.forEach((item) => {
		if (item.width === undefined) {
			remainLength += item.end - item.start;
		} else {
			item.width = Math.min(item.width, remainWidth);
			remainWidth -= item.width;
		}
	});

	// 每段都给了宽度但总和不足 1：余量给最后一段
	if (!remainLength) items[items.length - 1].width! += remainWidth;

	let offset = 0;
	return items.map(({ width, ...item }) => {
		const size = width ?? (remainWidth * (item.end - item.start)) / remainLength;
		const range = { ...item, startOffset: offset, endOffset: Math.min(1, offset + size) };

		offset = range.endOffset;
		return range;
	});
};

/**
 * 值 → 轨道比例
 * @param value ~
 * @param ranges ~
 * @returns 0–1
 */
export const toOffset = (value: number, ranges: SliderRange[]) => {
	const range = ranges.find(item => value <= item.end) || ranges[ranges.length - 1];
	if (value <= range.start || range.end === range.start) return range.startOffset;
	if (value >= range.end) return range.endOffset;

	return range.startOffset + ((value - range.start) / (range.end - range.start)) * (range.endOffset - range.startOffset);
};

/**
 * 轨道比例 → 值（未对齐）
 * @param offset ~
 * @param ranges ~
 * @returns ~
 */
export const toValue = (offset: number, ranges: SliderRange[]) => {
	const ratio = clamp(offset, 0, 1);
	const range = ranges.find(item => ratio <= item.endOffset && item.endOffset > item.startOffset) || ranges[ranges.length - 1];
	const size = range.endOffset - range.startOffset;
	if (!size) return range.start;

	return range.start + ((ratio - range.startOffset) / size) * (range.end - range.start);
};

/**
 * 对齐到最近的合法值：step 为 null 时取最近的标签值，否则取所在段内最近的步长点或段终点
 * @param value ~
 * @param options ~
 * @returns ~
 */
export const snap = (value: number, options: SliderSnapOptions) => {
	const { ranges, step, marks } = options;
	const min = ranges[0].start;
	const max = ranges[ranges.length - 1].end;
	const current = clamp(value, min, max);

	if (step === null) {
		const candidates = marks.length ? marks : [min, max];
		return candidates.reduce((pre, item) => (Math.abs(item - current) < Math.abs(pre - current) ? item : pre));
	}

	const range = ranges.find(item => current <= item.end) || ranges[ranges.length - 1];
	const decimals = Math.max(getDecimalLength(range.start), getDecimalLength(range.step));
	const nearest = toFixed(range.start + Math.round((current - range.start) / range.step) * range.step, decimals);
	const result = Math.min(nearest, range.end);

	// 段长不是步长整数倍时，段终点也可选
	return Math.abs(range.end - current) < Math.abs(result - current) ? range.end : result;
};

/**
 * 刻度值：每段内的步长点与段的断点，不含两端；step 为 null 时为标签值
 * @param options ~
 * @returns 升序
 */
export const getTickValues = (options: SliderSnapOptions) => {
	const { ranges, step, marks } = options;
	const min = ranges[0].start;
	const max = ranges[ranges.length - 1].end;

	if (step === null) return marks.filter(item => item > min && item < max);

	const result: number[] = [];
	ranges.forEach((range) => {
		const decimals = Math.max(getDecimalLength(range.start), getDecimalLength(range.step));
		const count = Math.ceil((range.end - range.start) / range.step);

		for (let i = 0; i < count; i++) {
			const value = toFixed(range.start + i * range.step, decimals);
			value > min && value < range.end && result.push(value);
		}

		range.end < max && result.push(range.end);
	});

	return [...new Set(result)].sort((a, b) => a - b);
};

/**
 * 标签：只保留 [min, max] 内的，按值升序
 * @param marks ~
 * @param min ~
 * @param max ~
 * @returns ~
 */
export const getMarks = (marks: Record<number, SliderMark> | undefined, min: number, max: number): SliderMarkItem[] => {
	if (!marks) return [];

	return Object.keys(marks)
		.map(key => ({ key, value: Number(key) }))
		.filter(({ value }) => !Number.isNaN(value) && value >= min && value <= max)
		.sort((a, b) => a.value - b.value)
		.map(({ key, value }) => {
			const mark = marks[key];
			return mark !== null && typeof mark === 'object'
				? { ...mark, value }
				: { value, label: mark };
		});
};

/**
 * 键盘移动一步：step 为 null 时跳到相邻标签，否则跳到所在段的相邻步长点或段边界
 * @param value 当前值
 * @param direction 1 增大，-1 减小
 * @param options ~
 * @returns 不越过 [min, max]
 */
export const stepValue = (value: number, direction: 1 | -1, options: SliderSnapOptions) => {
	const { ranges, step, marks } = options;
	const min = ranges[0].start;
	const max = ranges[ranges.length - 1].end;

	if (step === null) {
		const candidates = marks.length ? marks : [min, max];
		const next = direction > 0
			? candidates.find(item => item > value)
			: [...candidates].reverse().find(item => item < value);
		return next ?? value;
	}

	// 浮点误差容差，避免 0.3 / 0.1 这类计算停在原地
	const epsilon = 1e-9;
	if (direction > 0) {
		const range = ranges.find(item => value < item.end);
		if (!range) return max;

		const decimals = Math.max(getDecimalLength(range.start), getDecimalLength(range.step));
		const index = Math.floor((value - range.start) / range.step + epsilon) + 1;
		return Math.min(toFixed(range.start + index * range.step, decimals), range.end);
	}

	const range = [...ranges].reverse().find(item => value > item.start);
	if (!range) return min;

	const decimals = Math.max(getDecimalLength(range.start), getDecimalLength(range.step));
	const index = Math.ceil((value - range.start) / range.step - epsilon) - 1;
	return Math.max(toFixed(range.start + index * range.step, decimals), range.start);
};
