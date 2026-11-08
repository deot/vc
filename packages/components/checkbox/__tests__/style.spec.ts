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

describe('Checkbox styles', () => {
	const desktop = compile('../style.scss');
	const mobile = compile('../mobile/style.scss');

	it('尺寸：桌面端为 px（medium 与改动前相同），移动端为 750 稿', () => {
		expect(declsFor(desktop, '.vc-checkbox.is-medium', '--vc-checkbox-height')).toEqual(['32px']);
		expect(declsFor(desktop, '.vc-checkbox.is-medium', '--vc-checkbox-line-height')).toEqual(['20px']);
		expect(declsFor(desktop, '.vc-checkbox.is-large', '--vc-checkbox-font-size')).toEqual(['14px']);
		const heights = { mini: 48, small: 56, medium: 64, large: 72 };
		for (const [size, height] of Object.entries(heights)) {
			expect(declsFor(mobile, `.vcm-checkbox.is-${size}`, '--vc-m-checkbox-height'), size).toEqual([rem(height)]);
		}
	});

	it('分组样式与 Radio 相同，主题命名空间为 checkbox-group / m-checkbox-group', () => {
		expect(declsFor(desktop, '.vc-checkbox-group.is-capsule', 'padding')).toEqual(['3px']);
		expect(declsFor(mobile, '.vcm-checkbox-group.is-capsule', 'padding')).toEqual([rem(6)]);
		expect(declsFor(desktop, '.vc-checkbox.is-button .vc-checkbox__label', 'border-radius')).toEqual(['6px']);
		expect(declsFor(mobile, '.vcm-checkbox.is-button .vcm-checkbox__label', 'border-radius')).toEqual([rem(12)]);
		expect(declsFor(mobile, '.vcm-checkbox-group.is-capsule', 'background-color'))
			.toEqual(['var(--vc-m-checkbox-group-color-neutral-light, var(--vc-color-neutral-light))']);
	});

	it('移动端没有悬停与焦点光晕，按钮、圆角分组换行', () => {
		expect(hasSelector(desktop, /\.vc-checkbox.*:hover/)).toBe(true);
		expect(hasSelector(mobile, /:hover|:focus-visible|\.is-focus/)).toBe(false);
		expect(declsFor(mobile, '.vcm-checkbox-group.is-button', 'flex-wrap')).toEqual(['wrap']);
		expect(declsFor(mobile, '.vcm-checkbox-group.is-round', 'gap')).toEqual([rem(16)]);
	});

	it('移动端竖排行高只作用于勾选框项', () => {
		const plain = '.vcm-checkbox-group.is-vertical > .vcm-checkbox:not(.is-button, .is-card, .is-capsule, .is-text, .is-round)';
		expect(declsFor(mobile, plain, 'min-height')).toEqual([rem(84)]);
	});
});
