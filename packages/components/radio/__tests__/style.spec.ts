// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const compile = (path: string) => postcss.parse(sass.compile(new URL(path, import.meta.url).pathname).css);

const declsFor = (css: postcss.Root, selector: string, property: string) => {
	const values: string[] = [];
	css.walkRules((rule) => {
		if (rule.selectors.includes(selector)) {
			rule.walkDecls(property, (declaration) => {
				values.push(declaration.value);
			});
		}
	});
	return values;
};

const hasSelector = (css: postcss.Root, pattern: RegExp) => {
	let found = false;
	css.walkRules((rule) => {
		if (rule.selectors.some(v => pattern.test(v))) found = true;
	});
	return found;
};

const rem = (n: number) => `calc(var(--vc-rem) * ${n})`;

describe('Radio styles', () => {
	const desktop = compile('../style.scss');
	const mobile = compile('../mobile/style.scss');

	it('分组样式的尺寸：桌面端为 px，移动端为 750 稿', () => {
		expect(declsFor(desktop, '.vc-radio.is-medium', '--vc-radio-height')).toEqual(['32px']);
		const heights = { mini: 48, small: 56, medium: 64, large: 72 };
		for (const [size, height] of Object.entries(heights)) {
			expect(declsFor(mobile, `.vcm-radio.is-${size}`, '--vc-m-radio-height'), size).toEqual([rem(height)]);
		}
		expect(declsFor(mobile, '.vcm-radio.is-large', '--vc-m-radio-font-size')).toEqual([rem(32)]);
	});

	it('两端共用同一套分组样式，移动端长度按 375 宽下的 px × 2 换算', () => {
		expect(declsFor(desktop, '.vc-radio-group.is-capsule', 'padding')).toEqual(['3px']);
		expect(declsFor(mobile, '.vcm-radio-group.is-capsule', 'padding')).toEqual([rem(6)]);
		expect(declsFor(desktop, '.vc-radio.is-button .vc-radio__label', 'border-radius')).toEqual(['6px']);
		expect(declsFor(mobile, '.vcm-radio.is-button .vcm-radio__label', 'border-radius')).toEqual([rem(12)]);
		expect(declsFor(mobile, '.vcm-radio-group.is-capsule', 'background-color'))
			.toEqual(['var(--vc-m-radio-group-color-neutral-light, var(--vc-color-neutral-light))']);
	});

	it('移动端没有悬停与焦点光晕', () => {
		expect(hasSelector(desktop, /\.vc-radio.*:hover/)).toBe(true);
		expect(hasSelector(desktop, /\.vc-radio.*(:focus-visible|\.is-focus)/)).toBe(true);
		expect(hasSelector(mobile, /:hover|:focus-visible|\.is-focus/)).toBe(false);
	});

	it('移动端按钮、圆角分组换行，间距用 gap', () => {
		expect(declsFor(mobile, '.vcm-radio-group.is-button', 'flex-wrap')).toEqual(['wrap']);
		expect(declsFor(mobile, '.vcm-radio-group.is-button', 'gap')).toEqual([rem(8)]);
		expect(declsFor(mobile, '.vcm-radio-group.is-round', 'gap')).toEqual([rem(16)]);
	});

	it('移动端竖排行高只作用于圆点项', () => {
		const plain = '.vcm-radio-group.is-vertical > .vcm-radio:not(.is-button, .is-card, .is-capsule, .is-text, .is-round)';
		expect(declsFor(mobile, plain, 'min-height')).toEqual([rem(84)]);
	});
});
