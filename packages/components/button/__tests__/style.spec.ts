// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const css = postcss.parse(sass.compile(new URL('../style.scss', import.meta.url).pathname).css);
const selector = '.vc-button.is-disabled.is-primary.is-solid';
const surface = 'var(--vc-button-background-color-lightest, var(--vc-background-color-lightest))';
const fallback = 'var(--vc-button-color-primary-lighter, var(--vc-color-primary-lighter))';

describe('Button neutral hover styles', () => {
	it('uses the same locally overridable neutral color for the dark default hover surface and border', () => {
		const hover = '[data-vc-theme=dark] .vc-button.is-default:not(.is-disabled):not(.is-solid):hover';
		const values: Record<string, string> = {};
		css.walkRules((rule) => {
			if (rule.selectors.includes(hover)) {
				rule.walkDecls((declaration) => { values[declaration.prop] = declaration.value; });
			}
		});
		const neutral = 'var(--vc-button-color-neutral-light, var(--vc-color-neutral-light))';
		expect(values).toMatchObject({ 'background-color': neutral, 'border-color': neutral });
	});
});

describe('Button disabled primary solid styles', () => {
	it('keeps an outlined surface and matching text/border in ordinary and hover states', () => {
		const matching: postcss.Rule[] = [];
		css.walkRules((rule) => { if (rule.selectors.includes(selector)) matching.push(rule); });
		const base = matching.find(rule => rule.parent?.type === 'root');
		expect(base).toBeDefined();
		expect(base!.selectors).toContain(`${selector}:hover`);
		const values = Object.fromEntries(base!.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
		expect(values).toMatchObject({ 'color': fallback, 'background-color': surface, 'border-color': 'currentcolor' });
	});

	it('enhances only the disabled foreground inside the color-mix support guard', () => {
		const matching: postcss.Rule[] = [];
		css.walkRules((rule) => { if (rule.selectors.includes(selector)) matching.push(rule); });
		const enhanced = matching.find(rule => rule.parent?.type === 'atrule' && rule.parent.name === 'supports');
		expect(enhanced).toBeDefined();
		expect((enhanced!.parent as postcss.AtRule).params).toContain('color-mix');
		expect(enhanced!.selectors).toContain(`${selector}:hover`);
		const declarations = enhanced!.nodes.filter(node => node.type === 'decl');
		expect(declarations.map(node => node.prop)).toEqual(['color']);
		expect(declarations[0].value).toBe(`color-mix(in srgb, var(--vc-button-color-primary-light, var(--vc-color-primary-light)) 30%, ${surface})`);
	});
});

describe('Button semantic solid styles', () => {
	it.each(['success', 'error', 'warning'])('%s: outlines the ordinary state and mirrors the primary disabled treatment', (type) => {
		const color = (suffix = '') => `var(--vc-button-color-${type}${suffix}, var(--vc-color-${type}${suffix}))`;
		const find = (target: string, guarded = false) => {
			let found: postcss.Rule | undefined;
			css.walkRules((rule) => {
				if (rule.selectors.includes(target) && (rule.parent?.type === 'atrule') === guarded) found = rule;
			});
			expect(found).toBeDefined();
			return Object.fromEntries(found!.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
		};

		expect(find(`.vc-button.is-${type}.is-solid`)).toMatchObject({ 'color': color(), 'background-color': surface });
		expect(find(`.vc-button.is-${type}.is-solid:hover`)).toMatchObject({ 'color': color('-light'), 'border-color': color('-light') });

		const disabled = `.vc-button.is-disabled.is-${type}.is-solid`;
		expect(find(disabled)).toMatchObject({ 'color': color('-light'), 'background-color': surface, 'border-color': 'currentcolor' });
		expect(find(`${disabled}:hover`, true)).toEqual({ color: `color-mix(in srgb, ${color('-light')} 30%, ${surface})` });
	});
});
