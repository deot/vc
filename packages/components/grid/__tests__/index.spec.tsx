// @vitest-environment jsdom

import { Grid, GridItem, MGrid, MGridItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';

const items = (wrapper: any) => wrapper.findAll('.vc-grid > .vc-grid-item');
const positions = (wrapper: any) => items(wrapper).map((item: any) => {
	const { style } = item.element as HTMLElement;
	return style.display === 'none' ? null : `${style.gridRow} | ${style.gridColumn}`;
});

// 记录所有 ResizeObserver 实例：按被观察的元素找到对应的观察器再触发回调
const observers: any[] = [];
const MockResizeObserver = (globalThis as any).ResizeObserver;
(globalThis as any).ResizeObserver = class extends MockResizeObserver {
	constructor(cb: any) {
		super(cb);
		observers.push(this);
	}
};
const observerOf = (el: Element) => observers.find(ro => ro.targets.has(el));

const resize = async (el: HTMLElement, width: number) => {
	el.getBoundingClientRect = () => ({ width } as DOMRect);
	observerOf(el).trigger(el);
	await nextTick();
};

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Grid).toBe('object');
		expect(typeof GridItem).toBe('object');
		expect(MGrid).toBe(Grid);
		expect(MGridItem).toBe(GridItem);
	});

	it('create: 默认24列, 无间距', () => {
		const wrapper = mount(() => (<Grid />));
		const { style } = wrapper.element as HTMLElement;

		expect(wrapper.classes()).toEqual(['vc-grid']);
		expect(style.gridTemplateColumns).toBe('repeat(24, minmax(0, 1fr))');
		expect(style.gap).toBe('0px 0px');
	});

	it('tag', () => {
		const wrapper = mount(() => (<Grid tag="section" />));
		expect(wrapper.element.tagName).toBe('SECTION');
	});

	it('columns: 轨道模板, span按轨道数计算', () => {
		const wrapper = mount(() => (
			<Grid columns={[100, '1fr', 'auto']}>
				<GridItem span={1} />
				<GridItem span={2} />
				<GridItem span={3} />
			</Grid>
		));

		expect((wrapper.element as HTMLElement).style.gridTemplateColumns).toBe('100px 1fr auto');
		expect(positions(wrapper)).toEqual(['1 / span 1 | 1 / span 1', '1 / span 1 | 2 / span 2', '2 / span 1 | 1 / span 3']);
	});

	it('span默认24: 任何columns下都是整行', () => {
		const wrapper = mount(() => (
			<Grid columns={3}>
				<GridItem />
				<GridItem />
			</Grid>
		));
		expect(positions(wrapper)).toEqual(['1 / span 1 | 1 / span 3', '2 / span 1 | 1 / span 3']);
	});

	it('gap: [水平, 垂直]', () => {
		const wrapper = mount(() => (<Grid gap={[16, 8]} />));
		expect((wrapper.element as HTMLElement).style.gap).toBe('8px 16px');
	});

	it('justify / align / justifyContent', () => {
		const wrapper = mount(() => (
			<Grid justify="center" align="end" justifyContent="space-between">
				<GridItem justify="start" align="baseline" />
			</Grid>
		));

		expect(wrapper.classes()).toEqual(['vc-grid', 'is-justify-center', 'is-align-end', 'is-justify-content-space-between']);
		expect(items(wrapper)[0].classes()).toEqual(['vc-grid-item', 'is-justify-start', 'is-align-baseline']);
	});

	it('span / offset / auto, 并保留GridItem自身的class与style', () => {
		const wrapper = mount(() => (
			<Grid>
				<GridItem span={8} class="a" style="color: red;" />
				<GridItem span={8} offset={8} />
				<GridItem span={6} />
				<GridItem span="auto" />
			</Grid>
		));

		expect(positions(wrapper)).toEqual([
			'1 / span 1 | 1 / span 8',
			'1 / span 1 | 17 / span 8',
			'2 / span 1 | 1 / span 6',
			'2 / span 1 | 7 / span 18'
		]);
		expect(items(wrapper)[0].classes()).toContain('a');
		expect((items(wrapper)[0].element as HTMLElement).style.color).toBe('red');
	});

	it('v-for / template 展开, 忽略非GridItem', () => {
		const list = [1, 2, 3];
		const wrapper = mount(() => (
			<Grid columns={3}>
				{ list.map(i => (<GridItem key={i}>{ i }</GridItem>)) }
				<div class="other" />
			</Grid>
		));

		expect(items(wrapper).map((item: any) => item.text())).toEqual(['1', '2', '3']);
		expect(wrapper.find('.other').exists()).toBe(false);
	});

	it('getSpan: 返回值覆盖span, rowspan跨行, 0隐藏', () => {
		const getSpan = vi.fn(({ index }: any) => {
			if (index === 0) return [2, 6];
			if (index === 1) return { colspan: 0 };
		});
		const wrapper = mount(() => (
			<Grid getSpan={getSpan}>
				<GridItem span={12} />
				<GridItem span={12} />
				<GridItem span={18} />
				<GridItem span={18} />
			</Grid>
		));

		expect(positions(wrapper)).toEqual(['1 / span 2 | 1 / span 6', null, '1 / span 1 | 7 / span 18', '2 / span 1 | 7 / span 18']);
		expect(getSpan.mock.calls[0][0]).toEqual({ row: { span: 12, offset: 0, suffix: false }, index: 0 });
	});

	it('collapsed: suffix始终显示在末尾, 插槽拿到overflow', async () => {
		const collapsed = ref(true);
		const wrapper = mount(() => (
			<Grid collapsed={collapsed.value} columns={3}>
				<GridItem span={1}>A</GridItem>
				<GridItem span={1}>B</GridItem>
				<GridItem span={1}>C</GridItem>
				<GridItem span={1} suffix>
					{{ default: ({ overflow }: any) => (overflow ? '展开' : '收起') }}
				</GridItem>
			</Grid>
		));
		await nextTick();

		expect(positions(wrapper)).toEqual(['1 / span 1 | 1 / span 1', '1 / span 1 | 2 / span 1', null, '1 / span 1 | 3 / span 1']);
		expect(items(wrapper)[3].text()).toBe('展开');

		collapsed.value = false;
		await nextTick();
		expect(positions(wrapper)).toEqual([
			'1 / span 1 | 1 / span 1',
			'1 / span 1 | 2 / span 1',
			'1 / span 1 | 3 / span 1',
			'2 / span 1 | 3 / span 1'
		]);
		expect(items(wrapper)[3].text()).toBe('收起');
	});

	it('Grid重新渲染时, 位置不变的GridItem不更新', async () => {
		const gap = ref(0);
		const first = ref(6);
		const renders = vi.fn();
		const wrapper = mount(() => (
			<Grid gap={gap.value}>
				{/* 同模板编译出的插槽：稳定，不因父级重新渲染而更新 */}
				<GridItem span={first.value}>{{ default: () => (renders(0), 'a'), $stable: true }}</GridItem>
				<GridItem span={6}>{{ default: () => (renders(1), 'b'), $stable: true }}</GridItem>
			</Grid>
		));
		expect(renders).toHaveBeenCalledTimes(2);

		gap.value = 8;
		await nextTick();
		expect((wrapper.element as HTMLElement).style.gap).toBe('8px 8px');
		expect(renders).toHaveBeenCalledTimes(2);

		// 第1项变宽：第2项位置也变了，两项都更新
		first.value = 12;
		await nextTick();
		expect(positions(wrapper)).toEqual(['1 / span 1 | 1 / span 12', '1 / span 1 | 13 / span 6']);
		expect(renders).toHaveBeenCalledTimes(4);
	});

	it('响应式: 按容器宽度取值, 只有使用响应式对象时才监听', async () => {
		const wrapper = mount(() => (
			<Grid columns={{ xs: 1, md: [160, '1fr'] }} gap={{ xs: 4, lg: 16 }}>
				<GridItem span={{ xs: 1, md: 2 }} />
			</Grid>
		), { attachTo: document.body });
		const el = wrapper.element as HTMLElement;

		expect(el.style.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
		expect(positions(wrapper)).toEqual(['1 / span 1 | 1 / span 1']);

		await resize(el, 800);
		expect(el.style.gridTemplateColumns).toBe('160px 1fr');
		expect(el.style.gap).toBe('4px 4px');
		expect(positions(wrapper)).toEqual(['1 / span 1 | 1 / span 2']);

		await resize(el, 1000);
		expect(el.style.gap).toBe('16px 16px');

		wrapper.unmount();
		expect(observerOf(el)).toBeUndefined();

		const plain = mount(() => (<Grid columns={3} />), { attachTo: document.body });
		expect(observerOf(plain.element)).toBeUndefined();
		plain.unmount();
	});
});
