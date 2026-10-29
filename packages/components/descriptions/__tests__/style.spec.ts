// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const css = postcss.parse(sass.compile(new URL('../style.scss', import.meta.url).pathname).css);

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
			expect(declsFor(selector, '--vc-descriptions-font-size'), size).toEqual([fontSize]);
			expect(declsFor(selector, '--vc-descriptions-line-height'), size).toEqual([lineHeight]);
			expect(declsFor(selector, '--vc-descriptions-row-gap'), size).toEqual([rowGap]);
		}
	});

	it('tooltip icon goes after the label, before it when right aligned', () => {
		expect(declsFor('.vc-descriptions__tooltip', 'margin-left')).toEqual(['2px']);
		const right = '.vc-descriptions.is-right:not(.is-inline) .vc-descriptions__tooltip';
		expect(declsFor(right, 'order')).toEqual(['-1']);
		expect(declsFor(right, 'margin-right')).toEqual(['2px']);
		expect(declsFor(right, 'margin-left')).toEqual(['0']);
	});

	it('thumbnails default to the line height', () => {
		const size = 'var(--vc-descriptions-image-size, var(--vc-descriptions-line-height))';
		expect(declsFor('.vc-descriptions__image', 'width')).toEqual([size]);
		expect(declsFor('.vc-descriptions__image', 'height')).toEqual([size]);
	});
});
