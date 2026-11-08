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
	['desktop', 'vc-switch', '../style.scss', 'color-light-deepest'],
	['mobile', 'vcm-switch', '../mobile/style.scss', 'color-light-deeper']
])('Switch %s theme contrast', (platform, component, path, lightTrack) => {
	const css = postcss.parse(sass.compile(new URL(path, import.meta.url).pathname).css);
	const wrapper = platform === 'desktop' ? ` .${component}__wrapper` : '';
	const ordinary = `.${component}:not(.is-checked)${wrapper}`;
	it.each([
		['light', lightTrack],
		['dark', 'background-color-light']
	])('uses the %s unchecked track without changing the checked track', (mode, parameter) => {
		const track = `var(--vc-switch-${parameter}, var(--vc-${parameter}))`;
		// 桌面端轨道带同色边框，移动端没有边框
		const expected = platform === 'desktop'
			? { 'background-color': track, 'border-color': track }
			: { 'background-color': track };
		expect(valuesFor(css, `[data-vc-theme=${mode}] ${ordinary}`)).toEqual(expected);
		let systemTrack: postcss.Rule | undefined;
		css.walkRules((rule) => {
			if (rule.selectors.includes(`:root ${ordinary}`) && rule.parent?.type === 'atrule'
				&& rule.parent.name === 'media' && rule.parent.params === `(prefers-color-scheme: ${mode})`) {
				systemTrack = rule;
			}
		});
		expect(systemTrack).toBeDefined();
		expect(systemTrack!.nodes.filter(node => node.type === 'decl').map(node => node.value)).toEqual(Object.values(expected));
	});

	it('uses the primary track when checked and dims the whole control when disabled', () => {
		expect(valuesFor(css, `.${component}.is-checked${wrapper}`)).toMatchObject({
			'background-color': 'var(--vc-switch-color-primary, var(--vc-color-primary))'
		});
		expect(valuesFor(css, `.${component}.is-disabled`)).toMatchObject({
			opacity: '0.5'
		});
	});

	it('keeps the thumb and loading colors independent of the track', () => {
		const contrast = 'var(--vc-switch-color-contrast-light, var(--vc-color-contrast-light))';
		expect(valuesFor(css, `.${component}__inner`)['background-color']).toBe(contrast);
		// 浅色底环 + 主色转动弧，线宽加粗
		expect(valuesFor(css, `.${component}__loading path`)).toEqual({
			'stroke': 'var(--vc-switch-color-primary-lighter, var(--vc-color-primary-lighter))',
			'stroke-width': '4'
		});
		expect(valuesFor(css, `.${component}__loading path + path`)).toEqual({
			stroke: 'var(--vc-switch-color-primary, var(--vc-color-primary))'
		});
	});

	it('shows a focus ring for keyboard focus only', () => {
		const focusable = platform === 'desktop' ? `.${component}__wrapper` : `.${component}`;
		expect(valuesFor(css, `${focusable}:focus-visible`)['box-shadow'])
			.toBe('0 0 0 3px var(--vc-switch-color-primary-lighter, var(--vc-color-primary-lighter))');
	});
});

describe('Switch text colors', () => {
	const contrast = 'var(--vc-switch-color-contrast-light, var(--vc-color-contrast-light))';
	it('keeps white text on the desktop track', () => {
		const css = postcss.parse(sass.compile(new URL('../style.scss', import.meta.url).pathname).css);
		expect(valuesFor(css, '.vc-switch__content').color).toBe(contrast);
	});

	it('uses secondary text on the light mobile track and white text when checked', () => {
		const css = postcss.parse(sass.compile(new URL('../mobile/style.scss', import.meta.url).pathname).css);
		expect(valuesFor(css, '.vcm-switch__content').color)
			.toBe('var(--vc-switch-foreground-color-light, var(--vc-foreground-color-light))');
		expect(valuesFor(css, '.vcm-switch.is-checked .vcm-switch__content').color).toBe(contrast);
	});
});
