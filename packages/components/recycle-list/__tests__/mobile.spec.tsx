// @vitest-environment jsdom

import { RecycleList, MRecycleList, RecycleListStore } from '@deot/vc-components';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { vi } from 'vitest';
import { VcInstance } from '../../vc';
import { Container } from '../container';
import { ScrollState } from '../scroll-state';
import * as drag from '../../../hooks/__tests__/fixtures/drag';
import { mockPullSize } from './fixtures/pull';

enableAutoUnmount(afterEach);

const sleep = (time = 0) => new Promise(resolve => setTimeout(resolve, time));
const flushLayout = async (rounds = 10) => {
	for (let i = 0; i < rounds; i++) {
		await nextTick();
		await sleep(0);
	}
};
const buildItems = (count: number) => Array.from({ length: count }).map((_, id) => ({ id }));

// 记录所有 ResizeObserver 实例：按被观察的元素找到对应的观察器再触发回调
const observers: any[] = [];
const MockResizeObserver = (globalThis as any).ResizeObserver;
(globalThis as any).ResizeObserver = class extends MockResizeObserver {
	constructor(cb: any) {
		super(cb);
		observers.push(this);
	}
};

// useRem 的探针：jsdom 不做布局，宽度（750 个单位的 px）由这里给出
const getProbe = () => [...document.body.children].find(el => (el as HTMLElement).style.width.includes('--vc-rem')) as HTMLElement;
let probeWidth = 375;
const setProbeWidth = (width: number) => {
	probeWidth = width;
	const probe = getProbe();
	observers.forEach(observer => observer.targets.has(probe) && observer.trigger(probe));
};

