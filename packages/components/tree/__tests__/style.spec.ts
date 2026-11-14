// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const compile = (path: string) => postcss.parse(sass.compile(new URL(path, import.meta.url).pathname).css);

const declsFor = (css: postcss.Root, selector: string, property: string) => {
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

const rem = (n: number) => `calc(var(--vc-rem) * ${n})`;
const local = (key: string, value: string) => `var(--vc-tree-${key}, ${value})`;

// 两端共用同一份规则：尺寸写成局部变量 --vc-tree-<键>，桌面端的默认值为 px，MTree 在 .vcm-tree 上覆盖为 750 稿（随 --vc-rem 缩放）
describe('Tree styles', () => {
	const css = compile('../tree.scss');
	const decls = (selector: string, property: string) => declsFor(css, selector, property);

	it('尺寸为局部变量，默认值为桌面端的 px', () => {
		expect(decls('.vc-tree', 'font-size')).toEqual([local('font-size', '12px')]);
		expect(decls('.vc-tree-node__content', 'height')).toEqual([local('row-height', '26px')]);
		expect(decls('.vc-tree-node__content > .vc-tree-node__expand-icon', 'padding')).toEqual([local('icon-padding', '6px')]);
		expect(decls('.vc-tree-node__content > .vc-checkbox', 'padding')).toEqual([`0 ${local('checkbox-gap', '8px')} 0 0`]);
		expect(decls('.vc-tree-node__expand-icon', 'font-size')).toEqual([local('icon-size', '12px')]);
		expect(decls('.vc-tree-node__loading-icon', 'margin-right')).toEqual([local('loading-gap', '8px')]);
		expect(decls('.vc-tree__empty-block', 'min-height')).toEqual([local('empty-height', '60px')]);
		expect(decls('.vc-tree-node:focus > .vc-tree-node__content', 'background-color')[0]).toContain('--vc-tree-focus-background');
	});

	it('悬停只在可悬停的设备上生效', () => {
		const hovers: string[] = [];
		css.walkRules(/:hover/, (rule) => {
			const parent = rule.parent as postcss.AtRule;
			hovers.push(parent.type === 'atrule' ? `${parent.name} ${parent.params}` : 'root');
		});
		expect(hovers).toEqual(['media (hover: hover)', 'media (hover: hover)']);
	});
});

describe('MTree styles', () => {
	const css = compile('../mobile/style.scss');
	const vars = (property: string) => declsFor(css, '.vcm-tree', property);

	it('在 .vcm-tree 上覆盖尺寸的局部变量（750 稿）', () => {
		expect(vars('--vc-tree-font-size')).toEqual([rem(28)]);
		expect(vars('--vc-tree-row-height')).toEqual([rem(88)]);
		expect(vars('--vc-tree-icon-size')).toEqual([rem(24)]);
		expect(vars('--vc-tree-icon-padding')).toEqual([`0 ${rem(16)} 0 ${rem(32)}`]);
		expect(vars('--vc-tree-checkbox-gap')).toEqual([rem(16)]);
		expect(vars('--vc-tree-loading-gap')).toEqual([rem(16)]);
		expect(vars('--vc-tree-empty-height')).toEqual([rem(240)]);
		expect(vars('--vc-tree-focus-background')).toEqual(['transparent']);
	});

	it('文字单行省略；聚焦底色只在键盘操作时显示；按下的反馈优先于当前节点的底色', () => {
		expect(declsFor(css, '.vcm-tree .vc-tree-node__label', 'text-overflow')).toEqual(['ellipsis']);
		expect(declsFor(css, '.vcm-tree .vc-tree-node:focus-visible > .vc-tree-node__content', 'background-color').length).toBe(1);
		expect(declsFor(css, '.vcm-tree.vc-tree .vc-tree-node > .vc-tree-node__content:active', 'background-color').length).toBe(1);
	});

	it('不重复桌面端的结构规则：子元素一律写桌面端类名', () => {
		css.walkRules((rule) => {
			expect(rule.selector).not.toMatch(/vcm-tree(-node)?__/);
		});
	});
});
