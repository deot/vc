// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const compile = (file: string) => postcss.parse(sass.compile(new URL(file, import.meta.url).pathname).css);
const css = compile('../style.scss');

const declarations = (root: postcss.Root, selector: string) => {
	const map: Record<string, string> = {};
	root.walkRules((rule) => {
		if (rule.selectors.includes(selector)) {
			rule.walkDecls((d) => {
				map[d.prop] = d.value;
			});
		}
	});
	return map;
};

describe('Rate styles', () => {
	it('desktop sizes fall back to px through --vc-rate-*', () => {
		expect(declarations(css, '.vc-rate__star')['font-size']).toBe('var(--vc-rate-size, 16px)');
		expect(declarations(css, '.vc-rate__stars').gap).toBe('var(--vc-rate-gap, 8px)');
		expect(declarations(css, '.vc-rate__stars').padding).toBe('var(--vc-rate-padding, 0px)');
		expect(declarations(css, '.vc-rate')['font-size']).toBe('var(--vc-rate-font-size, 14px)');
	});

	it('selected and half stars use --vc-rate-color (gold by default)', () => {
		const color = 'var(--vc-rate-color, #FFB400)';
		expect(declarations(css, '.vc-rate__star.is-select > .vc-rate__icon').color).toBe(color);
		expect(declarations(css, '.vc-rate__icon.is-overlay').color).toBe(color);
		expect(declarations(css, '.vc-rate__icon').color).toBe('var(--vc-rate-foreground-color-inactive, var(--vc-foreground-color-inactive))');
	});

	it('the list has no user-agent margin or padding to inherit', () => {
		css.walkRules((rule) => {
			expect(rule.selector).not.toMatch(/\b(ul|li)\b/);
		});
	});
});
