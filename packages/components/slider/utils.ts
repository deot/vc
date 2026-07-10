import type { SliderValue } from './slider-props';

export interface SliderLimits {
	min: number;
	max: number;
}

export const clamp = (value: number, min: number, max: number) => {
	if (Number.isNaN(value)) return min;
	return Math.min(max, Math.max(min, value));
};

export const checkLimits = (value: SliderValue, options: SliderLimits): [number, number] => {
	const source = Array.isArray(value)
		? value
		: [value, value];
	const min = clamp(Number(source[0]), options.min, options.max);
	const max = clamp(Math.max(min, Number(source[1])), options.min, options.max);

	return [min, max];
};

export const getPointerX = (e: MouseEvent | TouchEvent) => {
	if (e.type.includes('touch')) {
		const touch = (e as TouchEvent).touches?.[0] || (e as TouchEvent).changedTouches?.[0];
		return touch?.clientX || 0;
	}

	return (e as MouseEvent).clientX;
};

export const getOffset = (position: number, step: number) => {
	const stepValue = Math.abs(step) || 1;
	let offset = position % stepValue;

	if (stepValue < 1) {
		const decimalLength = (String(stepValue).split('.')[1] || '').length;
		const multiple = 10 ** decimalLength;

		offset = ((position * multiple) % (stepValue * multiple)) / multiple;
	}

	return offset;
};

export const getDecimalLength = (value: number) => {
	return (String(value).split('.')[1] || '').length;
};
