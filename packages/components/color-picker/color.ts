import { computed, reactive } from 'vue';

export type ColorFormat = 'hsl' | 'hsv' | 'hex' | 'rgb';
type ColorChannel = 'hue' | 'saturation' | 'value' | 'alpha';

export interface ColorOptions {
	enableAlpha?: boolean;
	format?: ColorFormat;
	value?: string;
}

type ColorOptionStates = Pick<ColorOptions, 'enableAlpha' | 'format'>;

export interface RGB {
	r: number;
	g: number;
	b: number;
}

const hsv2hsl = (hue: number, sat: number, val: number) => {
	const light = (2 - sat) * val;
	const saturation = (sat * val / (light < 1 ? light : 2 - light)) || 0;

	return [
		hue,
		saturation,
		light / 2
	];
};

const isOnePointZero = (value: unknown) => {
	return typeof value === 'string' && value.includes('.') && parseFloat(value) === 1;
};

const isPercentage = (value: unknown) => {
	return typeof value === 'string' && value.includes('%');
};

const bound01 = (source: number | string, max: number) => {
	let value = source;

	if (isOnePointZero(value)) value = '100%';

	const processPercent = isPercentage(value);
	let parsed = Math.min(max, Math.max(0, parseFloat(`${value}`)));

	if (Number.isNaN(parsed)) {
		parsed = 0;
	}

	if (processPercent) {
		parsed = parseInt(`${parsed * max}`, 10) / 100;
	}

	if (Math.abs(parsed - max) < 0.000001) {
		return 1;
	}

	return (parsed % max) / parseFloat(`${max}`);
};

const INT_HEX_MAP: Record<number, string> = {
	10: 'A',
	11: 'B',
	12: 'C',
	13: 'D',
	14: 'E',
	15: 'F'
};

const HEX_INT_MAP: Record<string, number> = {
	A: 10,
	B: 11,
	C: 12,
	D: 13,
	E: 14,
	F: 15
};

const parseHexDigit = (value: string) => {
	return HEX_INT_MAP[value.toUpperCase()] ?? Number(value);
};

const parseHexChannel = (hex: string) => {
	if (hex.length === 1) {
		return parseHexDigit(hex) * 17;
	}

	return parseHexDigit(hex[0]) * 16 + parseHexDigit(hex[1]);
};

const toHex = ({ r, g, b }: RGB) => {
	const hexOne = (value: number) => {
		const normalized = Math.min(Math.round(value), 255);
		const high = Math.floor(normalized / 16);
		const low = normalized % 16;

		return `${INT_HEX_MAP[high] || high}${INT_HEX_MAP[low] || low}`;
	};

	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '';

	return `#${hexOne(r)}${hexOne(g)}${hexOne(b)}`;
};

const hsl2hsv = (hue: number, sat: number, light: number) => {
	let saturation = sat / 100;
	let normalizedLight = light / 100;
	let smin = saturation;
	const lmin = Math.max(normalizedLight, 0.01);

	normalizedLight *= 2;
	saturation *= (normalizedLight <= 1) ? normalizedLight : 2 - normalizedLight;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	const v = (normalizedLight + saturation) / 2;
	const sv = normalizedLight === 0
		? (2 * smin) / (lmin + smin)
		: (2 * saturation) / (normalizedLight + saturation);

	return {
		h: hue,
		s: sv * 100,
		v: v * 100
	};
};

const rgb2hsv = (r: number | string, g: number | string, b: number | string) => {
	const red = bound01(r, 255);
	const green = bound01(g, 255);
	const blue = bound01(b, 255);

	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const delta = max - min;
	let h = 0;
	const s = max === 0 ? 0 : delta / max;

	if (max !== min) {
		switch (max) {
			case red:
				h = (green - blue) / delta + (green < blue ? 6 : 0);
				break;
			case green:
				h = (blue - red) / delta + 2;
				break;
			case blue:
				h = (red - green) / delta + 4;
				break;
			default:
				break;
		}
		h /= 6;
	}

	return {
		h: h * 360,
		s: s * 100,
		v: max * 100
	};
};

const hsv2rgb = (h: number | string, s: number | string, v: number | string): RGB => {
	const hue = bound01(h, 360) * 6;
	const saturation = bound01(s, 100);
	const value = bound01(v, 100);

	const i = Math.floor(hue);
	const f = hue - i;
	const p = value * (1 - saturation);
	const q = value * (1 - f * saturation);
	const t = value * (1 - (1 - f) * saturation);
	const mod = i % 6;
	const r = [value, q, p, p, t, value][mod];
	const g = [t, value, value, q, p, p][mod];
	const b = [p, p, t, value, value, q][mod];

	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
};

const parseFunctionalColor = (value: string, name: 'hsl' | 'hsv' | 'rgb') => {
	const matcher = name === 'hsl'
		? /hsla|hsl|\(|\)/gm
		: name === 'hsv'
			? /hsva|hsv|\(|\)/gm
			: /rgba|rgb|\(|\)/gm;

	return value
		.replace(matcher, '')
		.split(/\s|,/g)
		.filter(Boolean)
		.map((item, index) => (index > 2 ? parseFloat(item) : parseInt(item, 10)));
};

