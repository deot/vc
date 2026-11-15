// @vitest-environment jsdom

import { vi } from 'vitest';
import { IndexBar, MIndexBar } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

const DATA = [
	{ value: 'A', label: 'A 组', children: [{ label: 'A1' }, { label: 'A2' }] },
	{ value: 'B', children: ['B1'] },
	{ value: 'C', label: 'C 组', children: [] },
	{ value: 'D', children: [{ label: 'D1' }] }
];

const rect = (top: number, height: number, left = 0, width = 100) => () => ({
	top,
	bottom: top + height,
	height,
	left,
	right: left + width,
	width,
	x: left,
	y: top,
	toJSON: () => ({})
});

const flush = async () => {
	await nextTick();
	await nextTick();
};

/**
 * 外部滚动（window）下的几何：行容器从 100 开始，每个标题 32、每项 40，按 DATA 顺序排列；
 * 舞台位于 window 顶部（即滚过了 scrollY），侧栏列表从 0 开始、每项 20
 * @param wrapper ~
 * @param scrollY 当前滚动位置
 * @returns 各标题在行容器中的位置
 */
const layout = (wrapper: VueWrapper<any>, scrollY = 0) => {
	const content = wrapper.find('.vc-index-bar__content').element as HTMLElement;
	const titles = wrapper.findAll('.vc-index-bar__content > .vc-index-bar__title');
	const offsets: number[] = [];
	let y = 0;
	DATA.forEach((group, index) => {
		offsets.push(y);
		(titles[index].element as HTMLElement).getBoundingClientRect = rect(100 - scrollY + y, 32);
		y += 32 + (group.children.length * 40);
	});
	content.getBoundingClientRect = rect(100 - scrollY, y);
	Object.defineProperty(content, 'offsetHeight', { configurable: true, value: y });
	const stageTop = Math.max(0, 100 - scrollY);
	(wrapper.find('.vc-index-bar__stage').element as HTMLElement).getBoundingClientRect = rect(stageTop, 0);
	(wrapper.find('.vc-index-bar__sidebar').element as HTMLElement).getBoundingClientRect = rect(stageTop, 400);
	(wrapper.find('.vc-index-bar__sidebar-list').element as HTMLElement).getBoundingClientRect = rect(0, DATA.length * 20, 80, 20);
	return offsets;
};

