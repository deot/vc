// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';
import { Launch } from '@deot/dev-test';

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

describe('ButtonGroup clipped viewport layout', () => {
	const launch = new Launch();
	let page: Awaited<ReturnType<Launch['createPage']>>;

	beforeAll(async () => {
		page = await launch.createPage();
	}, 30000);

	afterAll(async () => {
		await launch.browser.close();
	});

	describe.each([
		{ vertical: false, circle: false, count: 3 },
		{ vertical: true, circle: false, count: 3 },
		{ vertical: false, circle: true, count: 3 },
		{ vertical: true, circle: true, count: 3 },
		{ vertical: false, circle: false, count: 1 },
		{ vertical: true, circle: false, count: 1 },
		{ vertical: false, circle: true, count: 1 },
		{ vertical: true, circle: true, count: 1 }
	])('vertical=$vertical circle=$circle count=$count', ({ vertical, circle, count }) => {
		it.each(['small', 'medium', 'large'] as const)('%s: contains every edge and overlaps only adjacent borders', async (size) => {
			const classes = `is-${size} ${vertical ? 'is-vertical' : ''} ${circle ? 'is-circle' : ''}`;
			const buttons = Array.from({ length: count }, () => `
				<button class="vc-button is-default is-solid is-${size} ${circle ? 'is-circle' : ''}"><span>Button</span></button>
			`).join('');
			await page.setContent(`
				<style>
					${css.toString()}
					* { box-sizing: border-box; }
					.viewport { display: flow-root; width: max-content; overflow: hidden; font-size: 0; line-height: 0; }
				</style>
				<div class="viewport"><div class="vc-button-group ${classes}">
					${buttons}
				</div></div>
			`);
			const layout = await page.evaluate(() => {
				const viewport = document.querySelector('.viewport')!;
				const group = document.querySelector('.vc-button-group')!;
				const rect = (element: Element) => element.getBoundingClientRect().toJSON();
				return {
					viewport: rect(viewport),
					group: rect(group),
					overflow: getComputedStyle(viewport).overflow,
					buttons: Array.from(group.children, (button) => {
						const style = getComputedStyle(button);
						return {
							...rect(button),
							marginLeft: style.marginLeft,
							marginTop: style.marginTop,
							radii: [
								style.borderTopLeftRadius, style.borderTopRightRadius,
								style.borderBottomRightRadius, style.borderBottomLeftRadius
							]
						};
					})
				};
			});
			const radius = circle ? { small: '24px', medium: '30px', large: '36px' }[size] : size === 'small' ? '3px' : '8px';
			expect(layout.overflow).toBe('hidden');
			expect(layout.buttons[0].left).toBe(layout.group.left);
			expect(layout.buttons[0].top).toBe(layout.group.top);
			expect(layout.group.left).toBe(layout.viewport.left);
			expect(layout.group.top).toBe(layout.viewport.top);
			layout.buttons.forEach((button, index) => {
				expect(button.marginLeft).toBe(!vertical && index > 0 ? '-1px' : '0px');
				expect(button.marginTop).toBe(vertical && index > 0 ? '-1px' : '0px');
				expect(button.left).toBeGreaterThanOrEqual(layout.viewport.left);
				expect(button.top).toBeGreaterThanOrEqual(layout.viewport.top);
				expect(button.right).toBeLessThanOrEqual(layout.viewport.right);
				expect(button.bottom).toBeLessThanOrEqual(layout.viewport.bottom);
				expect(button.height).toBe({ small: 26, medium: 32, large: 38 }[size]);
				if (index > 0) {
					const previous = layout.buttons[index - 1];
					expect(vertical ? button.top - previous.bottom : button.left - previous.right).toBe(-1);
				}
				const first = index === 0;
				const last = index === count - 1;
				expect(button.radii).toEqual([
					first ? radius : '0px',
					(vertical ? first : last) ? radius : '0px',
					last ? radius : '0px',
					(vertical ? last : first) ? radius : '0px'
				]);
			});
			await page.hover('.vc-button');
			expect(await page.$eval('.vc-button', button => getComputedStyle(button).zIndex)).toBe('2');
		});
	});
});
