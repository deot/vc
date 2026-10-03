// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const css = postcss.parse(sass.compile(new URL('../style.scss', import.meta.url).pathname).css);

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