export class Color {
	states = reactive({
		hue: 0,
		saturation: 100,
		value: 100,
		alpha: 100,
		enableAlpha: false,
		format: 'hex' as ColorFormat,
		selected: undefined as boolean | undefined,
		output: computed(() => this.getOutput())
	});

	constructor(options: ColorOptions = {}) {
		this.setOptions(options);

		if (options.value) {
			this.setColor(options.value);
		}
	}

	setOptions(options: ColorOptionStates = {}) {
		this.states.enableAlpha = !!options.enableAlpha;
		this.states.format = options.format || (this.states.enableAlpha ? 'rgb' : 'hex');
	}

	set(prop: ColorChannel | Partial<Record<ColorChannel, number>>, value?: number) {
		if (typeof prop === 'object') {
			Object.entries(prop).forEach(([key, item]) => {
				this.set(key as ColorChannel, item);
			});
			return;
		}

		this.states[prop] = value || 0;
	}

	get(prop: ColorChannel) {
		return this.states[prop];
	}

	toRgb() {
		return hsv2rgb(this.states.hue, this.states.saturation, this.states.value);
	}

	setColor(value?: string) {
		if (!value) {
			this.states.hue = 0;
			this.states.saturation = 100;
			this.states.value = 100;
			this.states.alpha = 100;
			return;
		}

		const fromHSV = (h: number, s: number, v: number) => {
			this.states.hue = Math.max(0, Math.min(360, Math.ceil(h)));
			this.states.saturation = Math.max(0, Math.min(100, s));
			this.states.value = Math.max(0, Math.min(100, v));
		};

		if (value.includes('hsl')) {
			const parts = parseFunctionalColor(value, 'hsl');

			this.states.alpha = parts.length === 4 ? Math.floor(parts[3] * 100) : 100;
			if (parts.length >= 3) {
				const { h, s, v } = hsl2hsv(parts[0], parts[1], parts[2]);
				fromHSV(h, s, v);
			}
		} else if (value.includes('hsv')) {
			const parts = parseFunctionalColor(value, 'hsv');

			this.states.alpha = parts.length === 4 ? Math.floor(parts[3] * 100) : 100;
			if (parts.length >= 3) {
				fromHSV(parts[0], parts[1], parts[2]);
			}
		} else if (value.includes('rgb')) {
			const parts = parseFunctionalColor(value, 'rgb');

			this.states.alpha = parts.length === 4 ? Math.floor(parts[3] * 100) : 100;
			if (parts.length >= 3) {
				const { h, s, v } = rgb2hsv(parts[0], parts[1], parts[2]);
				fromHSV(h, s, v);
			}
		} else if (value.includes('#')) {
			const hex = value.replace('#', '').trim();
			if (!/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) return;

			let r: number;
			let g: number;
			let b: number;

			if (hex.length === 3) {
				r = parseHexChannel(hex[0] + hex[0]);
				g = parseHexChannel(hex[1] + hex[1]);
				b = parseHexChannel(hex[2] + hex[2]);
			} else {
				r = parseHexChannel(hex.substring(0, 2));
				g = parseHexChannel(hex.substring(2, 4));
				b = parseHexChannel(hex.substring(4, 6));
			}

			this.states.alpha = hex.length === 8
				? Math.floor(parseHexChannel(hex.substring(6)) / 255 * 100)
				: 100;

			const { h, s, v } = rgb2hsv(r, g, b);
			fromHSV(h, s, v);
		}
	}

	compare(color: Color) {
		return Math.abs(color.states.hue - this.states.hue) < 2
			&& Math.abs(color.states.saturation - this.states.saturation) < 1
			&& Math.abs(color.states.value - this.states.value) < 1
			&& Math.abs(color.states.alpha - this.states.alpha) < 1;
	}

	private getOutput() {
		const {
			hue,
			saturation,
			value,
			alpha,
			enableAlpha,
			format
		} = this.states;

		if (enableAlpha) {
			switch (format) {
				case 'hsl': {
					const hsl = hsv2hsl(hue, saturation / 100, value / 100);
					return `hsla(${hue}, ${Math.round(hsl[1] * 100)}%, ${Math.round(hsl[2] * 100)}%, ${alpha / 100})`;
				}
				case 'hsv':
					return `hsva(${hue}, ${Math.round(saturation)}%, ${Math.round(value)}%, ${alpha / 100})`;
				default: {
					const { r, g, b } = hsv2rgb(hue, saturation, value);
					return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
				}
			}
		}

		switch (format) {
			case 'hsl': {
				const hsl = hsv2hsl(hue, saturation / 100, value / 100);
				return `hsl(${hue}, ${Math.round(hsl[1] * 100)}%, ${Math.round(hsl[2] * 100)}%)`;
			}
			case 'hsv':
				return `hsv(${hue}, ${Math.round(saturation)}%, ${Math.round(value)}%)`;
			case 'rgb': {
				const { r, g, b } = hsv2rgb(hue, saturation, value);
				return `rgb(${r}, ${g}, ${b})`;
			}
			default:
				return toHex(hsv2rgb(hue, saturation, value));
		}
	}
}