describe('MRecycleList', () => {
	let rect: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		probeWidth = 375;
		const origin = HTMLElement.prototype.getBoundingClientRect;
		rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			return this.style.width.includes('--vc-rem') ? { width: probeWidth } as DOMRect : origin.call(this);
		});
	});

	afterEach(() => {
		rect.mockRestore();
		VcInstance.options.RecycleList = {};
	});

	describe('结构', () => {
		it('根节点为桌面端结构加标记类 vcm-recycle-list，内部滚动容器为 MScroller', () => {
			const wrapper = mount(() => <MRecycleList />);
			expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-recycle-list', 'vcm-recycle-list']));
			expect(wrapper.find('.vc-recycle-list__wrapper').classes()).toContain('vcm-scroller');
		});

		it('RecycleList 不带标记类，内部滚动容器为 Scroller', () => {
			const wrapper = mount(() => <RecycleList />);
			expect(wrapper.classes()).not.toContain('vcm-recycle-list');
			expect(wrapper.find('.vc-recycle-list__wrapper').classes()).not.toContain('vcm-scroller');
		});

		it('默认加载图标为 750 稿尺寸', () => {
			const props = {
				loadState: { isEnd: false, isLoading: true, isSilentRefresh: false, isEmpty: false, loaded: 0 },
				renderer: {}
			};
			const size = (mobile: boolean) => {
				const wrapper = mount(ScrollState, { props: { ...props, mobile } });
				return (wrapper.find('.vc-spin [style*="width"]').element as HTMLElement).style.width;
			};
			expect(size(true)).toBe('calc(var(--vc-rem) * 40)');
			expect(size(false)).toBe('20px');
		});
	});

	describe('render* 的参数带 mobile', () => {
		const endState = (isEmpty: boolean) => ({ isEnd: true, isLoading: false, isSilentRefresh: false, isEmpty, loaded: isEmpty ? 0 : 3 });

		it.each([true, false])('loading / complete / empty（mobile=%s）', (mobile) => {
			const render = vi.fn(() => 'x');
			const renderer = { loading: render, complete: render, empty: render };
			mount(ScrollState, { props: { mobile, renderer, loadState: { ...endState(false), isEnd: false, isLoading: true } } });
			mount(ScrollState, { props: { mobile, renderer, loadState: endState(false) } });
			mount(ScrollState, { props: { mobile, renderer, loadState: endState(true) } });
			expect(render).toHaveBeenCalledTimes(3);
			render.mock.calls.forEach(([attrs]: any) => expect(attrs).toEqual({ mobile }));
		});

		it.each([true, false])('对应的插槽收到同样的参数（mobile=%s）', (mobile) => {
			const empty = vi.fn(() => 'x');
			mount(ScrollState, { props: { mobile, renderer: {}, loadState: endState(true) }, slots: { empty } });
			expect((empty.mock.calls[0] as any)[0]).toEqual({ mobile });
		});

		it.each([true, false])('refresh 为 { status, type, mobile }（mobile=%s）', (mobile) => {
			const render = vi.fn(() => 'x');
			mount(Container, { props: { pullable: true, mobile, render } });
			expect((render.mock.calls[0] as any)[0]).toEqual({ status: 0, type: 'DOWN', mobile });
		});

		it.each([
			[MRecycleList, true],
			[RecycleList, false]
		] as const)('全局配置一份管两端：%#', async (Component, mobile) => {
			const renderEmpty = vi.fn(() => 'empty');
			const renderRefresh = vi.fn(() => 'refresh');
			const renderPlaceholder = vi.fn(() => 'placeholder');
			VcInstance.configure({ RecycleList: { renderEmpty, renderRefresh, renderPlaceholder } });

			const wrapper = mount(() => <Component pullable loadData={() => false} />);
			await flushLayout();
			expect(wrapper.find('.vc-recycle-list__empty').text()).toBe('empty');
			expect(renderEmpty).toHaveBeenLastCalledWith({ mobile }, expect.anything());
			expect(renderRefresh).toHaveBeenLastCalledWith(expect.objectContaining({ mobile }), expect.anything());
			expect(renderPlaceholder).toHaveBeenLastCalledWith({ mobile }, expect.anything());
		});
	});

	describe('长度单位', () => {
		it('gap / estimateSize 为 750 稿长度：按 --vc-rem 的 px 换算', async () => {
			setProbeWidth(414);
			const wrapper = mount(() => (
				<MRecycleList data={buildItems(4)} disabled columns={2} gap={20} estimateSize={100} />
			));
			await flushLayout();
			const { store } = wrapper.findComponent(MRecycleList).vm as any;
			const unit = 414 / 750;
			expect(store.states.unit).toBe(unit);
			// 使用方写的值不变，换算后的值在 states 上
			expect(store.props.gap).toBe(20);
			expect(store.states.gap).toBe(20 * unit);
			expect(store.states.columnOffsetGap).toBe(20 * unit / 2);
			expect(store.states.rebuildData.map((node: any) => node.estimate)).toEqual([100 * unit, 100 * unit, 100 * unit, 100 * unit]);
		});

		it('estimateSize 为函数时返回值同样按 750 稿换算', async () => {
			const wrapper = mount(() => (
				<MRecycleList data={buildItems(2)} disabled estimateSize={({ index }: any) => (index ? 200 : 100)} />
			));
			await flushLayout();
			const { store } = wrapper.findComponent(MRecycleList).vm as any;
			expect(store.states.rebuildData.map((node: any) => node.estimate)).toEqual([50, 100]);
		});

		it('--vc-rem 变化后重新换算并重排', async () => {
			const wrapper = mount(() => (
				<MRecycleList data={buildItems(3)} disabled columns={2} gap={20} estimateSize={100} />
			));
			await flushLayout();
			const { store } = wrapper.findComponent(MRecycleList).vm as any;
			expect(store.states.unit).toBe(0.5);
			expect(store.states.contentMaxSize).toBe(100);

			setProbeWidth(480);
			await flushLayout();
			expect(store.states.unit).toBe(0.64);
			expect(store.states.gap).toBe(12.8);
			expect(store.states.rebuildData.map((node: any) => node.estimate)).toEqual([64, 64, 64]);
			// 两列三行：最高的一列两行
			expect(store.states.contentMaxSize).toBe(128);
		});

		it('共享 store 时由组件写入 unit，store.props 保持 750 稿', async () => {
			const store = new RecycleListStore({ estimateSize: 100, gap: 20, columns: 2 } as any);
			expect(store.states.unit).toBe(1);
			mount(() => <MRecycleList store={store} data={buildItems(2)} disabled />);
			await flushLayout();
			expect(store.states.unit).toBe(0.5);
			expect(store.states.gap).toBe(10);
			expect(store.props.gap).toBe(20);
		});

		it('RecycleList 的单位为 px，不随 --vc-rem 变化', async () => {
			const wrapper = mount(() => (
				<RecycleList data={buildItems(2)} disabled columns={2} gap={20} estimateSize={100} />
			));
			await flushLayout();
			const { store } = wrapper.findComponent(RecycleList).vm as any;
			expect(store.states.unit).toBe(1);
			expect(store.states.gap).toBe(20);
			expect(store.states.rebuildData.map((node: any) => node.estimate)).toEqual([100, 100]);
		});
	});

	describe('刷新提示条', () => {
		it('触发刷新的距离为提示条的实际尺寸', async () => {
			// 750 稿 88 在 375 宽下为 44px
			const restore = mockPullSize(44);
			const wrapper = mount(Container, { props: { pullable: true, mobile: true, onRefresh: () => new Promise<void>(() => {}) } });
			const touch = async (type: 'touchstart' | 'touchmove' | 'touchend', distance: number) => {
				drag.fireTouch(wrapper.element, type, { screenX: 100, screenY: 100 + distance });
				await nextTick();
			};
			await touch('touchstart', 0);
			await touch('touchmove', 40);
			expect(wrapper.text()).toBe('↓ 下拉刷新');
			await touch('touchmove', 50);
			expect(wrapper.text()).toBe('↑ 释放更新');
			await touch('touchend', 50);
			// 刷新中停在提示条的高度
			expect(wrapper.find('.vc-recycle-list__container').attributes('style')).toContain('translateY(44px)');
			restore();
		});

		it('提示条的位置由样式决定，不写内联的 margin', () => {
			const wrapper = mount(Container, { props: { pullable: true } });
			const { style } = wrapper.find('.vc-recycle-list__pull').element as HTMLElement;
			expect(style.margin).toBe('');
		});
	});
});