describe('index-bar', () => {
	// jsdom 会记住写入的 scrollTop：每个用例从顶部开始
	beforeEach(() => {
		document.documentElement.scrollTop = 0;
	});

	it('flattens groups into title and item rows; default labels and value fallback', async () => {
		const wrapper = mount(IndexBar, { props: { data: DATA }, attachTo: document.body });
		await flush();
		const titles = wrapper.findAll('.vc-index-bar__content > .vc-index-bar__title');
		expect(titles.map(it => it.text())).toEqual(['A 组', 'B', 'C 组', 'D']);
		expect(wrapper.findAll('.vc-index-bar__item').map(it => it.text())).toEqual(['A1', 'A2', 'B1', 'D1']);
		expect(wrapper.findAll('.vc-index-bar__sidebar-item').map(it => it.text())).toEqual(['A', 'B', 'C', 'D']);
		expect(wrapper.find('.vc-index-bar__sidebar-item.is-active').text()).toBe('A');
		wrapper.unmount();
	});

	it('slots: default / title / sidebar / tip', async () => {
		const wrapper = mount(IndexBar, {
			props: { data: DATA },
			slots: {
				default: ({ row, group, index }: any) => <i class="row">{`${group.value}:${index}:${row.label ?? row}`}</i>,
				title: ({ group }: any) => <b>{`#${group.value}`}</b>,
				sidebar: ({ group, active }: any) => <span>{`${group.value}${active ? '*' : ''}`}</span>
			},
			attachTo: document.body
		});
		await flush();
		expect(wrapper.findAll('.row').map(it => it.text())).toEqual(['A:0:A1', 'A:1:A2', 'B:0:B1', 'D:0:D1']);
		// 默认插槽不套默认的项容器
		expect(wrapper.find('.vc-index-bar__item').exists()).toBe(false);
		expect(wrapper.find('.vc-index-bar__content > .vc-index-bar__title').text()).toBe('#A');
		expect(wrapper.find('.vc-index-bar__sticky').text()).toBe('#A');
		expect(wrapper.findAll('.vc-index-bar__sidebar-item').map(it => it.text())).toEqual(['A*', 'B', 'C', 'D']);
		wrapper.unmount();
	});

	it('scroll modes follow Table: height → RecycleList, maxHeight → Scroller, none → external', async () => {
		const height = mount(IndexBar, { props: { data: DATA, height: 300 }, attachTo: document.body });
		await flush();
		expect(height.classes()).toContain('is-scrollable');
		expect(height.element.getAttribute('style')).toContain('height: 300px');
		expect(height.find('.vc-recycle-list').classes()).not.toContain('is-external');
		// 舞台在列表内部的滚动内容里
		expect(height.find('.vc-recycle-list .vc-index-bar__stage').exists()).toBe(true);
		height.unmount();

		const max = mount(IndexBar, { props: { data: DATA, maxHeight: 300 }, attachTo: document.body });
		await flush();
		expect(max.find('.vc-recycle-list').exists()).toBe(false);
		expect(max.find('.vc-index-bar__scroller .vc-index-bar__stage').exists()).toBe(true);
		max.unmount();

		const external = mount(IndexBar, { props: { data: DATA }, attachTo: document.body });
		await flush();
		expect(external.classes()).not.toContain('is-scrollable');
		expect((external.element.firstElementChild as HTMLElement).classList.contains('vc-affix')).toBe(true);
		expect(external.find('.vc-scroller').exists()).toBe(false);
		external.unmount();

		const virtualized = mount(IndexBar, { props: { data: DATA, virtualized: true }, attachTo: document.body });
		await flush();
		expect(virtualized.find('.vc-recycle-list').classes()).toContain('is-external');
		expect(virtualized.find('.vc-recycle-list .vc-index-bar__stage').exists()).toBe(false);
		virtualized.unmount();
	});

	it('the stage is a sticky Affix; offset is passed through', async () => {
		const wrapper = mount(IndexBar, { props: { data: DATA, offset: 48 }, attachTo: document.body });
		await flush();
		const affix = wrapper.find('.vc-affix');
		expect(affix.classes()).toContain('is-sticky');
		expect((affix.element as HTMLElement).style.top).toBe('48px');
		wrapper.unmount();
	});

	it('scroll picks the group whose title reached the sticky line and pushes the sticky title', async () => {
		const wrapper = mount(IndexBar, { props: { data: DATA }, attachTo: document.body });
		await flush();
		const vm = wrapper.vm as any;
		// A: 0, B: 112, C: 184, D: 216
		layout(wrapper, 100 + 120);
		window.dispatchEvent(new Event('scroll'));
		await flush();
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['B']);
		expect(wrapper.emitted('change')?.at(-1)).toEqual(['B']);
		const sticky = wrapper.find('.vc-index-bar__sticky');
		expect(sticky.text()).toBe('B');
		expect(sticky.classes()).toContain('is-active');
		// 吸附线 120，C 标题在 184：B 标题（高度在 jsdom 中为 0）不被顶出
		expect((sticky.element as HTMLElement).style.transform).toBe('');

		// D 标题恰好停在吸附线上
		layout(wrapper, 100 + 216);
		window.dispatchEvent(new Event('scroll'));
		await flush();
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['D']);
		expect(wrapper.find('.vc-index-bar__sidebar-item.is-active').text()).toBe('D');

		// 回到顶部：没吸住
		layout(wrapper, 0);
		window.dispatchEvent(new Event('scroll'));
		await flush();
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['A']);
		expect(wrapper.find('.vc-index-bar__sticky').classes()).not.toContain('is-active');
		expect(vm.scrollTo).toBeTypeOf('function');
		wrapper.unmount();
	});

	it('sidebar press / drag selects by position and scrolls the title to the sticky line', async () => {
		const scrollSpy = vi.spyOn(document.documentElement, 'scrollTop', 'set');
		Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 5000 });
		const wrapper = mount(IndexBar, { props: { data: DATA, offset: 10 }, attachTo: document.body });
		await flush();
		layout(wrapper, 0);
		const list = wrapper.find('.vc-index-bar__sidebar-list');

		// 第 3 项（C）：y = 2 * 20 + 5
		await list.trigger('mousedown', { button: 0, buttons: 1, clientY: 45 });
		await flush();
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['C']);
		expect(wrapper.find('.vc-index-bar__sidebar').classes()).toContain('is-dragging');
		expect(wrapper.find('.vc-index-bar__tip').text()).toBe('C');
		// C 标题：行容器 100 + 184 - offset 10
		expect(scrollSpy).toHaveBeenLastCalledWith(274);

		// 拖到列表外也取边界项
		document.dispatchEvent(new MouseEvent('mousemove', { buttons: 1, clientY: 999 }));
		await flush();
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['D']);
		document.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
		await flush();
		expect(wrapper.find('.vc-index-bar__tip').exists()).toBe(false);
		expect(wrapper.find('.vc-index-bar__sidebar-item.is-active').text()).toBe('D');

		// 拖动及其后的一小段时间里，滚动不改当前分组
		layout(wrapper, 100 + 120);
		window.dispatchEvent(new Event('scroll'));
		await flush();
		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['D']);

		scrollSpy.mockRestore();
		wrapper.unmount();
	});

	it('v-model from outside scrolls without emitting; exposed scrollTo emits', async () => {
		const scrollSpy = vi.spyOn(document.documentElement, 'scrollTop', 'set');
		Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 5000 });
		const value = ref('A');
		const wrapper = mount(() => (
			<IndexBar modelValue={value.value} data={DATA} />
		), { attachTo: document.body });
		await flush();
		const bar = wrapper.findComponent(IndexBar);
		layout(bar as any, 0);

		value.value = 'B';
		await flush();
		expect(scrollSpy).toHaveBeenLastCalledWith(212);
		expect(bar.emitted('update:modelValue')).toBeUndefined();
		expect(bar.find('.vc-index-bar__sidebar-item.is-active').text()).toBe('B');

		// 几何跟上新的滚动位置
		layout(bar as any, document.documentElement.scrollTop);
		(bar.vm as any).scrollTo('D');
		await flush();
		expect(scrollSpy).toHaveBeenLastCalledWith(316);
		expect(bar.emitted('change')?.at(-1)).toEqual(['D']);

		// 不存在的分组：不滚动、不触发
		const calls = scrollSpy.mock.calls.length;
		(bar.vm as any).scrollTo('Z');
		await flush();
		expect(scrollSpy.mock.calls.length).toBe(calls);
		scrollSpy.mockRestore();
		wrapper.unmount();
	});

	it('data change keeps the current group when it still exists, otherwise falls back to the first', async () => {
		const data = ref(DATA);
		const wrapper = mount(() => (<IndexBar modelValue="B" data={data.value} />), { attachTo: document.body });
		await flush();
		const bar = wrapper.findComponent(IndexBar);
		data.value = DATA.slice(1);
		await flush();
		expect(bar.find('.vc-index-bar__sidebar-item.is-active').text()).toBe('B');
		data.value = [{ value: 'X', children: [] }];
		await flush();
		expect(bar.emitted('update:modelValue')?.at(-1)).toEqual(['X']);
		wrapper.unmount();
	});

	it('tip=false hides the tip while dragging', async () => {
		const wrapper = mount(IndexBar, { props: { data: DATA, tip: false }, attachTo: document.body });
		await flush();
		layout(wrapper, 0);
		await wrapper.find('.vc-index-bar__sidebar-list').trigger('mousedown', { button: 0, buttons: 1, clientY: 5 });
		await flush();
		expect(wrapper.find('.vc-index-bar__sidebar').classes()).toContain('is-dragging');
		expect(wrapper.find('.vc-index-bar__tip').exists()).toBe(false);
		document.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
		wrapper.unmount();
	});

	it('sticky=false renders no sticky title', async () => {
		const wrapper = mount(IndexBar, { props: { data: DATA, sticky: false }, attachTo: document.body });
		await flush();
		expect(wrapper.find('.vc-index-bar__sticky').exists()).toBe(false);
		wrapper.unmount();
	});
});

describe('mobile', () => {
	it('MIndexBar: marker class, 750-unit height and MAffix offset', async () => {
		const wrapper = mount(MIndexBar, { props: { data: DATA, height: 900, offset: 88 }, attachTo: document.body });
		await flush();
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-index-bar', 'vcm-index-bar']));
		expect(wrapper.element.getAttribute('style')).toContain('height: calc(var(--vc-rem) * 900)');
		expect(wrapper.find('.vcm-affix').exists()).toBe(true);
		expect((wrapper.find('.vcm-affix').element as HTMLElement).style.top).toBe('calc(var(--vc-rem) * 88)');
		expect(wrapper.find('.vcm-recycle-list').exists()).toBe(true);
		wrapper.unmount();
	});
});
