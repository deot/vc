// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const compile = (file: string) => postcss.parse(sass.compile(new URL(file, import.meta.url).pathname).css);
const css = compile('../style.scss');
const mobile = compile('../mobile/style.scss');

const declsFor = (selector: string, property: string) => {
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

const themed = (name: string) => `var(--vc-descriptions-${name}, var(--vc-${name}))`;

describe('Descriptions styles', () => {
	it('colors come from the theme and can be overridden per component', () => {
		expect(declsFor('.vc-descriptions', 'color')).toEqual([themed('color-dark-light')]);
		expect(declsFor('.vc-descriptions__label', 'color')).toEqual([themed('color-dark-lightest')]);
		expect(declsFor('.vc-descriptions__group-label', 'color')).toEqual([themed('color-dark-lighter')]);
		expect(declsFor('.vc-descriptions__link', 'color')).toEqual([themed('color-primary')]);
		expect(declsFor('.vc-descriptions__copy-icon', 'color')).toEqual([themed('color-primary')]);
	});

	it('fill and inverted panels use opposite surfaces', () => {
		expect(declsFor('.vc-descriptions.is-fill .vc-descriptions__content', 'background')).toEqual([themed('background-color-light')]);
		expect(declsFor('.vc-descriptions.is-inverted .vc-descriptions__content', 'background'))
			.toEqual([themed('background-color-lightest')]);
	});

	it('each size sets local variables', () => {
		const sizes = {
			mini: ['12px', '18px', '4px'],
			small: ['13px', '20px', '8px'],
			medium: ['13px', '20px', '12px'],
			large: ['14px', '22px', '16px']
		};
		for (const [size, [fontSize, lineHeight, rowGap]] of Object.entries(sizes)) {
			const selector = `.vc-descriptions.is-${size}`;
			const local = (key: string, value: string) => `var(--vc-descriptions-${size}-${key}, ${value})`;
			expect(declsFor(selector, '--vc-descriptions-font-size'), size).toEqual([local('font-size', fontSize)]);
			expect(declsFor(selector, '--vc-descriptions-line-height'), size).toEqual([local('line-height', lineHeight)]);
			expect(declsFor(selector, '--vc-descriptions-row-gap'), size).toEqual([local('row-gap', rowGap)]);
		}
	});

	it('tooltip icon goes after the label, before it when right aligned', () => {
		expect(declsFor('.vc-descriptions__tooltip', 'margin-left')).toEqual(['var(--vc-descriptions-tooltip-gap, 2px)']);
		const right = '.vc-descriptions.is-right:not(.is-inline) .vc-descriptions__tooltip';
		expect(declsFor(right, 'order')).toEqual(['-1']);
		expect(declsFor(right, 'margin-right')).toEqual(['var(--vc-descriptions-tooltip-gap, 2px)']);
		expect(declsFor(right, 'margin-left')).toEqual(['0']);
	});

	it('thumbnails default to the line height', () => {
		const size = 'var(--vc-descriptions-image-size, var(--vc-descriptions-line-height))';
		expect(declsFor('.vc-descriptions__image', 'width')).toEqual([size]);
		expect(declsFor('.vc-descriptions__image', 'height')).toEqual([size]);
	});

	it('MDescriptions only overrides local variables in 750 units', () => {
		const decls: Record<string, string> = {};
		mobile.walkRules((rule) => {
			expect(rule.selector).toBe('.vcm-descriptions');
			rule.walkDecls((declaration) => {
				decls[declaration.prop] = declaration.value;
			});
		});
		expect(Object.keys(decls).every(prop => prop.startsWith('--vc-descriptions-'))).toBe(true);
		expect(decls['--vc-descriptions-medium-font-size']).toBe('calc(var(--vc-rem) * 28)');
		expect(decls['--vc-descriptions-medium-row-gap']).toBe('calc(var(--vc-rem) * 24)');
		expect(decls['--vc-descriptions-content-padding']).toBe('calc(var(--vc-rem) * 32)');
		// 桌面端读取的每个局部变量，移动端都有对应值
		const used = new Set<string>();
		css.walkDecls((declaration) => {
			for (const [, key] of declaration.value.matchAll(/var\((--vc-descriptions-[a-z-]+), \d/g)) used.add(key);
		});
		expect([...used].filter(key => !(key in decls))).toEqual([]);
	});
});
