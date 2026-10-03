// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const css = postcss.parse(sass.compile(new URL('../style.scss', import.meta.url).pathname).css);

const declarationsFor = (selector: string) => {
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

describe('TableFilter styles', () => {
	it('highlights only enabled single and multiple options with the shared selection surface', () => {
		expect(declarationsFor('.vc-table-filter__item:not(.is-disabled):hover')).toMatchObject({
			'background-color': 'var(--vc-table-filter-background-color-primary-light, var(--vc-background-color-primary-light))'
		});
		expect(declarationsFor('.vc-table-filter__item:hover')).not.toHaveProperty('background-color');
	});

	it('uses compact 26px multiple rows and the Tree checkbox label spacing', () => {
		expect(declarationsFor('.vc-table-filter__item')).toMatchObject({ 'font-size': '12px' });
		expect(declarationsFor('.vc-table-filter__item.vc-checkbox')).toMatchObject({
			'display': 'flex', 'padding': '3px 16px', 'line-height': '20px'
		});
		expect(declarationsFor('.vc-table-filter__item.vc-checkbox .vc-checkbox__wrapper')).toMatchObject({ 'margin-right': '8px' });
	});

	it('spaces native small buttons without overriding their size or corner radius', () => {
		expect(declarationsFor('.vc-table-filter__footer')).toMatchObject({
			'gap': '6px', 'padding': '8px', 'justify-content': 'flex-end',
			'border-top': '1px solid var(--vc-table-filter-color-neutral-light, var(--vc-color-neutral-light))'
		});
		expect(declarationsFor('.vc-table-filter__footer > .vc-button')).toEqual({});
	});
});
