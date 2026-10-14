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

describe('Badge styles', () => {
	it('status colors come from the theme and can be overridden per component', () => {
		const colors = {
			default: 'color-neutral',
			pending: 'color-primary',
			success: 'color-success',
			warning: 'color-warning',
			error: 'color-error'
		};
		for (const [status, name] of Object.entries(colors)) {
			expect(declsFor(`.vc-badge__status-dot.is-${status}`, 'background-color'), status)
				.toEqual([`var(--vc-badge-${name}, var(--vc-${name}))`]);
		}
	});

	it('the ring around corner badges uses the surface color', () => {
		const ring = '0 0 0 2px var(--vc-badge-background-color-lightest, var(--vc-background-color-lightest))';
		expect(declsFor('.vc-badge__value', 'box-shadow')).toEqual([ring]);
		expect(declsFor('.vc-badge__dot', 'box-shadow')).toEqual([ring]);
	});

	it('the label baseline is the baseline of the whole badge', () => {
		expect(declsFor('.vc-badge__label', 'align-self')).toEqual(['baseline']);
	});

	it('enter and leave keep the corner translate, standalone badges only scale', () => {
		expect(declsFor('.vc-badge__zoom-enter-from', 'transform')).toEqual(['translate(50%, -50%) scale(0.2)']);
		expect(declsFor('.vc-badge__zoom-leave-to', 'transform')).toEqual(['translate(50%, -50%) scale(0.2)']);
		expect(declsFor('.vc-badge.is-standalone > .vc-badge__zoom-enter-from', 'transform')).toEqual(['scale(0.2)']);
		expect(declsFor('.vc-badge.is-standalone > .vc-badge__zoom-leave-to', 'transform')).toEqual(['scale(0.2)']);
		expect(declsFor('.vc-badge.is-standalone .vc-badge__value', 'transform')).toEqual(['none']);
	});
});
