// @vitest-environment jsdom

import {
	Descriptions,
	DescriptionsItem,
	DescriptionsGroup,
	MDescriptions,
	MDescriptionsItem,
	MDescriptionsGroup,
	FilePreview,
	Clipboard,
	MClipboard,
	Popover
} from '@deot/vc-components';
import { VcInstance } from '../../vc';
import { mount } from '@vue/test-utils';
import { h, ref, nextTick, defineComponent } from 'vue';

const data = { code: 'NO-1', name: '条目 1', nested: { value: 0 }, list: ['A', 'B'], empty: '' };

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
const triggerResize = async (els: Element[]) => {
	els.forEach(el => observerOf(el).trigger(el));
	await nextTick();
};

const items = (wrapper: any) => wrapper.findAll('.vc-descriptions__item');
const labels = (wrapper: any) => items(wrapper).map((item: any) => item.find('.vc-descriptions__label').text());
const values = (wrapper: any) => items(wrapper).map((item: any) => item.find('.vc-descriptions__value').text());
const columns = (wrapper: any) => items(wrapper).map((item: any) => (item.element as HTMLElement).style.gridColumn);

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Descriptions).toBe('object');
		expect(typeof MDescriptions).toBe('object');
		expect(MDescriptionsItem).toBe(DescriptionsItem);
		expect(MDescriptionsGroup).toBe(DescriptionsGroup);
		// 只用来声明，单独使用时不渲染
		expect(mount(DescriptionsItem).html()).toBe('');
		expect(mount(DescriptionsGroup).html()).toBe('');
	});

	it('create: 默认fill / medium / left, 24格', () => {
		const wrapper = mount(() => (<Descriptions options={[{ label: '编号', prop: 'code' }]} data={data} />));

		expect(wrapper.classes()).toEqual(['vc-descriptions', 'is-fill', 'is-medium', 'is-left']);
		expect(wrapper.find('.vc-descriptions__header').exists()).toBe(false);
		expect((wrapper.find('dl').element as HTMLElement).style.gridTemplateColumns).toBe('repeat(24, minmax(0, 1fr))');
		expect(wrapper.find('dl > div > dt').exists()).toBe(true);
		expect(wrapper.find('dl > div > dd').exists()).toBe(true);
	});

	it('theme / size / labelPosition / inline', () => {
		const wrapper = mount(() => (<Descriptions theme="border" size="mini" labelPosition="top" inline />));
		expect(wrapper.classes()).toEqual(['vc-descriptions', 'is-border', 'is-mini', 'is-top', 'is-inline']);
		expect(mount(() => (<Descriptions theme="inverted" />)).classes()).toContain('is-inverted');
	});

	it('prop路径取值, value优先, 0不算空, 数组用逗号连接, 空值显示placeholder', () => {
		const wrapper = mount(() => (
			<Descriptions
				data={data}
				options={[
					{ label: 'a', prop: 'nested.value' },
					{ label: 'b', prop: 'list' },
					{ label: 'c', prop: 'empty' },
					{ label: 'd', prop: 'missing.path' },
					{ label: 'e', prop: 'code', value: '显式' },
					{ label: 'f', value: [] }
				]}
			/>
		));

		expect(values(wrapper)).toEqual(['0', 'A,B', '-', '-', '显式', '-']);
	});

	it('placeholder / prefix / suffix', () => {
		const wrapper = mount(() => (
			<Descriptions
				placeholder="暂无"
				data={data}
				options={[
					{ label: 'a', prop: 'nested.value', prefix: '约 ', suffix: ' 项' },
					{ label: 'b', prop: 'empty', suffix: ' 项' }
				]}
			/>
		));

		expect(values(wrapper)).toEqual(['约 0 项', '暂无']);
	});

	it('colon: 默认显示, top / border / false 时不显示, 字符串可自定义', () => {
		const render = (attrs: any) => mount(() => (<Descriptions {...attrs} options={[{ label: '名称' }]} />));

		expect(render({}).find('.vc-descriptions__colon').text()).toBe(':');
		expect(render({ colon: '：' }).find('.vc-descriptions__colon').text()).toBe('：');
		expect(render({ colon: false }).find('.vc-descriptions__colon').exists()).toBe(false);
		expect(render({ labelPosition: 'top' }).find('.vc-descriptions__colon').exists()).toBe(false);
		expect(render({ theme: 'border' }).find('.vc-descriptions__colon').exists()).toBe(false);

		// 没有标签时不显示
		expect(mount(() => (<Descriptions options={[{ prop: 'a' }]} />)).find('.vc-descriptions__colon').exists()).toBe(false);
	});

	it('labelWidth: left / right 时写在标签上', () => {
		const wrapper = mount(() => (<Descriptions labelWidth={96} options={[{ label: '名称' }]} />));
		expect((wrapper.find('dt').element as HTMLElement).style.width).toBe('96px');

		const top = mount(() => (<Descriptions labelWidth={96} labelPosition="top" options={[{ label: '名称' }]} />));
		expect((top.find('dt').element as HTMLElement).style.width).toBe('');
	});

	it('span: 默认为轨道数的1/3, 每行最后一项补满; 单项span覆盖', () => {
		const options = [{ label: 'a' }, { label: 'b', span: 12 }, { label: 'c' }, { label: 'd', span: 24 }];
		const wrapper = mount(() => (<Descriptions options={options} />));

		expect(columns(wrapper)).toEqual(['1 / span 8', '9 / span 16', '1 / span 24', '1 / span 24']);

		const three = mount(() => (<Descriptions columns={3} options={[{ label: 'a' }, { label: 'b' }]} />));
		expect(columns(three)).toEqual(['1 / span 1', '2 / span 2']);

		const span = mount(() => (<Descriptions span={12} options={[{ label: 'a' }, { label: 'b' }, { label: 'c' }]} />));
		expect(columns(span)).toEqual(['1 / span 12', '13 / span 12', '1 / span 24']);
	});

	it('is-last-column / is-last-row', () => {
		const wrapper = mount(() => (<Descriptions options={[{ label: 'a' }, { label: 'b' }, { label: 'c' }, { label: 'd' }]} />));
		expect(items(wrapper).map((item: any) => [item.classes('is-last-column'), item.classes('is-last-row')])).toEqual([
			[false, false], [false, false], [true, false], [true, true]
		]);
	});

	it('getSpan: 参数为当前项, colspan覆盖span, rowspan跨行, 0隐藏', () => {
		const getSpan = vi.fn(({ row }: any) => {
			if (row.prop === 'a') return [2, 8];
			if (row.prop === 'b') return { colspan: 0 };
		});
		const wrapper = mount(() => (
			<Descriptions
				getSpan={getSpan}
				data={{ a: 1 }}
				options={['a', 'b', 'c', 'd', 'e'].map(key => ({ label: key, prop: key }))}
			/>
		));

		// e 跳过第2行被 a 占用的格子，并补满本行
		expect(labels(wrapper)).toEqual(['a:', 'c:', 'd:', 'e:']);
		const rows = items(wrapper).map((item: any) => (item.element as HTMLElement).style.gridRow);
		expect(rows).toEqual(['1 / span 2', '1 / span 1', '1 / span 1', '2 / span 1']);
		expect(columns(wrapper)).toEqual(['1 / span 8', '9 / span 8', '17 / span 8', '9 / span 16']);
		expect(getSpan.mock.calls[0][0]).toMatchObject({ value: 1, index: 0, data: { a: 1 }, row: { prop: 'a', type: 'text', span: 8 } });
	});

	it('hidden: 不渲染也不占位, 下标仍按options计算', () => {
		const getSpan = vi.fn();
		const wrapper = mount(() => (
			<Descriptions getSpan={getSpan} options={[{ label: 'a', hidden: true }, { label: 'b' }]} />
		));

		expect(labels(wrapper)).toEqual(['b:']);
		expect(getSpan.mock.calls.map(([context]: any) => context.index)).toEqual([1]);
	});

	it('子组件写法: kebab-case属性, 布尔hidden, 插槽', () => {
		const wrapper = mount({
			components: { Descriptions, DescriptionsItem },
			data: () => ({ data }),
			template: `
				<Descriptions :data="data">
					<DescriptionsItem label="编号" prop="code" label-class="x" content-style="color: red;" />
					<DescriptionsItem label="隐藏" hidden />
					<template v-for="i in 2" :key="i">
						<DescriptionsItem :label="'项' + i" :value="i" />
					</template>
					<DescriptionsItem prop="name">
						<template #label="{ row }">自定义{{ row.prop }}</template>
						<template #default="{ value, index }">{{ value }}-{{ index }}</template>
					</DescriptionsItem>
					<div class="other" />
				</Descriptions>
			`
		});

		expect(labels(wrapper)).toEqual(['编号:', '项1:', '项2:', '自定义name:']);
		expect(values(wrapper)).toEqual(['NO-1', '1', '2', '条目 1-4']);
		expect(wrapper.find('dt').classes()).toContain('x');
		expect((wrapper.find('dd').element as HTMLElement).style.color).toBe('red');
		expect(wrapper.find('.other').exists()).toBe(false);
	});

	it('JSX子组件: 默认插槽为数组', () => {
		const wrapper = mount(() => (
			<Descriptions>
				<DescriptionsItem label="a">内容</DescriptionsItem>
			</Descriptions>
		));
		expect(values(wrapper)).toEqual(['内容']);
	});

	it('函数形式的value与Descriptions的label / value插槽', () => {
		const render = vi.fn(({ value, row, index }: any) => h('b', `${row.label}-${value}-${index}`));
		const wrapper = mount(() => (
			<Descriptions data={data} options={[{ label: 'a', prop: 'code', value: render }]} />
		));
		expect(wrapper.find('dd b').text()).toBe('a-NO-1-0');

		const slotted = mount(() => (
			<Descriptions data={data} options={[{ label: 'a', prop: 'code' }, { label: 'b', prop: 'name' }]}>
				{{
					label: ({ row }: any) => `L${row.label}`,
					value: ({ value, index }: any) => `${index}:${value}`
				}}
			</Descriptions>
		));
		expect(labels(slotted)).toEqual(['La:', 'Lb:']);
		expect(values(slotted)).toEqual(['0:NO-1', '1:条目 1']);
	});

	it('class / style / labelClass / contentClass: Descriptions与单项都生效', () => {
		const wrapper = mount(() => (
			<Descriptions
				labelClass="l"
				contentClass="c"
				labelStyle={{ color: 'red' }}
				options={[{ label: 'a', class: 'item', style: { color: 'blue' }, labelClass: 'l2', contentStyle: 'color: green;' }]}
			/>
		));
		const item = items(wrapper)[0];
		expect(item.classes()).toContain('item');
		expect((item.element as HTMLElement).style.color).toBe('blue');
		expect(item.find('dt').classes()).toEqual(expect.arrayContaining(['l', 'l2']));
		expect((item.find('dt').element as HTMLElement).style.color).toBe('red');
		expect(item.find('dd').classes()).toContain('c');
		expect((item.find('dd').element as HTMLElement).style.color).toBe('green');
	});

	it('分组: options中的{ label, children}与DescriptionsGroup, 连续的项合成一组', () => {
		const wrapper = mount(() => (
			<Descriptions
				options={[
					{ label: 'a' },
					{ label: '分组一', children: [{ label: 'b' }, { label: 'c' }] },
					{ label: 'd' }
				]}
			>
				<DescriptionsGroup label="分组二">
					<DescriptionsItem label="e" />
				</DescriptionsGroup>
				<DescriptionsItem label="f" />
			</Descriptions>
		));
		const groups = wrapper.findAll('.vc-descriptions__group');

		expect(groups.map(group => group.find('.vc-descriptions__group-label').exists() ? group.find('.vc-descriptions__group-label').text() : ''))
			.toEqual(['', '分组一', '', '分组二', '']);
		expect(groups.map(group => labels(group).join(''))).toEqual(['a:', 'b:c:', 'd:', 'e:', 'f:']);
	});

	it('标题: title / #title / #extra', () => {
		const wrapper = mount(() => (
			<Descriptions title="标题">
				{{ extra: () => h('button', '编辑') }}
			</Descriptions>
		));
		expect(wrapper.find('.vc-descriptions__title').text()).toBe('标题');
		expect(wrapper.find('.vc-descriptions__extra button').exists()).toBe(true);

		const slotted = mount(() => (<Descriptions>{{ title: () => '插槽标题' }}</Descriptions>));
		expect(slotted.find('.vc-descriptions__title').text()).toBe('插槽标题');
	});

	it('tooltip: 标签后显示图标, 悬停时打开Popover, 函数参数为当前项', async () => {
		const open = vi.spyOn(Popover, 'open').mockImplementation(() => ({}) as any);
		const tooltip = vi.fn(() => '说明');
		const wrapper = mount(() => (
			<Descriptions data={data} options={[{ label: 'a', prop: 'code', tooltip }, { label: 'b' }]} />
		));

		expect(wrapper.findAll('.vc-descriptions__tooltip')).toHaveLength(1);
		await wrapper.find('.vc-descriptions__tooltip').trigger('mouseenter');
		const options = open.mock.calls[0][0] as any;
		expect(options).toMatchObject({ hover: true, theme: 'dark', placement: 'top', autoWidth: false });
		expect(options.content()).toBe('说明');
		expect((tooltip.mock.calls[0] as any)[0]).toMatchObject({ value: 'NO-1', index: 0, row: { label: 'a' } });
		open.mockRestore();
	});

	it('labelWidth: auto, 同一列取最宽, 内容尺寸变化时更新, top时不生效', async () => {
		// 宽度按文字长度模拟，带小数时向上取整
		const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			return { width: this.textContent!.length * 10 + 0.4 } as DOMRect;
		});
		const contents = () => wrapper.findAll('.vc-descriptions__label-content').map(item => item.element);
		const list = ref<any[]>([{ label: 'a' }, { label: 'bbb' }, { label: 'cc' }, { label: 'dddd' }]);
		const position = ref<any>('left');
		const wrapper = mount(() => (
			<Descriptions labelWidth="auto" labelPosition={position.value} columns={2} span={1} options={list.value} />
		));
		const widths = () => wrapper.findAll('.vc-descriptions__label').map(item => (item.element as HTMLElement).style.width);
		// 尺寸回调之前按内容排版
		expect(widths()).toEqual(['', '', '', '']);
		await triggerResize(contents());
		// 含冒号：a: / cc: 在第1列，bbb: / dddd: 在第2列
		expect(widths()).toEqual(['31px', '51px', '31px', '51px']);

		list.value = [{ label: 'a' }, { label: 'longlabel' }];
		await nextTick();
		await triggerResize(contents());
		expect(widths()).toEqual(['21px', '101px']);

		position.value = 'top';
		await nextTick();
		expect(widths()).toEqual(['', '']);
		expect(contents()).toHaveLength(0);
		rect.mockRestore();
	});

	it('MDescriptions: copy类型使用MClipboard', () => {
		const options = [{ value: 'NO-1', type: 'copy' }];
		expect(mount(() => (<MDescriptions options={options} />)).findComponent(MClipboard).exists()).toBe(true);
		expect(mount(() => (<Descriptions options={options} />)).findComponent(Clipboard).exists()).toBe(true);
	});

	it('响应式: columns / span 按容器宽度取值', async () => {
		const wrapper = mount(() => (
			<Descriptions columns={{ xs: 1, md: 24 }} span={{ md: 12 }} options={[{ label: 'a' }, { label: 'b' }]} />
		), { attachTo: document.body });
		const el = wrapper.element as HTMLElement;

		expect(columns(wrapper)).toEqual(['1 / span 1', '1 / span 1']);

		el.getBoundingClientRect = () => ({ width: 800 } as DOMRect);
		await triggerResize([el]);
		expect(columns(wrapper)).toEqual(['1 / span 12', '13 / span 12']);
		wrapper.unmount();
	});

	describe('type', () => {
		afterEach(() => {
			VcInstance.options.Descriptions = { renderValue: undefined };
		});

		const mountType = (row: any, value: any) => mount(() => (<Descriptions options={[{ label: 'a', value, ...row }]} />));

		it('text: 数组连接, options.line用Text截断, 未知type按text', () => {
			expect(mountType({ type: 'text' }, ['A', 'B']).find('.vc-descriptions__value').text()).toBe('A,B');
			expect(mountType({ type: 'unknown' }, 1).find('.vc-descriptions__value').text()).toBe('1');
			const wrapper = mountType({ options: { line: 2, class: 'x' } }, 'abc');
			expect(wrapper.find('.vc-text').exists()).toBe(true);
			expect(wrapper.find('.vc-text').classes()).toContain('x');
		});

		it('image: 小图, 点击用FilePreview预览全部, 空数据显示placeholder', async () => {
			const open = vi.spyOn(FilePreview, 'open').mockImplementation(() => undefined as any);
			const wrapper = mountType({ type: 'image', options: { size: [30, 20] } }, ['a.png', { src: 'b' }, { url: 'c', type: 'video' }]);
			const images = wrapper.findAll('.vc-descriptions__image');

			expect(images).toHaveLength(3);
			expect((images[0].element as HTMLElement).style.width).toBe('30px');
			expect((images[0].element as HTMLElement).style.height).toBe('20px');

			await images[1].trigger('click');
			const options = open.mock.calls[0][0] as any;
			expect(options.current).toBe(1);
			expect(options.data.map((item: any) => [item.source, item.type])).toEqual([['a.png', 'image'], ['b', 'image'], ['c', 'video']]);
			expect(options.data[2].element).toBe(images[2].element);
			open.mockRestore();

			expect(mountType({ type: 'image' }, ' , ').find('.vc-descriptions__value').text()).toBe('-');
			expect(mountType({ type: 'image', options: { previewable: false } }, 'a.png').find('.is-previewable').exists()).toBe(false);
		});

		it('file: FilePreview, size跟随Descriptions, options透传', () => {
			const wrapper = mount(() => (
				<Descriptions size="small" options={[{ value: 'a.pdf', type: 'file', options: { type: 'group' } }]} />
			));
			const preview = wrapper.findComponent(FilePreview);
			expect(preview.props()).toMatchObject({ size: 'small', type: 'group', data: 'a.pdf' });
		});

		it('link: 新窗口打开, 不放行脚本协议', () => {
			const link = mountType({ type: 'link' }, 'https://example.com').find('a');
			expect(link.attributes()).toMatchObject({ href: 'https://example.com/', target: '_blank', rel: 'noopener noreferrer' });
			expect(link.find('.vc-text').exists()).toBe(true);
			expect(mountType({ type: 'link' }, 'mailto:a@example.com').find('a').attributes('href')).toBe('mailto:a@example.com');
			// 协议白名单：脚本协议（含夹带空白的写法）不生成链接
			expect(mountType({ type: 'link' }, 'javascript:alert(1)').find('a').attributes('href')).toBeUndefined();
			expect(mountType({ type: 'link' }, 'java\tscript:alert(1)').find('a').attributes('href')).toBeUndefined();
		});

		it('copy: 文本 + 复制图标', () => {
			const wrapper = mountType({ type: 'copy' }, 'NO-1');
			expect(wrapper.find('.vc-descriptions__copy .vc-text').exists()).toBe(true);
			expect(wrapper.find('.vc-descriptions__copy-icon.vc-clipboard').exists()).toBe(true);
		});

		it('select: 数组或对象映射label, 没有对应项时显示原值', () => {
			const list = [{ label: '类型 A', value: 1 }, { label: '类型 B', value: 2 }];
			expect(mountType({ type: 'select', options: { data: list } }, [1, 2, 3]).find('.vc-descriptions__value').text()).toBe('类型 A,类型 B,3');
			expect(mountType({ type: 'select', options: { data: { a: '类型 A' } } }, 'a').find('.vc-descriptions__value').text()).toBe('类型 A');
			expect(mountType({ type: 'select', options: { data: list } }, 0).find('.vc-descriptions__value').text()).toBe('0');
		});

		it('全局renderValue: 返回VNode时使用, 返回空值时用内置; 插槽与函数优先; 空值不调用', () => {
			const renderValue = vi.fn(({ value, row }: any) => (row.type === 'price' ? h('b', `¥${value}`) : null));
			VcInstance.options.Descriptions = { renderValue };
			const wrapper = mount(() => (
				<Descriptions
					data={{ amount: 10 }}
					options={[
						{ label: 'a', prop: 'amount', type: 'price', suffix: ' 元' },
						{ label: 'b', value: ['A', 'B'] },
						{ label: 'c', value: () => 'fn', type: 'price' },
						{ label: 'd', value: '', type: 'price' }
					]}
				/>
			));

			expect(values(wrapper)).toEqual(['¥10 元', 'A,B', 'fn', '-']);
			expect(renderValue).toHaveBeenCalledTimes(2);
			expect(renderValue.mock.calls[0][0]).toMatchObject({ value: 10, index: 0, data: { amount: 10 }, row: { type: 'price' } });
			expect((renderValue.mock.calls[0][0] as any).instance).toBeTruthy();
		});
	});

	it('数据变化时更新', async () => {
		const current = ref<any>({ code: 'a' });
		const Wrapper = defineComponent(() => () => (<Descriptions data={current.value} options={[{ label: 'x', prop: 'code' }]} />));
		const wrapper = mount(Wrapper);

		current.value = { code: 'b' };
		await nextTick();
		expect(values(wrapper)).toEqual(['b']);
	});
});
