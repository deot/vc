// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const valuesFor = (css: postcss.Root, selector: string) => {
	const values: Record<string, string> = {};
	css.walkRules((rule) => {
		if (rule.selectors.includes(selector)) {
			rule.walkDecls((declaration) => {
				values[declaration.prop] = declaration.value;
			});
		}
	});
	return values;
};

describe.each([
	['desktop', 'vc-switch', '../style.scss'],
	['mobile', 'vcm-switch', '../mobile/style.scss']
])('Switch %s theme contrast', (_platform, component, path) => {
	const css = postcss.parse(sass.compile(new URL(path, import.meta.url).pathname).css);
	const wrapper = component === 'vc-switch' ? ` .${component}__wrapper` : '';
	const ordinary = `.${component}:not(.is-checked, .is-disabled)${wrapper}`;
	it.each([
		['light', 'color-light-deepest'],
		['dark', 'background-color-light']
	])('uses the %s ordinary track without changing checked or disabled tracks', (mode, parameter) => {
		const track = `var(--vc-switch-${parameter}, var(--vc-${parameter}))`;
		expect(valuesFor(css, `[data-vc-theme=${mode}] ${ordinary}`)).toEqual({
			'background-color': track,
			'border-color': track
		});
		let systemTrack: postcss.Rule | undefined;
		css.walkRules((rule) => {
			if (rule.selectors.includes(`:root ${ordinary}`) && rule.parent?.type === 'atrule'
				&& rule.parent.name === 'media' && rule.parent.params === `(prefers-color-scheme: ${mode})`) {
				systemTrack = rule;
			}
		});
		expect(systemTrack).toBeDefined();
		expect(systemTrack!.nodes.filter(node => node.type === 'decl').map(node => node.value)).toEqual([track, track]);
	});

	it.each([
		['light', 'color-contrast-light'],
		['dark', 'foreground-color-inactive']
	])('distinguishes the %s disabled foreground from interactive controls', (mode, parameter) => {
		const foreground = `var(--vc-switch-${parameter}, var(--vc-${parameter}))`;
		const selector = `[data-vc-theme=${mode}] .${component}.is-disabled`;
		expect(valuesFor(css, `${selector} .${component}__content`).color).toBe(foreground);
		expect(valuesFor(css, `${selector} .${component}__inner`)['background-color']).toBe(foreground);
	});

	it('uses matching selected and disabled tracks on both platforms', () => {
		expect(valuesFor(css, `.${component}.is-checked${wrapper}`)).toMatchObject({
			'background-color': 'var(--vc-switch-color-primary, var(--vc-color-primary))'
		});
		expect(valuesFor(css, `.${component}.is-disabled${wrapper}`)).toMatchObject({
			'background-color': 'var(--vc-switch-background-color-light, var(--vc-background-color-light))'
		});
		const disabledChecked = `.${component}.is-disabled.is-checked${wrapper}`;
		const primary = 'var(--vc-switch-color-primary-light, var(--vc-color-primary-light))';
		const surface = 'var(--vc-switch-background-color-lightest, var(--vc-background-color-lightest))';
		expect(valuesFor(css, disabledChecked)['background-color']).toBe(`color-mix(in srgb, ${primary} 30%, ${surface})`);
	});

	it('retains the contrasting text and thumb independently of the track', () => {
		const contrast = 'var(--vc-switch-color-contrast-light, var(--vc-color-contrast-light))';
		expect(valuesFor(css, `.${component}__content`).color).toBe(contrast);
		expect(valuesFor(css, `.${component}__inner`)['background-color']).toBe(contrast);
		expect(valuesFor(css, `.${component}__loading`).color).toBe('var(--vc-switch-color-primary, var(--vc-color-primary))');
	});
});
