// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const compile = (file: string) => postcss.parse(sass.compile(new URL(file, import.meta.url).pathname).css);
const css = compile('../style.scss');
const mobileCss = compile('../mobile/style.scss');

const colorsFor = (selector: string) => {
	const colors: string[] = [];
	css.walkRules((rule) => {
		if (rule.selectors.includes(selector)) {
			rule.walkDecls('color', (declaration) => {
				colors.push(declaration.value);
			});
		}
	});
	return colors;
};

describe('Steps clickable hover styles', () => {
	it.each(['pending', 'error'])('preserves contrasting arrow text on %s backgrounds', (status) => {
		for (const element of ['title', 'description']) {
			const selector = `.vc-steps.is-clickable.is-arrow > .vc-step.is-${status}.is-clickable:hover > .vc-step__content > .vc-step__${element}`;
			expect(colorsFor(selector)).toEqual(['var(--vc-steps-color-contrast-light, var(--vc-color-contrast-light))']);
		}
	});

	it('retains primary hover text for other modes and unfilled arrow states', () => {
		for (const element of ['title', 'description']) {
			const selector = `.vc-steps.is-clickable > .vc-step.is-clickable:hover > .vc-step__content > .vc-step__${element}`;
			expect(colorsFor(selector)).toEqual(['var(--vc-steps-color-primary, var(--vc-color-primary))']);
		}
	});
});

describe('Steps hover only on hover devices', () => {
	it('wraps every :hover rule in @media (hover: hover)', () => {
		const hovers: string[] = [];
		css.walkRules((rule) => {
			if (rule.selector.includes(':hover')) {
				hovers.push((rule.parent as any)?.type === 'atrule' ? (rule.parent as any).params : 'none');
			}
		});
		expect(hovers.length).toBeGreaterThan(0);
		expect(new Set(hovers)).toEqual(new Set(['(hover: hover)']));
	});
});

describe('Steps local sizes', () => {
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

	it('desktop sizes fall back to px through --vc-steps-*', () => {
		const icon = declarations(css, '.vc-step__icon');
		expect(icon.width).toBe('var(--vc-steps-icon-size, 28px)');
		expect(declarations(css, '.vc-steps')['font-size']).toBe('var(--vc-steps-font-size, 14px)');
	});

	it('MSteps overrides the variables on .vcm-steps in 750 units', () => {
		const vars = declarations(mobileCss, '.vcm-steps');
		expect(vars['--vc-steps-icon-size']).toBe('calc(var(--vc-rem) * 36)');
		expect(vars['--vc-steps-title-font-size']).toBe('calc(var(--vc-rem) * 28)');
		expect(vars['--vc-steps-vertical-min-height']).toBe('0');
	});
});
