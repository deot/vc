import { computed, reactive } from 'vue';

export type ColorFormat = 'hsl' | 'hsv' | 'hex' | 'rgb';
export type ColorChannel = 'hue' | 'saturation' | 'value' | 'opacity';

export interface ColorOptions {
	value?: string;
	// 是否输出透明度
	alpha?: boolean;
	format?: ColorFormat;
}

type ColorOutputOptions = Pick<ColorOptions, 'alpha' | 'format'>;
type HSVA = Record<ColorChannel, number>;

export interface RGB {
	r: number;
	g: number;
	b: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

const hsv2hsl = (hue: number, sat: number, val: number) => {
	const light = (2 - sat) * val;
	const saturation = (sat * val / (light < 1 ? light : 2 - light)) || 0;

	return [
		hue,
		saturation,
		light / 2
	];
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
			default:
				h = (red - green) / delta + 4;
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

const toHexByte = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0').toUpperCase();

const toHex = ({ r, g, b }: RGB, opacity?: number) => {
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '';

	return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}${opacity === undefined ? '' : toHexByte(opacity / 100 * 255)}`;
};

const toHSVA = (h: number, s: number, v: number, opacity: number): HSVA => ({
	hue: clamp(Math.ceil(h), 0, 360),
	saturation: clamp(s, 0, 100),
	value: clamp(v, 0, 100),
	// 不取整：8 位 hex 的 AA 能原样往返，输出时再按两位小数取整
	opacity: clamp(opacity, 0, 100)
});

// 透明度：0–1 的小数或百分比，省略为不透明
const parseOpacity = (value?: string) => {
	if (value === undefined) return 100;

	const parsed = parseFloat(value);
	return isPercentage(value) ? parsed : parsed * 100;
};

const FUNCTIONAL_REGEX = /^(rgb|hsl|hsv)a?\((.*)\)$/;
const HEX_REGEX = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;

// rgb(a) / hsl(a) / hsv(a)，逗号或空格分隔，透明度可用 `/` 分隔
const parseFunctional = (input: string): HSVA | null => {
	const match = input.match(FUNCTIONAL_REGEX);
	if (!match) return null;

	const parts = match[2].split(/[\s,/]+/).filter(Boolean);
	if (parts.length < 3 || parts.length > 4 || parts.some(item => Number.isNaN(parseFloat(item)))) return null;

	const [a, b, c] = parts.slice(0, 3).map(item => parseFloat(item));
	const opacity = parseOpacity(parts[3]);

	switch (match[1]) {
		case 'rgb': {
			const { h, s, v } = rgb2hsv(a, b, c);
			return toHSVA(h, s, v, opacity);
		}
		case 'hsl': {
			const { h, s, v } = hsl2hsv(a, b, c);
			return toHSVA(h, s, v, opacity);
		}
		default:
			return toHSVA(a, b, c, opacity);
	}
};

// 3 / 4 / 6 / 8 位 hex，`#` 可省略
const parseHex = (input: string): HSVA | null => {
	const match = input.match(HEX_REGEX);
	if (!match) return null;

	const hex = match[1].length <= 4
		? match[1].replace(/./g, '$&$&')
		: match[1];
	const bytes = hex.match(/../g)!.map(item => parseInt(item, 16));
	const { h, s, v } = rgb2hsv(bytes[0], bytes[1], bytes[2]);

	return toHSVA(h, s, v, bytes.length === 4 ? bytes[3] / 255 * 100 : 100);
};

let context: CanvasRenderingContext2D | null | undefined;

// CSS 颜色名交给浏览器归一化（如 'red' → '#ff0000'）；没有 DOM 时不支持
const normalizeName = (input: string) => {
	if (typeof document === 'undefined') return null;
	if (context === undefined) {
		context = document.createElement('canvas').getContext('2d') || null;
	}
	if (!context) return null;

	// 无效值不会改变 fillStyle：用两个不同的初值判断
	context.fillStyle = '#000';
	context.fillStyle = input;
	const black = context.fillStyle;
	context.fillStyle = '#fff';
	context.fillStyle = input;

	return black === context.fillStyle ? black : null;
};

/**
 * 解析色值：hex（3/4/6/8 位，`#` 可省略）、rgb(a)、hsl(a)、hsv(a)、transparent、CSS 颜色名
 * @param value 色值
 * @returns 各通道，无法解析时为 null
 */
export const parseColor = (value?: string): HSVA | null => {
	const input = (value || '').trim().toLowerCase();
	if (!input) return null;
	if (input === 'transparent') return { hue: 0, saturation: 0, value: 0, opacity: 0 };

	const result = parseFunctional(input) || parseHex(input);
	if (result || !/^[a-z]+$/.test(input)) return result;

	const normalized = normalizeName(input);
	return normalized ? parseColor(normalized) : null;
};

const DEFAULT_CHANNELS: HSVA = { hue: 0, saturation: 100, value: 100, opacity: 100 };

export class Color {
	/**
	 * 解析色值并创建实例
	 * @param value 色值
	 * @param options 输出选项
	 * @returns 无法解析时为 null
	 */
	static parse(value: string, options: ColorOutputOptions = {}) {
		const channels = parseColor(value);
		if (!channels) return null;

		const color = new Color(options);
		color.set(channels);
		return color;
	}

	states = reactive({
		...DEFAULT_CHANNELS,
		alpha: false,
		format: 'hex' as ColorFormat,
		output: computed(() => this.getOutput())
	});

	constructor(options: ColorOptions = {}) {
		this.setOptions(options);

		if (options.value) {
			this.setColor(options.value);
		}
	}

	setOptions(options: ColorOutputOptions = {}) {
		this.states.alpha = !!options.alpha;
		this.states.format = options.format || (this.states.alpha ? 'rgb' : 'hex');
	}

	set(prop: ColorChannel | Partial<HSVA>, value?: number) {
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

	/**
	 * 可直接用于 CSS 的色值（hsv 等 CSS 不支持的格式也能显示）
	 * @returns rgb() 或 rgba()
	 */
	toCss() {
		const { r, g, b } = this.toRgb();

		return this.states.alpha && this.states.opacity < 100
			? `rgba(${r}, ${g}, ${b}, ${Math.round(this.states.opacity) / 100})`
			: `rgb(${r}, ${g}, ${b})`;
	}

	/**
	 * 设置色值；空值恢复默认红色
	 * @param value 色值
	 * @returns 是否解析成功，失败时保持原值
	 */
	setColor(value?: string) {
		const channels = value ? parseColor(value) : DEFAULT_CHANNELS;
		if (!channels) return false;

		this.set(channels);
		return true;
	}

	compare(color: Color) {
		return Math.abs(color.states.hue - this.states.hue) < 2
			&& Math.abs(color.states.saturation - this.states.saturation) < 1
			&& Math.abs(color.states.value - this.states.value) < 1
			&& Math.abs(color.states.opacity - this.states.opacity) < 1;
	}

	private getOutput() {
		const { hue, saturation, value, opacity, alpha, format } = this.states;
		const a = alpha ? Math.round(opacity) / 100 : 1;

		switch (format) {
			case 'hsl': {
				const hsl = hsv2hsl(hue, saturation / 100, value / 100);
				const body = `${hue}, ${Math.round(hsl[1] * 100)}%, ${Math.round(hsl[2] * 100)}%`;
				return alpha ? `hsla(${body}, ${a})` : `hsl(${body})`;
			}
			case 'hsv': {
				const body = `${hue}, ${Math.round(saturation)}%, ${Math.round(value)}%`;
				return alpha ? `hsva(${body}, ${a})` : `hsv(${body})`;
			}
			case 'rgb': {
				const { r, g, b } = hsv2rgb(hue, saturation, value);
				return alpha ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
			}
			default:
				return toHex(hsv2rgb(hue, saturation, value), alpha ? opacity : undefined);
		}
	}
}
