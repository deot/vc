// @vitest-environment jsdom

import { Customer, RecycleList, RecycleListStore, MRecycleList } from '@deot/vc-components';
import { RecycleListItemNode } from '../store';
import { useMeasuring } from '../../measuring';
import { mount } from '@vue/test-utils';
import { defineComponent, getCurrentInstance, nextTick, onMounted, reactive, ref, toRaw } from 'vue';
import { vi } from 'vitest';
import * as drag from '../../../hooks/__tests__/fixtures/drag';

const sleep = (time = 0) => new Promise(resolve => setTimeout(resolve, time));

const defineGetter = (
	obj: any,
	prop: string,
	value: any
) => {
	const old = Object.getOwnPropertyDescriptor(obj, prop);
	Object.defineProperty(obj, prop, {
		configurable: true,
		get: () => value
	});
	return () => {
		if (old) {
			Object.defineProperty(obj, prop, old);
		} else {
			delete obj[prop];
		}
	};
};

const mockSize = (
	el: any,
	{ clientWidth, clientHeight, offsetWidth, offsetHeight, scrollWidth, scrollHeight }: {
		clientWidth?: number;
		clientHeight?: number;
		offsetWidth?: number;
		offsetHeight?: number;
		scrollWidth?: number;
		scrollHeight?: number;
	}
) => {
	const restores: Array<() => void> = [];
	if (typeof clientWidth === 'number') restores.push(defineGetter(el, 'clientWidth', clientWidth));
	if (typeof clientHeight === 'number') restores.push(defineGetter(el, 'clientHeight', clientHeight));
	if (typeof offsetWidth === 'number') restores.push(defineGetter(el, 'offsetWidth', offsetWidth));
	if (typeof offsetHeight === 'number') restores.push(defineGetter(el, 'offsetHeight', offsetHeight));
	if (typeof scrollWidth === 'number') restores.push(defineGetter(el, 'scrollWidth', scrollWidth));
	if (typeof scrollHeight === 'number') restores.push(defineGetter(el, 'scrollHeight', scrollHeight));
	return () => restores.forEach(fn => fn());
};

// 构造测试数据
const buildItem = (id: number, page = 1) => ({
	id,
	page,
	text: `text-${id}`
});
const buildItems = (count: number, page = 1, startId = 0) => {
	return Array.from({ length: count }).map((_, i) => buildItem(startId + i, page));
};

// 推进若干轮 nextTick + 宏任务，等分批构建与布局完成
const flushLayout = async (rounds = 10) => {
	for (let i = 0; i < rounds; i++) {
		await nextTick();
		await sleep(0);
	}
};

// 列表 wrapper 读到 wrapperHeight，其余元素读到 itemHeight
const spyOffsetHeight = (wrapperHeight: number, itemHeight: number) => vi
	.spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
	.mockImplementation(function (this: HTMLElement) {
		return this.classList.contains('vc-recycle-list__wrapper') ? wrapperHeight : itemHeight;
	});

// 记录所有 ResizeObserver 实例：行尺寸由列表共用的一个观察器监听，测试里按元素找到它再触发回调
const observers: any[] = [];
const MockResizeObserver = (globalThis as any).ResizeObserver;
(globalThis as any).ResizeObserver = class extends MockResizeObserver {
	constructor(cb: any) {
		super(cb);
		observers.push(this);
	}
};
const ROW = '.vc-recycle-list__column .vc-recycle-list__item';
// 观察着某个行元素的观察器
const observerOf = (el: Element) => observers.find(ro => ro.targets.has(el));

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof RecycleList).toBe('object');
		expect(typeof RecycleListStore).toBe('function');
	});

	it('MRecycleList re-exports RecycleList from index.m', () => {
		expect(MRecycleList).toBe(RecycleList);
	});

	it('create', async () => {
		const wrapper = mount(() => (<RecycleList />));

		expect(wrapper.classes()).toContain('vc-recycle-list');
	});

	describe('Structure', () => {
		it('renders default structure with wrapper / content / pool nodes', async () => {
			const wrapper = mount(() => (<RecycleList />), { attachTo: document.body });
			await nextTick();

			expect(wrapper.find('.vc-recycle-list').exists()).toBe(true);
			expect(wrapper.find('.vc-recycle-list__container').exists()).toBe(true);
			expect(wrapper.find('.vc-recycle-list__wrapper').exists()).toBe(true);
			expect(wrapper.find('.vc-recycle-list__content').exists()).toBe(true);
			expect(wrapper.find('.vc-recycle-list__pool').exists()).toBe(true);

			wrapper.unmount();
		});

		it('does NOT add is-horizontal class when vertical=true (default)', () => {
			const wrapper = mount(() => (<RecycleList />));
			expect(wrapper.classes()).not.toContain('is-horizontal');
		});

		it('adds is-horizontal class when vertical=false', () => {
			const wrapper = mount(() => (<RecycleList vertical={false} />));
			expect(wrapper.classes()).toContain('is-horizontal');
		});

		it('renders header and footer slots', () => {
			const wrapper = mount(RecycleList, {
				slots: {
					header: () => <div class="my-header">HEADER</div>,
					footer: () => <div class="my-footer">FOOTER</div>
				}
			});

			expect(wrapper.find('.my-header').exists()).toBe(true);
			expect(wrapper.find('.my-header').text()).toBe('HEADER');
			expect(wrapper.find('.my-footer').exists()).toBe(true);
			expect(wrapper.find('.my-footer').text()).toBe('FOOTER');
		});

		it('renders pull node when pullable=true and not inverted', () => {
			const wrapper = mount(() => (<RecycleList pullable />));

			expect(wrapper.find('.vc-recycle-list__pull').exists()).toBe(true);
		});

		it('does NOT render pull node when pullable=false (default)', () => {
			const wrapper = mount(() => (<RecycleList />));

			expect(wrapper.find('.vc-recycle-list__pull').exists()).toBe(false);
		});

		it('renders pull node after the container when inverted=true and pullable=true', () => {
			const wrapper = mount(() => (<RecycleList pullable inverted />));

			const pull = wrapper.find('.vc-recycle-list__pull').element as HTMLElement;
			expect(pull.previousElementSibling?.classList.contains('vc-recycle-list__container')).toBe(true);
			// 靠负 margin-bottom 藏在尾部视口外
			expect(pull.style.marginBottom).toBe('-30px');
			expect(pull.style.marginTop).toBe('');
		});

		it('renders multiple columns when cols > 1', async () => {
			const wrapper = mount(() => (
				<RecycleList
					cols={3}
					data={buildItems(6)}
				>
					{{ default: ({ row }: any) => (
						<div class="my-item">
							item-
							{row.id}
						</div>
					) }}
				</RecycleList>
			));

			await nextTick();
			await nextTick();

			expect(wrapper.findAll('.vc-recycle-list__column').length).toBe(3);
		});

		it('renders <br /> separators between columns when vertical=false', async () => {
			const wrapper = mount(() => (
				<RecycleList
					vertical={false}
					cols={3}
					data={buildItems(3)}
				>
					{{ default: ({ row }: any) => <div class="hr-item">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();
			expect(wrapper.findAll('br').length).toBe(2); // cols-1 = 2
		});
	});

	describe('Slots & rendering items', () => {
		it('renders default slot for each row from data prop', async () => {
			const data = buildItems(3);
			const wrapper = mount(() => (
				<RecycleList
					data={data}
				>
					{{ default: ({ row }: any) => (
						<div class="row-item">
							id-
							{row.id}
						</div>
					) }}
				</RecycleList>
			));

			await nextTick();
			await nextTick();
			await sleep(0);
			await nextTick();

			// 限定可见列，排除隐藏测量池中的副本（jsdom下尺寸恒为0，预测量项不会离开池）
			const items = wrapper.findAll('.vc-recycle-list__column .row-item');
			expect(items.length).toBe(3);
			expect(items[0].text()).toBe('id-0');
			expect(items[2].text()).toBe('id-2');
		});

		it('renders placeholder slot in pool', async () => {
			const wrapper = mount(() => (
				<RecycleList>
					{{
						placeholder: () => <div class="my-placeholder">loading...</div>
					}}
				</RecycleList>
			));

			await nextTick();

			expect(wrapper.find('.vc-recycle-list__pool .my-placeholder').exists()).toBe(true);
		});

		it('renderPlaceholder prop renders placeholder when slot is missing', async () => {
			const wrapper = mount(() => (
				<RecycleList
					renderPlaceholder={() => <div class="prop-placeholder">prop-pl</div>}
				/>
			));

			await nextTick();

			expect(wrapper.find('.vc-recycle-list__pool .prop-placeholder').exists()).toBe(true);
		});
	});

	describe('render reconciliation', () => {
		it('does not re-render every renderItem while scrolling', async () => {
			const data = buildItems(100);
			const loadData = vi.fn(async () => ({ data: [], finished: true }));
			const renderCallsById = new Map<number, number>();
			const renderItem = vi.fn((props: any) => {
				const id = props.row.id;
				renderCallsById.set(id, (renderCallsById.get(id) || 0) + 1);
				return <div class="memo-item">{id}</div>;
			});

			const wrapper = mount(() => (
				// batchCount=100: 单页覆盖全部数据，聚焦滚动渲染协调而非懒构建分页
				<RecycleList data={data} batchCount={100} loadData={loadData}>
					{{
						default: ({ row }: any) => <Customer row={row} render={renderItem} />
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();
			await sleep(0);

			const scroller = wrapper.find('.vc-scroller');
			expect(scroller.exists()).toBe(true);

			const scrollerEl = scroller.element as HTMLElement;
			const restore = mockSize(scrollerEl, {
				clientWidth: 320,
				clientHeight: 200,
				offsetWidth: 320,
				offsetHeight: 200,
				scrollWidth: 320,
				scrollHeight: 4000
			});

			await nextTick();

			const renderCountBeforeScroll = renderItem.mock.calls.length;
			expect(renderCountBeforeScroll).toBeGreaterThan(0);

			scrollerEl.scrollTop = 120;
			scrollerEl.dispatchEvent(new Event('scroll'));
			await sleep(30);
			await nextTick();

			scrollerEl.scrollTop = 320;
			scrollerEl.dispatchEvent(new Event('scroll'));
			await sleep(30);
			await nextTick();

			expect(scrollerEl.scrollTop).toBe(320);

			// 滚动后可接受少量新增渲染（新进入可视区），但不能出现全量重渲染
			const renderCountAfterScroll = renderItem.mock.calls.length;
			expect(renderCountAfterScroll - renderCountBeforeScroll).toBeLessThan(data.length);

			// 首次已渲染的项不应在滚动中全部被重渲染
			const reRenderedIds = Array.from(renderCallsById.values()).filter(times => times > 1);
			expect(reRenderedIds.length).toBeLessThan(renderCountBeforeScroll);

			restore();
			wrapper.unmount();
		});

		it('renders only appended item when data grows by one', async () => {
			const data = ref(buildItems(3));
			const loadData = vi.fn(async () => ({ data: [], finished: true }));
			// 只统计隐藏测量池里的挂载：数据追加后，池中已有条目不应被卸载重建，只有新增的一条挂载。
			// （可见列的条目会因 setData 重建节点而重新挂载一次，那是 rebuild 既有行为，不在此断言范围）
			const poolMountsById = new Map<number, number>();
			const Item = defineComponent({
				props: { id: Number },
				setup(props) {
					const instance = getCurrentInstance()!;
					onMounted(() => {
						const el = instance.vnode.el as HTMLElement | null;
						if (el?.closest?.('.vc-recycle-list__pool')) {
							poolMountsById.set(props.id!, (poolMountsById.get(props.id!) || 0) + 1);
						}
					});
					return () => <div class="memo-item">{props.id}</div>;
				}
			});

			const wrapper = mount(() => (
				// batchCount=5: 单页覆盖追加后的数据，聚焦追加渲染协调而非懒构建分页
				<RecycleList data={data.value} batchCount={5} loadData={loadData}>
					{{
						default: ({ row }: any) => <Item id={row.id} />
					}}
				</RecycleList>
			), { attachTo: document.body });

			for (let i = 0; i < 8; i++) { await sleep(0); await nextTick(); }
			const before = [0, 1, 2].map(id => poolMountsById.get(id));
			expect(before).toEqual([1, 1, 1]);

			data.value = [...data.value, buildItem(3, 1)];
			for (let i = 0; i < 8; i++) { await sleep(0); await nextTick(); }

			expect([0, 1, 2].map(id => poolMountsById.get(id))).toEqual(before);
			expect(poolMountsById.get(3)).toBe(1);

			wrapper.unmount();
		});
	});

	describe('Props - data / batchCount', () => {
		it('uses threshold=100 by default and no longer exposes offset', () => {
			const defaultWrapper = mount(RecycleList);
			const customWrapper = mount(RecycleList, { props: { threshold: 240 } });

			expect(defaultWrapper.props('threshold')).toBe(100);
			expect(customWrapper.props('threshold')).toBe(240);
			expect('offset' in defaultWrapper.props()).toBe(false);
			defaultWrapper.unmount();
			customWrapper.unmount();
		});

		it('does NOT mark isEnd on setData; default loadData(false) ends it after mount', async () => {
			const data = buildItems(3);
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={data}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();
			await sleep(0);
			await nextTick();

			// 本地数据不再推断isEnd；挂载后默认loadData(返回false)触发结束
			expect(listRef.value.store.states.isEnd).toBe(true);
			expect(listRef.value.store.states.rebuildData.length).toBe(3);
		});

		it('keeps isEnd=false when disabled blocks remote loadData', async () => {
			const data = buildItems(10);
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={data} disabled>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();
			await sleep(0);

			expect(listRef.value.store.states.isEnd).toBe(false);
			expect(listRef.value.store.states.rebuildData.length).toBe(10);
		});

		it('component lazy-builds local data by batchCount', async () => {
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={buildItems(10)} batchCount={4}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();

			// 初始一页(4) + 挂载时懒构建一页(4)
			expect(listRef.value.store.local.buildCount).toBe(8);
			expect(listRef.value.store.states.rebuildData.length).toBe(8);
		});

		it('updates data when prop changes', async () => {
			const data = ref(buildItems(3));
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={data.value} batchCount={3}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();
			const oldLen = listRef.value.store.states.rebuildData.length;
			expect(oldLen).toBe(3);
			await sleep(20);

			data.value = buildItems(6, 1, 100);
			await nextTick();
			await nextTick();

			// 懒构建：数据变更后立即构建的是已构建区间（一页）
			expect(listRef.value.store.states.rebuildData.length).toBe(3);

			// 滚动位置处于加载阈值内时自动续建下一页
			await sleep(20);
			await nextTick();
			expect(listRef.value.store.states.rebuildData.length).toBe(6);
		});

		it('hasPlaceholder is falsy by default and truthy when placeholder slot exists', async () => {
			const refA = ref<any>();
			const refB = ref<any>();
			mount(() => (
				<RecycleList ref={refA} />
			));
			mount(() => (
				<RecycleList ref={refB}>
					{{ placeholder: () => <div>p</div> }}
				</RecycleList>
			));
			await nextTick();

			expect(!!refA.value.hasPlaceholder).toBe(false);
			expect(!!refB.value.hasPlaceholder).toBe(true);
		});
	});

	describe('Local data lazy build (paging by batchCount)', () => {
		it('initially builds only one page for large data', async () => {
			const data = buildItems(1000);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data} batchCount={200}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(20);
			await nextTick();

			const store = listRef.value.store;
			expect(store.local.total).toBe(1000);
			// 初始一页 + 挂载时 loadData 预构建一页（与远程模式挂载即拉一页语义一致）
			expect(store.states.rebuildData.length).toBeLessThan(1000);
			expect(store.states.rebuildData.length % 200).toBe(0);
			expect(store.local.buildCount).toBe(store.states.rebuildData.length);
			wrapper.unmount();
		});

		it('scrolling to bottom builds next local page without calling remote loadData', async () => {
			const data = buildItems(1000);
			const loadData = vi.fn(async () => false);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data} batchCount={200} loadData={loadData}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(20);
			await nextTick();

			const before = listRef.value.store.states.rebuildData.length;
			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 200,
				offsetHeight: 200,
				scrollHeight: 1000
			});

			wrapEl.scrollTop = 950; // > scrollHeight - clientSize - threshold
			wrapEl.dispatchEvent(new Event('scroll'));
			await sleep(20);
			await nextTick();

			expect(listRef.value.store.states.rebuildData.length).toBe(before + 200);
			expect(loadData).not.toHaveBeenCalled();
			restore();
			wrapper.unmount();
		});

		it('falls through to remote loadData after local data fully built', async () => {
			const data = buildItems(40);
			const loadData = vi.fn(async () => false);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data} batchCount={20} loadData={loadData}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(20);
			await nextTick();

			// 初始一页 + 挂载预构建一页 = 全部构建完
			expect(listRef.value.store.states.rebuildData.length).toBe(40);
			expect(loadData).not.toHaveBeenCalled();

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 200,
				offsetHeight: 200,
				scrollHeight: 1000
			});

			wrapEl.scrollTop = 950;
			wrapEl.dispatchEvent(new Event('scroll'));
			await sleep(20);
			await nextTick();

			expect(loadData).toHaveBeenCalledTimes(1);
			restore();
			wrapper.unmount();
		});

		it('inverted: builds tail slice first and prepends earlier page on scrolling up', async () => {
			const data = buildItems(600);
			const loadData = vi.fn(async () => false);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} inverted data={data} batchCount={200} loadData={loadData}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			// 等待挂载预构建完成（jsdom下Defer基于idle回调，完成时机不定）
			for (let i = 0; i < 30 && listRef.value.store.local.buildCount < 400; i++) {
				await sleep(20);
			}
			await nextTick();

			const store = listRef.value.store;
			// 初始尾部一页 + 挂载预构建一页 => [200, 600)
			expect(store.states.rebuildData.length).toBe(400);
			expect(store.states.rebuildData[0].states.index).toBe(200);
			expect(store.states.rebuildData[399].states.index).toBe(599);

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			wrapEl.scrollTop = 0; // inverted: scrollTop - threshold <= 0 触发
			// 构建期间isManualScroll会拦截scroll（与远程inverted翻页一致），持续滚动直至构建完成
			for (let i = 0; i < 30 && store.states.rebuildData.length < 600; i++) {
				wrapEl.dispatchEvent(new Event('scroll'));
				await sleep(20);
			}
			await nextTick();

			expect(store.states.rebuildData.length).toBe(600);
			// 新块整体位于头部且数组内保持升序
			expect(store.states.rebuildData.every((item: any, i: number) => item.states.index === i)).toBe(true);
			expect(loadData).not.toHaveBeenCalled();
			wrapper.unmount();
		});

		it('disabled=true still builds local pages on scroll but never calls remote loadData', async () => {
			const data = buildItems(600);
			const loadData = vi.fn(async () => false);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} disabled data={data} batchCount={200} loadData={loadData}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(20);
			await nextTick();

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 200,
				offsetHeight: 200,
				scrollHeight: 1000
			});

			// 连续触发直到本地构建完，再触发一次验证远程不被调用
			for (let i = 0; i < 3; i++) {
				wrapEl.scrollTop = 950;
				wrapEl.dispatchEvent(new Event('scroll'));
				await sleep(20);
				await nextTick();
			}

			expect(listRef.value.store.states.rebuildData.length).toBe(600);
			expect(loadData).not.toHaveBeenCalled();
			restore();
			wrapper.unmount();
		});

		it('keeps built progress when data changes', async () => {
			const data = ref(buildItems(600));
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data.value} batchCount={200}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(20);
			await nextTick();

			const built = listRef.value.store.local.buildCount;
			expect(built).toBeGreaterThanOrEqual(400);

			data.value = [...data.value, buildItem(600)];
			await nextTick();
			await nextTick();

			// 已构建进度保留，不回退到一页
			expect(listRef.value.store.local.buildCount).toBeGreaterThanOrEqual(built);
			expect(listRef.value.store.states.rebuildData.length).toBeGreaterThanOrEqual(built);
			wrapper.unmount();
		});
	});

	describe('loadData behaviour', () => {
		it('auto-loads first page on mount and stores data', async () => {
			const loadData = vi.fn(async ({ page }: any) => {
				return buildItems(3, page);
			});

			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} />
			), { attachTo: document.body });

			// 触发 onMounted -> loadData
			await nextTick();
			await sleep(0);
			await nextTick();

			expect(loadData).toHaveBeenCalledTimes(1);
			// page = 第 N 次请求；loaded = 当前已加载条数
			expect(loadData.mock.calls[0][0]).toEqual({ page: 1, loaded: 0 });
			expect(listRef.value.store.states.rebuildData.length).toBe(3);
		});

		it('passes { page, loaded } to loadData and appends by start', async () => {
			const loadData = vi.fn(async ({ page }: any) => buildItems(2, page));
			const store = new RecycleListStore({ loadData });

			let r = await store.fetchPage();
			expect(loadData).toHaveBeenLastCalledWith({ page: 1, loaded: 0 });
			expect([r.start, r.end]).toEqual([0, 2]);
			// 非空页推断为未结束
			expect(r.response.finished).toBe(false);

			r = await store.fetchPage();
			expect(loadData).toHaveBeenLastCalledWith({ page: 2, loaded: 2 });
			expect([r.start, r.end]).toEqual([2, 4]);
			expect(store.local.originalData.length).toBe(4);
		});

		it('loaded passed to loadData includes local data length', async () => {
			const loadData = vi.fn(async () => false);
			mount(() => (
				<RecycleList data={buildItems(4)} loadData={loadData}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);

			expect(loadData).toHaveBeenCalledWith({ page: 1, loaded: 4 });
		});

		it('handles { data, finished } object response and marks isEnd when finished', async () => {
			const loadData = vi.fn(async () => ({ data: buildItems(5), finished: true }));

			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			expect(loadData).toHaveBeenCalledTimes(1);
			expect(listRef.value.store.states.isEnd).toBe(true);
			expect(listRef.value.store.states.rebuildData.length).toBe(5);
		});

		it('treats empty array as finished', async () => {
			const loadData = vi.fn(async () => []);

			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			expect(listRef.value.store.states.isEnd).toBe(true);
			expect(listRef.value.store.states.rebuildData.length).toBe(0);
		});

		it('treats non-empty array as unfinished (ends by empty page or explicit finished)', async () => {
			const loadData = vi.fn(async () => buildItems(2));

			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			expect(listRef.value.store.states.isEnd).toBe(false);
			expect(listRef.value.store.states.rebuildData.length).toBe(2);
		});

		it('returns false from loadData triggers stopScroll (isEnd=true)', async () => {
			const loadData = vi.fn(async () => false);

			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			expect(listRef.value.store.states.isEnd).toBe(true);
		});

		it('does NOT call loadData when disabled=true', async () => {
			const loadData = vi.fn(async () => buildItems(3));

			mount(() => (
				<RecycleList loadData={loadData} disabled />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);

			expect(loadData).not.toHaveBeenCalled();
		});

		it('triggers loadData when disabled goes from true to false', async () => {
			const loadData = vi.fn(async () => buildItems(2));
			const disabled = ref(true);

			mount(() => (
				<RecycleList disabled={disabled.value} loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			expect(loadData).not.toHaveBeenCalled();

			disabled.value = false;
			await nextTick();
			await sleep(0);
			await nextTick();

			expect(loadData).toHaveBeenCalled();
		});

		it('disabled watcher waits for layoutInterrupter when refreshLayout is in flight', async () => {
			const loadData = vi.fn(async () => buildItems(3));
			const disabled = ref(false);
			const listRef = ref<any>();

			const wrapper = mount(() => (
				<RecycleList ref={listRef} disabled={disabled.value} loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			// 触发 refreshLayout 进入 in-flight 状态，然后切换 disabled 让 watcher 走 await layoutInterrupter 分支
			const refreshPromise = listRef.value.refreshLayout();

			disabled.value = true;
			await nextTick();
			disabled.value = false;
			await nextTick();

			await refreshPromise;
			await sleep(20);
			await nextTick();

			expect(true).toBe(true);
			wrapper.unmount();
		});
	});

	describe('Props owned by the store stay in sync', () => {
		it('applies batchCount and loadData changes to later builds and requests', async () => {
			const data = buildItems(30);
			const first = vi.fn(async () => ({ data: [], finished: false }));
			const second = vi.fn(async () => ({ data: [], finished: true }));
			const batchCount = ref(2);
			const loadData = ref(first);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data} batchCount={batchCount.value} loadData={loadData.value as any}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(20);
			const built = listRef.value.store.local.buildCount;

			batchCount.value = 10;
			loadData.value = second;
			await nextTick();
			expect(listRef.value.store.props.batchCount).toBe(10);

			// 下一批按新的 batchCount 构建
			const { start, end } = listRef.value.store.local.consumePage();
			expect(end - start).toBe(10);
			expect(listRef.value.store.local.buildCount).toBe(built + 10);

			// 下一次远程请求用新的 loadData
			await listRef.value.store.fetchPage();
			expect(first).not.toHaveBeenCalled();
			expect(second).toHaveBeenCalledTimes(1);
			wrapper.unmount();
		});

		it('re-measures and re-lays out when cols changes', async () => {
			const cols = ref(1);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={buildItems(6)} batchCount={6} cols={cols.value} disabled>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });
			await nextTick();
			await sleep(20);

			cols.value = 3;
			await nextTick();
			await sleep(20);
			await nextTick();

			expect(listRef.value.store.props.cols).toBe(3);
			expect(listRef.value.store.states.columns.length).toBe(3);
			expect(wrapper.findAll('.vc-recycle-list__column').length).toBe(3);
			wrapper.unmount();
		});

		describe('cols shrinks at runtime', () => {
			// 列越窄行越高：列数变化后旧尺寸只是估计值，校正后才与 DOM 一致
			const heightOf = (cols: number) => cols * 20;

			/**
			 * 断言布局自洽：每个节点都在有效列内，同列节点按下标首尾相接，内容高为最高列
			 *
			 * 给出 rowSize 时再按 DOM 核对渲染出来的行：记录的尺寸等于行的实际高度，
			 * 行在列容器的 translate 之后流式排布，记录的位置与 DOM 位置一致
			 * @param wrapper 挂载结果
			 * @param states store.states
			 * @param cols 当前列数
			 * @param rowSize 行的实际高度；不给时不核对 DOM（尺寸仍是估计值的那一帧）
			 */
			const expectConsistent = (wrapper: any, states: any, cols: number, rowSize?: number) => {
				const sizes = Array.from({ length: cols }, () => 0);
				states.rebuildData.forEach((node: any) => {
					expect(node.states.column).toBeGreaterThanOrEqual(0);
					expect(node.states.column).toBeLessThan(cols);
					expect(node.states.size).toBeGreaterThan(0);
					expect(node.states.position).toBe(sizes[node.states.column]);
					sizes[node.states.column] += node.states.size;
				});
				expect(states.contentMaxSize).toBe(Math.max(...sizes));

				const columns = wrapper.findAll('.vc-recycle-list__column');
				expect(columns.length).toBe(cols);
				let shown = 0;
				columns.forEach((column: any, index: number) => {
					let top = Number(/\(([-\d.]+)px\)/.exec(column.attributes('style') || '')?.[1] || 0);
					column.findAll('.vc-recycle-list__item').forEach((row: any) => {
						const node = states.rebuildData[Number(row.text())];
						expect(node.states.column).toBe(index);
						if (rowSize) {
							expect(node.states.size).toBe(rowSize);
							expect(node.states.position).toBe(top);
							top += rowSize;
						}
						shown++;
					});
				});
				expect(shown).toBeGreaterThan(0);
			};

			/**
			 * 断言每列渲染出来的行覆盖了视口（列内容不足视口时覆盖到列尾）
			 * @param wrapper 挂载结果
			 * @param states store.states
			 */
			const expectViewportCovered = (wrapper: any, states: any) => {
				// jsdom 下 content 在 wrapper 内的偏移为 0，滚动位置即 content 坐标
				const scrollTop = wrapper.find('.vc-recycle-list__wrapper').element.scrollTop;
				const viewportEnd = scrollTop + 200;
				wrapper.findAll('.vc-recycle-list__column').forEach((column: any, index: number) => {
					const nodes = states.data[index];
					const columnEnd = states.rebuildData
						.filter((node: any) => node.states.column === index)
						.reduce((sum: number, node: any) => sum + node.states.size, 0);
					expect(column.findAll('.vc-recycle-list__item').length).toBe(nodes.length);
					expect(nodes[0].states.position).toBeLessThanOrEqual(scrollTop);
					const last = nodes[nodes.length - 1];
					expect(last.states.position + last.states.size).toBeGreaterThanOrEqual(Math.min(viewportEnd, columnEnd));
				});
			};

			/**
			 * 模拟浏览器里 ResizeObserver 对新挂载行的首次回调（jsdom 的 mock 不会自动触发），直到渲染中的行都按 DOM 校正过
			 * @param wrapper 挂载结果
			 * @param states store.states
			 * @param rowSize 行的实际高度
			 */
			const settleRendered = async (wrapper: any, states: any, rowSize: number) => {
				for (let i = 0; i < 10; i++) {
					const rows = wrapper.findAll(ROW);
					if (rows.every((row: any) => states.rebuildData[Number(row.text())].states.size === rowSize)) return;
					rows.forEach((row: any) => observerOf(row.element).trigger(row.element));
					await flushLayout(2);
				}
			};

			it.each([
				[3, 1, 0],
				[5, 1, 0],
				[5, 3, 0],
				[3, 1, 200],
				[5, 1, 120]
			])('re-lays out from %i to %i columns (scrollTop %i) without errors or a blank frame', async (from, to, scrollTop) => {
				const restoreSize = mockSize(HTMLElement.prototype, { clientHeight: 200, scrollHeight: 1200 });
				const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;
				// 行（隐藏池与列内）的高度随当前列宽变化，其余元素高 40
				let rowSize = heightOf(from);
				Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
					configurable: true,
					get(this: HTMLElement) {
						return this.querySelector(':scope > .x') ? rowSize : 40;
					}
				});
				const errorHandler = vi.fn();
				const cols = ref(from);
				const listRef = ref<any>();
				const wrapper = mount(() => (
					<RecycleList ref={listRef} data={buildItems(30)} batchCount={30} cols={cols.value} disabled>
						{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
					</RecycleList>
				), { attachTo: document.body, global: { config: { errorHandler } } });
				try {
					const states = listRef.value.store.states;
					for (let i = 0; i < 40 && !(states.isBuilt && states.preData.length === 0); i++) await sleep(0);
					const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
					// jsdom 不限制 scrollTop 的取值：按浏览器的行为钳到 [0, scrollHeight - clientHeight]，锚点补偿可能写入负值
					let offset = 0;
					Object.defineProperty(wrapEl, 'scrollTop', {
						configurable: true,
						get: () => offset,
						set: (v: number) => { offset = Math.max(0, Math.min(v, 1200 - 200)); }
					});
					wrapEl.scrollTop = scrollTop;
					wrapEl.dispatchEvent(new Event('scroll'));
					await nextTick();
					expectConsistent(wrapper, states, from, rowSize);
					expectViewportCovered(wrapper, states);

					cols.value = to;
					rowSize = heightOf(to);
					await nextTick();

					// 本轮渲染（重测开始前）列表仍在：节点按旧尺寸（估计值）落到新的列里，渲染中的行覆盖视口
					expect(errorHandler).not.toHaveBeenCalled();
					expect(states.preData.length).toBe(0);
					expectConsistent(wrapper, states, to);
					expectViewportCovered(wrapper, states);

					await sleep(20);
					for (let i = 0; i < 40 && states.preData.length > 0; i++) await sleep(0);
					await flushLayout();
					await settleRendered(wrapper, states, rowSize);

					// 重测后：所有节点仍在有效列内，渲染中的行尺寸与位置都与 DOM 一致
					expect(errorHandler).not.toHaveBeenCalled();
					expect(states.rebuildData.length).toBe(30);
					expectConsistent(wrapper, states, to, rowSize);
					expectViewportCovered(wrapper, states);
					// 停在顶部时一直渲染着的行已按 DOM 重测，其余在隐藏池重测，全部是新尺寸
					scrollTop === 0 && states.rebuildData.forEach((node: any) => expect(node.states.size).toBe(rowSize));
				} finally {
					wrapper.unmount();
					Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeight);
					restoreSize();
				}
			});
		});

		it('rebuilds the list when inverted changes, matching a list mounted that way', async () => {
			const data = buildItems(6);
			const inverted = ref(false);
			const toggledRef = ref<any>();
			const invertedRef = ref<any>();
			const toggled = mount(() => (
				<RecycleList ref={toggledRef} data={data} batchCount={3} inverted={inverted.value} disabled>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });
			await nextTick();
			await sleep(20);

			inverted.value = true;
			await nextTick();
			await sleep(20);
			await nextTick();

			const fresh = mount(() => (
				<RecycleList ref={invertedRef} data={data} batchCount={3} inverted disabled>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });
			await nextTick();
			await sleep(20);

			const indices = (listRef: any) => listRef.value.store.states.rebuildData.map((node: any) => node.states.index);
			expect(toggledRef.value.store.props.inverted).toBe(true);
			expect(indices(toggledRef)).toEqual(indices(invertedRef));
			toggled.unmount();
			fresh.unmount();
		});

		it('keeps a shared store as the source of truth', async () => {
			const store = new RecycleListStore({ batchCount: 7 });
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} store={store} data={buildItems(3)} batchCount={3} disabled>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });
			await nextTick();
			await sleep(20);

			expect(store.props.batchCount).toBe(7);
			wrapper.unmount();
		});
	});

	describe('refreshViewport', () => {
		it('refreshes geometry and corrects rendered rows without re-measuring every node', async () => {
			const restore = mockSize(HTMLElement.prototype, { offsetHeight: 40, clientHeight: 200, scrollHeight: 1200 });
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={buildItems(6)} batchCount={6} disabled>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });
			await nextTick();
			await sleep(20);

			const store = listRef.value.store;
			const build = vi.spyOn(store.nodes, 'build');
			// 行的实际尺寸变了（内容原地变化），但没有人通知列表
			restore();
			const restoreLarger = mockSize(HTMLElement.prototype, { offsetHeight: 80, clientHeight: 200, scrollHeight: 1200 });

			await listRef.value.refreshViewport();
			await sleep(20);

			expect(build).not.toHaveBeenCalled();
			expect(store.states.rebuildData[0].states.size).toBe(80);
			restoreLarger();
			wrapper.unmount();
		});
	});

	describe('Placeholder fallback size', () => {
		it('reads the current skeleton size for every batch', async () => {
			const heights = { value: 30 };
			const proto = HTMLElement.prototype;
			const descriptor = Object.getOwnPropertyDescriptor(proto, 'offsetHeight')!;
			Object.defineProperty(proto, 'offsetHeight', {
				configurable: true,
				get(this: HTMLElement) {
					return this.querySelector(':scope > .ph') ? heights.value : 0;
				}
			});

			// 请求由测试控制：借此停在「占位已分配、数据还没到」的时刻
			let settle: (v: any) => void = () => {};
			const loadData = vi.fn(() => new Promise<any>((resolve) => { settle = resolve; }));
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} batchCount={2} loadData={loadData as any}>
					{{
						default: ({ row }: any) => <div class="x">{row.id}</div>,
						placeholder: () => <div class="ph">ph</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			const store = listRef.value.store;
			const placeholders = () => store.states.rebuildData.filter((node: any) => node.states.isPlaceholder);
			const firstBatch = new Set(placeholders());
			expect(placeholders().map((node: any) => node.states.size)).toEqual([30, 30]);

			// 骨架自身尺寸变了（例如列表变宽），下一批占位应按新尺寸测量
			heights.value = 50;
			settle({ data: buildItems(2), finished: false });
			for (let i = 0; i < 10; i++) await sleep(0);
			// 触发下一页请求（jsdom 里几何为 0，不会自动续载）
			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			wrapEl.dispatchEvent(new Event('scroll'));
			const nextBatch = () => placeholders().filter((node: any) => !firstBatch.has(node));
			const pending = () => nextBatch().length < 2 || nextBatch().some((node: any) => node.states.size === 0);
			for (let i = 0; i < 40 && pending(); i++) await sleep(0);

			expect(nextBatch().map((node: any) => node.states.size)).toEqual([50, 50]);

			Object.defineProperty(proto, 'offsetHeight', descriptor);
			wrapper.unmount();
		});
	});

	describe('Exposed API', () => {
		it('exposes store / hasPlaceholder / renderer / methods', async () => {
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} />
			), { attachTo: document.body });
			await nextTick();

			const exposed = listRef.value;
			expect(exposed.store).toBeInstanceOf(RecycleListStore);
			expect('hasPlaceholder' in exposed).toBe(true);
			expect(exposed.renderer).toBeDefined();
			expect(typeof exposed.reset).toBe('function');
			expect(typeof exposed.scrollTo).toBe('function');
			expect(typeof exposed.scrollToIndex).toBe('function');
			expect(typeof exposed.refreshLayout).toBe('function');
		});

		it('scrollTo accepts number (axis) or object {x,y}', async () => {
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} />
			), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;

			listRef.value.scrollTo(120);
			expect(wrapEl.scrollTop).toBe(120);

			listRef.value.scrollTo({ x: 60, y: 200 });
			expect(wrapEl.scrollLeft).toBe(60);
			expect(wrapEl.scrollTop).toBe(200);
		});

		it('scrollTo with vertical=false uses x axis when number is given', async () => {
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} vertical={false} />
			), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;

			listRef.value.scrollTo(80);
			expect(wrapEl.scrollLeft).toBe(80);
		});

		it('scrollToIndex jumps to the item top', async () => {
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={buildItems(3)}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const target = listRef.value.store.states.rebuildData[1];
			if (target) {
				target.states.position = 200;
			}

			listRef.value.scrollToIndex(1, 10);
			expect(wrapEl.scrollTop).toBe(210);
		});

		it('reset clears state and re-loads data', async () => {
			const loadData = vi.fn(async () => buildItems(3));
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();
			expect(loadData).toHaveBeenCalledTimes(1);

			await listRef.value.reset();
			expect(loadData).toHaveBeenCalledTimes(2);
			expect(listRef.value.store.states.isEnd).toBe(false);
		});

		it('refreshLayout exists and runs without throwing', async () => {
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={buildItems(2)}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await expect(listRef.value.refreshLayout()).resolves.not.toThrow();
		});
	});

	describe('Events', () => {
		it('emits scroll event on wrapper scroll', async () => {
			const onScroll = vi.fn();
			const wrapper = mount(() => (
				<RecycleList onScroll={onScroll} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 200,
				offsetHeight: 200,
				scrollHeight: 1000
			});

			wrapEl.scrollTop = 50;
			wrapEl.dispatchEvent(new Event('scroll'));
			await nextTick();

			expect(onScroll).toHaveBeenCalled();
			restore();
			wrapper.unmount();
		});
	});

	describe('lazyTail', () => {
		// 默认 false 时立即渲染，已由 Structure 的 'renders header and footer slots' 覆盖

		it('delays the footer slot until isEnd when not inverted', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((resolve) => { resolveFn = resolve; });

			const wrapper = mount(() => (
				<RecycleList lazyTail loadData={loadData as any}>
					{{
						header: () => <div class="my-header">HEADER</div>,
						footer: () => <div class="my-footer">FOOTER</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			// 加载中：末端(footer)隐藏，另一端(header)不受影响
			expect(wrapper.find('.my-footer').exists()).toBe(false);
			expect(wrapper.find('.my-header').exists()).toBe(true);

			resolveFn(false);
			await sleep(0);
			await nextTick();

			expect(wrapper.find('.my-footer').exists()).toBe(true);
			wrapper.unmount();
		});

		it('delays the header slot instead when inverted', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((resolve) => { resolveFn = resolve; });

			const wrapper = mount(() => (
				<RecycleList lazyTail inverted loadData={loadData as any}>
					{{
						header: () => <div class="my-header">HEADER</div>,
						footer: () => <div class="my-footer">FOOTER</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			// inverted 下数据向上生长，末端是 header
			expect(wrapper.find('.my-header').exists()).toBe(false);
			expect(wrapper.find('.my-footer').exists()).toBe(true);

			resolveFn(false);
			await sleep(0);
			await nextTick();

			expect(wrapper.find('.my-header').exists()).toBe(true);
			wrapper.unmount();
		});

		it('keeps both slots when lazyTail is false even before isEnd', async () => {
			const loadData = () => new Promise(() => {});

			const wrapper = mount(() => (
				<RecycleList loadData={loadData as any}>
					{{
						header: () => <div class="my-header">HEADER</div>,
						footer: () => <div class="my-footer">FOOTER</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			expect(wrapper.find('.my-header').exists()).toBe(true);
			expect(wrapper.find('.my-footer').exists()).toBe(true);
			wrapper.unmount();
		});

		it('hides the tail slot again after reset()', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((resolve) => { resolveFn = resolve; });
			const listRef = ref<any>();

			const wrapper = mount(() => (
				<RecycleList ref={listRef} lazyTail loadData={loadData as any}>
					{{ footer: () => <div class="my-footer">FOOTER</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			resolveFn(false);
			await sleep(0);
			await nextTick();
			expect(wrapper.find('.my-footer').exists()).toBe(true);

			const pending = listRef.value.reset();
			await nextTick();
			expect(listRef.value.store.states.isEnd).toBe(false);
			expect(wrapper.find('.my-footer').exists()).toBe(false);

			resolveFn(false);
			await pending;
			await nextTick();
			expect(wrapper.find('.my-footer').exists()).toBe(true);
			wrapper.unmount();
		});
	});

	describe('load-change event', () => {
		it('emits an immediate snapshot on mount, then tracks isLoading / isEnd', async () => {
			const onLoadChange = vi.fn();
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((resolve) => { resolveFn = resolve; });

			const wrapper = mount(() => (
				<RecycleList onLoadChange={onLoadChange} loadData={loadData as any} />
			), { attachTo: document.body });

			// immediate: 挂载即有初值，外层不必自己兜
			expect(onLoadChange).toHaveBeenNthCalledWith(1, {
				isEnd: false,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: false,
				loaded: 0
			});

			await nextTick();
			await nextTick();
			expect(onLoadChange).toHaveBeenLastCalledWith(
				expect.objectContaining({ isLoading: true, isEnd: false })
			);

			resolveFn(false);
			await sleep(0);
			await nextTick();

			// 无数据且已结束 => isEmpty
			expect(onLoadChange).toHaveBeenLastCalledWith({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: true,
				loaded: 0
			});
			wrapper.unmount();
		});

		it('reports isEmpty=false once real nodes exist', async () => {
			const onLoadChange = vi.fn();
			const wrapper = mount(() => (
				<RecycleList data={buildItems(3)} onLoadChange={onLoadChange}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			expect(onLoadChange).toHaveBeenLastCalledWith({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: false,
				loaded: 3
			});
			wrapper.unmount();
		});

		it('payload is a one-way snapshot; mutating it does not write back', async () => {
			const seen: any[] = [];
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					data={buildItems(3)}
					onLoadChange={(v: any) => seen.push(v)}
				>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			const last = seen[seen.length - 1];
			expect(last.isEnd).toBe(true);

			last.isEnd = false;
			last.isEmpty = true;
			await nextTick();

			expect(listRef.value.store.states.isEnd).toBe(true);
			expect(wrapper.find('.vc-recycle-list__complete').exists()).toBe(true);
			expect(wrapper.find('.vc-recycle-list__empty').exists()).toBe(false);
			wrapper.unmount();
		});
	});

	describe('load-change loaded', () => {
		it('pushes loaded after every local batch is built and laid out', async () => {
			// 列表可见（有宽高）才会在一批结束后仍停在加载边缘时续建
			const restore = mockSize(HTMLElement.prototype, { offsetHeight: 40, offsetWidth: 100 });
			const seen: any[] = [];
			const listRef = ref<any>();
			// 隐藏池首片渲染 10 条：挂载时并发的首批先排完版，下一批还在等后面的分片
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					disabled
					batchCount={10}
					data={buildItems(30)}
					onLoadChange={(v: any) => seen.push({ ...v, pending: listRef.value?.store.nodes.pending.size })}
				>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await flushLayout();
			restore();

			// 并发的布局全部结束才推送：推出的 loaded 里没有待测量的节点
			expect(seen.slice(1).map(v => v.pending)).toEqual(seen.slice(1).map(() => 0));
			// 布尔字段在中间批次都不变，推送来自 loaded 的变化
			const values = seen.map(v => v.loaded);
			expect(values[0]).toBe(0);
			expect(values[values.length - 1]).toBe(30);
			expect(values.length).toBeGreaterThan(2);
			expect(values.every((v, i) => i === 0 || v > values[i - 1])).toBe(true);
			expect(seen[seen.length - 1]).toMatchObject({ isEnd: true, isEmpty: false, loaded: 30 });
			wrapper.unmount();
		});

		it('pushes loaded after every remote page is laid out', async () => {
			// 每项 40px、视口 1000px：内容不足一屏，逐页续载直到空页结束
			const heightSpy = spyOffsetHeight(1000, 40);
			const seen: any[] = [];
			const loadData = vi.fn(async ({ page }: any) => (page <= 2 ? buildItems(3, page, (page - 1) * 3) : []));
			const wrapper = mount(() => (
				<RecycleList loadData={loadData} onLoadChange={(v: any) => seen.push(v)}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await flushLayout();
			heightSpy.mockRestore();

			expect(loadData.mock.calls.map(([v]) => v)).toEqual([
				{ page: 1, loaded: 0 },
				{ page: 2, loaded: 3 },
				{ page: 3, loaded: 6 }
			]);
			// loadData 收到的 loaded 与 load-change 推出的 loaded 是同一个数
			expect([...new Set(seen.map(v => v.loaded))]).toEqual([0, 3, 6]);
			expect(seen[seen.length - 1]).toEqual({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: false,
				loaded: 6
			});
			wrapper.unmount();
		});

		it('follows data replacement and reset', async () => {
			const seen: any[] = [];
			const listRef = ref<any>();
			const data = ref(buildItems(5));
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					disabled
					data={data.value}
					onLoadChange={(v: any) => seen.push(v)}
				>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await flushLayout();
			expect(seen[seen.length - 1].loaded).toBe(5);

			data.value = buildItems(2, 2, 100);
			await flushLayout();
			expect(seen[seen.length - 1]).toMatchObject({ isEnd: true, loaded: 2 });

			data.value = [];
			await flushLayout();
			expect(seen[seen.length - 1]).toMatchObject({ isEnd: true, isEmpty: true, loaded: 0 });
			wrapper.unmount();
		});
	});

	describe('ScrollState follows the shared load state', () => {
		it('shows complete for a disabled list once local data is built, without a loading area', async () => {
			const wrapper = mount(() => (
				<RecycleList data={buildItems(3)} disabled>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });
			await nextTick();
			await sleep(0);
			await nextTick();

			// disabled 不会发起远程请求：没有「加载中」区域，本地数据构建完即展示完成
			expect(wrapper.find('.vc-recycle-list__loading').exists()).toBe(false);
			expect(wrapper.find('.vc-recycle-list__complete').exists()).toBe(true);
			wrapper.unmount();
		});

		it('shows empty for a disabled list without data', async () => {
			const wrapper = mount(() => (
				<RecycleList data={[]} disabled>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });
			await nextTick();
			await sleep(0);
			await nextTick();

			expect(wrapper.find('.vc-recycle-list__empty').exists()).toBe(true);
			expect(wrapper.find('.vc-recycle-list__complete').exists()).toBe(false);
			wrapper.unmount();
		});
	});

	describe('disabled end signal', () => {
		// disabled 挡住远程分支，store.states.isEnd 永不置真；
		// lazyTail 与 load-change 以「本地数据已全部构建并完成布局」作为结束
		it('reveals the tail and reports isEnd once local data is fully built', async () => {
			const seen: any[] = [];
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					disabled
					lazyTail
					data={buildItems(3)}
					onLoadChange={(v: any) => seen.push(v)}
				>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						footer: () => <div class="my-footer">FOOTER</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await flushLayout(6);

			expect(wrapper.find('.my-footer').exists()).toBe(true);
			expect(seen[seen.length - 1]).toEqual({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: false,
				loaded: 3
			});
			// 远程语义不变：ScrollState 与现有用例依赖的 store.states.isEnd 仍为 false
			expect(listRef.value.store.states.isEnd).toBe(false);
			expect(listRef.value.store.states.isBuilt).toBe(true);
			wrapper.unmount();
		});

		it('keeps the tail hidden while local data still has unbuilt batches', async () => {
			const seen: any[] = [];
			const listRef = ref<any>();
			// jsdom 下几何全为 0，remain = -threshold，默认阈值会被判定为「接近加载边缘」而一路续建；
			// threshold=-1 关掉边缘续建，只剩初始一页 + 挂载时一页 = 8/10，保持有未构建数据
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					disabled
					lazyTail
					threshold={-1}
					batchCount={4}
					data={buildItems(10)}
					onLoadChange={(v: any) => seen.push(v)}
				>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						footer: () => <div class="my-footer">FOOTER</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await flushLayout(6);

			expect(listRef.value.store.local.hasMore).toBe(true);
			expect(listRef.value.store.states.isBuilt).toBe(false);
			expect(wrapper.find('.my-footer').exists()).toBe(false);
			expect(seen[seen.length - 1].isEnd).toBe(false);
			wrapper.unmount();
		});

		it('reports isEmpty for an empty disabled list', async () => {
			const seen: any[] = [];
			const wrapper = mount(() => (
				<RecycleList disabled data={[]} onLoadChange={(v: any) => seen.push(v)} />
			), { attachTo: document.body });

			await flushLayout(6);

			expect(seen[seen.length - 1]).toEqual({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: true,
				loaded: 0
			});
			wrapper.unmount();
		});

		it('does not flip back to unfinished when data is replaced with the same length', async () => {
			const seen: any[] = [];
			const data = ref(buildItems(3));
			const wrapper = mount(() => (
				<RecycleList
					disabled
					lazyTail
					data={data.value}
					onLoadChange={(v: any) => seen.push(v)}
				>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						footer: () => <div class="my-footer">FOOTER</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await flushLayout(6);
			expect(wrapper.find('.my-footer').exists()).toBe(true);
			const emittedBefore = seen.length;

			// 如 Table 排序：整体替换为等长的新数组，节点会被重置为待测量
			data.value = buildItems(3, 2, 100);
			await nextTick();
			expect(wrapper.find('.my-footer').exists()).toBe(true);

			await flushLayout(6);
			expect(wrapper.find('.my-footer').exists()).toBe(true);
			expect(seen.slice(emittedBefore).some(v => v.isEnd === false)).toBe(false);
			wrapper.unmount();
		});
	});

	describe('Inverted mode', () => {
		it('shows scroll-state at the top (before content) when inverted', async () => {
			const wrapper = mount(() => (<RecycleList inverted />), { attachTo: document.body });
			await nextTick();

			const root = wrapper.find('.vc-recycle-list__wrapper .vc-scroller__content');
			expect(root.exists()).toBe(true);

			const children = Array.from(root.element.children);
			const scrollStateIndex = children.findIndex(el => el.classList.contains('vc-recycle-list__scroll-state'));
			const contentIndex = children.findIndex(el => el.classList.contains('vc-recycle-list__content'));
			expect(scrollStateIndex).toBeGreaterThanOrEqual(0);
			expect(contentIndex).toBeGreaterThan(scrollStateIndex);

			wrapper.unmount();
		});

		it('shows scroll-state at the bottom (after content) when not inverted', async () => {
			const wrapper = mount(() => (<RecycleList />), { attachTo: document.body });
			await nextTick();

			const root = wrapper.find('.vc-recycle-list__wrapper .vc-scroller__content');
			expect(root.exists()).toBe(true);

			const children = Array.from(root.element.children);
			const contentIndex = children.findIndex(el => el.classList.contains('vc-recycle-list__content'));
			const scrollStateIndex = children.findIndex(el => el.classList.contains('vc-recycle-list__scroll-state'));
			expect(contentIndex).toBeGreaterThanOrEqual(0);
			expect(scrollStateIndex).toBeGreaterThan(contentIndex);

			wrapper.unmount();
		});
	});

	describe('ScrollState rendering', () => {
		it('renders complete when isEnd and has data', async () => {
			const data = buildItems(3); // 默认loadData返回false => 挂载后isEnd
			const wrapper = mount(() => (
				<RecycleList data={data}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();
			await sleep(0);
			await nextTick();

			expect(wrapper.find('.vc-recycle-list__complete').exists()).toBe(true);
			wrapper.unmount();
		});

		it('renderComplete prop customizes complete rendering', async () => {
			const wrapper = mount(() => (
				<RecycleList
					data={buildItems(3)}
					renderComplete={() => <div class="my-complete">all loaded</div>}
				>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();
			await sleep(0);
			await nextTick();

			expect(wrapper.find('.my-complete').exists()).toBe(true);
			wrapper.unmount();
		});

		it('keeps the loading area (hidden) during a silent refresh so the list does not shift', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((resolve) => { resolveFn = resolve; });
			const listRef = ref<any>();

			const wrapper = mount(() => (
				<RecycleList ref={listRef} inverted loadData={loadData as any} />
			), { attachTo: document.body });

			await nextTick();
			await nextTick();
			const loading = () => wrapper.find('.vc-recycle-list__loading');
			expect((loading().element as HTMLElement).style.visibility).toBe('visible');

			resolveFn([{ id: 1 }]);
			await sleep(0);
			await nextTick();

			const pending = listRef.value.reset(true);
			await nextTick();
			expect(listRef.value.store.states.isSilentRefresh).toBe(true);
			expect(listRef.value.store.states.isLoading).toBe(true);
			// 静默刷新由刷新提示条表达加载中：占位保留、内容隐藏
			expect(loading().exists()).toBe(true);
			expect((loading().element as HTMLElement).style.visibility).toBe('hidden');

			resolveFn(false);
			await pending;
			wrapper.unmount();
		});

		it('renders default loading wrapper while not yet end and no placeholder', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((resolve) => { resolveFn = resolve; });

			const wrapper = mount(() => (
				<RecycleList loadData={loadData as any} />
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			expect(wrapper.find('.vc-recycle-list__loading').exists()).toBe(true);

			resolveFn(false);
			await sleep(0);
			await nextTick();
			wrapper.unmount();
		});

		it('renderLoading prop customizes loading rendering when slot missing', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((resolve) => { resolveFn = resolve; });

			const wrapper = mount(() => (
				<RecycleList
					loadData={loadData as any}
					renderLoading={() => <div class="prop-loading">prop-loading</div>}
				/>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			expect(wrapper.find('.prop-loading').exists()).toBe(true);

			resolveFn(false);
			await sleep(0);
			await nextTick();
			wrapper.unmount();
		});

		it('renders empty when isEnd and there is no real node', async () => {
			const wrapper = mount(() => (<RecycleList />), { attachTo: document.body });

			await nextTick();
			await nextTick();
			await sleep(0);
			await nextTick();

			expect(wrapper.find('.vc-recycle-list__empty').exists()).toBe(true);
			expect(wrapper.find('.vc-recycle-list__complete').exists()).toBe(false);
			wrapper.unmount();
		});

		it('forwards complete / empty slots to ScrollState', async () => {
			const withData = mount(() => (
				<RecycleList data={buildItems(3)}>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						complete: () => <div class="slot-complete">slot-complete</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			const withoutData = mount(() => (
				<RecycleList>
					{{ empty: () => <div class="slot-empty">slot-empty</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();
			await sleep(0);
			await nextTick();

			expect(withData.find('.slot-complete').exists()).toBe(true);
			expect(withoutData.find('.slot-empty').exists()).toBe(true);
			withData.unmount();
			withoutData.unmount();
		});
	});

	describe('Shared store (RecycleListStore)', () => {
		it('store can be created with options and shared between RecycleList instances', async () => {
			const loadData = vi.fn(async () => buildItems(5));
			const store = new RecycleListStore({ loadData });

			const refA = ref<any>();
			const refB = ref<any>();
			mount(() => (
				<>
					<RecycleList ref={refA} store={store}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
					<RecycleList ref={refB} store={store}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
				</>
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			expect(refA.value.store).toBe(store);
			expect(refB.value.store).toBe(store);

			// 同 store 实际只会从一个 leaf 触发 loadData
			expect(loadData).toHaveBeenCalled();
			// leafs 包含两个挂载点
			expect(store.scroll.leafs.length).toBe(2);
		});

		it('Store.setData returns true on first call and false when same array passed again', () => {
			const store = new RecycleListStore({});
			const data = buildItems(3);

			expect(store.setData(data)).toBe(true);
			expect(store.setData(data)).toBe(false);
		});

		it('batchCount controls local lazy build page size', () => {
			const store = new RecycleListStore({ batchCount: 8 });
			store.setData(buildItems(20));

			// 初始按batchCount构建一页
			expect(store.states.rebuildData.length).toBe(8);
			expect(store.local.consumePage()).toEqual({ start: 8, end: 16, reversed: false });
			// 尾页不足batchCount时取剩余量
			expect(store.local.consumePage()).toEqual({ start: 16, end: 20, reversed: false });
			expect(store.local.consumePage()).toBe(null);
		});

		it('batchCount defaults to 20', () => {
			const store = new RecycleListStore({});
			store.setData(buildItems(30));

			expect(store.states.rebuildData.length).toBe(20);
			expect(store.local.consumePage()).toEqual({ start: 20, end: 30, reversed: false });
		});

		it('Store.setData does NOT mark isEnd', () => {
			const store = new RecycleListStore({});

			store.setData(buildItems(3));
			expect(store.states.isEnd).toBe(false);
		});

		it('Store add / remove updates leafs and currentLeaf', () => {
			const store = new RecycleListStore({});

			const a = { id: 'A' } as any;
			const b = { id: 'B' } as any;

			store.scroll.add(a);
			store.scroll.add(b);

			expect(store.scroll.currentLeaf).toBe(a);
			expect(store.scroll.leafs).toEqual([a, b]);

			store.scroll.remove(a);
			expect(store.scroll.leafs).toEqual([b]);
		});

		it('Local.write places items at given start offset', () => {
			const store = new RecycleListStore({});
			store.local.write(3, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

			expect(store.local.originalData[3]).toEqual({ id: 'a' });
			expect(store.local.originalData[4]).toEqual({ id: 'b' });
			expect(store.local.originalData[5]).toEqual({ id: 'c' });
		});
	});

	describe('Scroller options', () => {
		it('passes scrollerOptions through to inner Scroller', () => {
			const wrapper = mount(() => (
				<RecycleList scrollerOptions={{ native: true, height: '300px' } as any} />
			));

			const wrap = wrapper.find('.vc-recycle-list__wrapper');
			expect(wrap.classes()).toContain('is-native');
			expect(wrap.attributes('style') ?? '').toContain('height: 300px');
		});

		it('drives the inner Scroller by wheel unless scrollerOptions.wheel=false', () => {
			const w1 = mount(() => (
				<RecycleList scrollerOptions={{ native: false } as any} />
			));
			expect(w1.find('.vc-recycle-list__wrapper').classes()).toContain('is-wheel');

			const w2 = mount(() => (
				<RecycleList scrollerOptions={{ native: false, wheel: false } as any} />
			));
			expect(w2.find('.vc-recycle-list__wrapper').classes()).not.toContain('is-wheel');

			// undefined 视为未设置，不覆盖默认的滚轮驱动
			const w3 = mount(() => (
				<RecycleList scrollerOptions={{ native: false, wheel: undefined } as any} />
			));
			expect(w3.find('.vc-recycle-list__wrapper').classes()).toContain('is-wheel');
		});
	});

	describe('Inverted mode - additional behavior', () => {
		it('inverted setData supports setting up store correctly', async () => {
			const data = buildItems(6);
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} inverted disabled data={data}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();

			expect(listRef.value.store.props.inverted).toBe(true);
			expect(listRef.value.store.states.rebuildData.length).toBe(6);
		});

		it('inverted + placeholder triggers loadData (covering setItemData placeholder fill path)', async () => {
			const loadData = vi.fn(async () => buildItems(3));
			const listRef = ref<any>();
			// 本地数据构建完后，onMounted 的 loadData() 进入 hasPlaceholder + inverted 分支
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					inverted
					data={buildItems(3)}
					loadData={loadData}
					batchCount={3}
				>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						placeholder: () => <div class="ph">ph</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();
			await sleep(20);
			await nextTick();

			// data=3 已存在，placeholder 分支会再追加 3 个占位
			expect(listRef.value.store.states.rebuildData.length).toBeGreaterThanOrEqual(3);
			wrapper.unmount();
		});

		it('inverted placeholder does not request another page while the current page is pending', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = vi.fn(() => new Promise((resolve) => { resolveFn = resolve; }));
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} inverted loadData={loadData as any}>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						placeholder: () => <div class="ph">ph</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			for (let i = 0; i < 10 && loadData.mock.calls.length === 0; i++) {
				await sleep(0);
			}
			for (let i = 0; i < 10; i++) {
				await sleep(0);
			}
			await nextTick();

			expect(loadData).toHaveBeenCalledTimes(1);
			expect(listRef.value.store.states.rebuildData).toHaveLength(20);
			expect(wrapper.findAll('.vc-recycle-list__column .ph')).toHaveLength(20);

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			for (let i = 0; i < 3; i++) {
				wrapEl.dispatchEvent(new Event('scroll'));
				await sleep(20);
			}
			expect(loadData).toHaveBeenCalledTimes(1);
			expect(listRef.value.store.states.rebuildData).toHaveLength(20);

			resolveFn(false);
			await sleep(0);
			wrapper.unmount();
		});

		it('inverted placeholder keeps the current rows rendered while prepending a page', async () => {
			let resolveSecondPage: (v: any) => void = () => {};
			const loadData = vi.fn(({ page }: any) => {
				return page === 1
					? Promise.resolve(buildItems(20))
					: new Promise(resolve => (resolveSecondPage = resolve));
			});
			const heightSpy = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
				if (!this.classList.contains('vc-recycle-list__hidden')) return 0;
				if (this.querySelector('.ph')) return 100;
				if (this.querySelector('.row')) return 60;
				return 0;
			});
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} inverted batchCount={20} loadData={loadData}>
					{{
						default: ({ row }: any) => <div class="row">{row.id}</div>,
						placeholder: () => <div class="ph">ph</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			try {
				const store = listRef.value.store;
				for (let i = 0; i < 50 && (store.states.isLoading || store.states.contentMaxSize !== 1200); i++) {
					await sleep(0);
				}
				await sleep(20);
				await nextTick();

				expect(loadData).toHaveBeenCalledTimes(1);
				expect(store.states.contentMaxSize).toBe(1200);

				const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
				const triggerPosition = 80;
				const anchor = store.states.rebuildData.find((item: any) => {
					const head = item.states.position + store.states.columnFillSize[item.states.column];
					return head <= triggerPosition && head + item.states.size >= triggerPosition;
				});
				expect(anchor).toBeDefined();
				const anchorOffset = anchor.states.position
					+ store.states.columnFillSize[anchor.states.column]
					- triggerPosition;

				listRef.value.scrollTo(triggerPosition);
				for (let i = 0; i < 30 && loadData.mock.calls.length < 2; i++) {
					await sleep(0);
				}
				await nextTick();

				expect(loadData).toHaveBeenCalledTimes(2);
				expect(store.states.rebuildData.filter((item: any) => item.states.isPlaceholder)).toHaveLength(20);
				expect(wrapper.findAll('.vc-recycle-list__column .row').length).toBeGreaterThan(0);
				expect(wrapEl.scrollTop).toBe(2080);
				const pendingAnchor = store.states.rebuildData.find((item: any) => item.states.index === anchor.states.index);
				const pendingOffset = pendingAnchor.states.position
					+ store.states.columnFillSize[pendingAnchor.states.column]
					- wrapEl.scrollTop;
				expect(pendingOffset).toBe(anchorOffset);

				resolveSecondPage(buildItems(20, 2, 20));
				for (let i = 0; i < 50 && (store.states.isLoading || store.states.rebuildData.some((item: any) => item.states.isPlaceholder)); i++) {
					await sleep(0);
				}
				await nextTick();

				const changedAnchor = store.states.rebuildData.find((item: any) => item.states.index === anchor.states.index);
				const changedOffset = changedAnchor.states.position
					+ store.states.columnFillSize[changedAnchor.states.column]
					- wrapEl.scrollTop;
				expect(changedOffset).toBe(anchorOffset);
			} finally {
				wrapper.unmount();
				heightSpy.mockRestore();
			}
		});

		it('non-inverted loadData with placeholder allocates rebuildData length', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = vi.fn(() => new Promise((resolve) => { resolveFn = resolve; }));

			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					loadData={loadData as any}
				>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						placeholder: () => <div class="ph">ph</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();
			for (let i = 0; i < 10 && loadData.mock.calls.length === 0; i++) {
				await sleep(0);
			}
			await nextTick();

			// 还没 resolve 时，rebuildData.length 已经被预扩展 batchCount 个占位
			expect(listRef.value.store.states.rebuildData.length).toBe(20);
			expect(wrapper.findAll('.vc-recycle-list__column .ph')).toHaveLength(20);
			// 纯占位批次无需等待 Defer；否则 preData 为空，complete 不会触发，请求会永久阻塞
			expect(loadData).toHaveBeenCalledTimes(1);
			expect(loadData).toHaveBeenCalledWith({ page: 1, loaded: 0 });

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, {
				clientHeight: 200,
				offsetHeight: 200,
				scrollHeight: 1000
			});
			wrapEl.scrollTop = 950;
			for (let i = 0; i < 3; i++) {
				wrapEl.dispatchEvent(new Event('scroll'));
				await sleep(0);
			}
			expect(loadData).toHaveBeenCalledTimes(1);
			expect(listRef.value.store.states.rebuildData).toHaveLength(20);

			resolveFn(buildItems(20));
			const isLayoutComplete = () => listRef.value.store.states.rebuildData.every((item: any) => {
				return !item.states.isPlaceholder && item.states.position >= 0;
			});
			for (let i = 0; i < 20 && !isLayoutComplete(); i++) {
				await sleep(0);
			}
			await nextTick();

			expect(listRef.value.store.states.rebuildData.every((item: any) => !item.states.isPlaceholder)).toBe(true);
			expect(listRef.value.store.states.rebuildData.every((item: any) => item.states.position >= 0)).toBe(true);
			restore();
			wrapper.unmount();
		});
	});

	describe('inverted build keeps the visible range inside rebuildData', () => {
		// 模拟远程分页落地：写入 originalData 后按区间构建，与 fetchPage + layoutRange 的路径一致
		const landPage = (store: any, start: number, count: number, size = 50) => {
			store.local.write(start, buildItems(count, 1, start));
			store.nodes.build(start, start + count).forEach((node: any) => {
				node.states.size = size;
			});
			store.layout.refresh();
		};
		const expectInRange = (store: any) => {
			const { firstItemIndex, lastItemIndex, rebuildData } = store.states;
			expect.soft(firstItemIndex).toBeGreaterThanOrEqual(0);
			expect.soft(lastItemIndex).toBeLessThan(rebuildData.length);
			expect.soft(firstItemIndex).toBeLessThanOrEqual(lastItemIndex);
		};

		it('first page on mount', () => {
			const store = new RecycleListStore({ inverted: true });
			landPage(store, 0, 20);
			expectInRange(store);
		});

		it('first page after clear() in a silent refresh', () => {
			const store = new RecycleListStore({ inverted: true });
			landPage(store, 0, 20);
			landPage(store, 20, 20);
			// 视口停在底部（inverted 的最新内容）：内容 40 × 50 = 2000
			store.position.updateVisibleRange(1650, 2000);
			expect(store.states.lastItemIndex).toBeLessThan(store.states.rebuildData.length);

			// reset(true)：请求发出时 reset，响应到达后 clear，再落地第 1 页
			store.reset();
			store.clear();
			landPage(store, 0, 20);
			expectInRange(store);

			// 视口仍在旧位置、落在新内容（20 × 50 = 1000）之外时保持原范围，不能因此渲染成空白
			store.position.updateVisibleRange(1650, 2000);
			expect.soft(store.states.data.flat().length).toBeGreaterThan(0);
		});
	});

	describe('Position.updateVisibleRange / Layout.refresh', () => {
		it('keeps a valid range for a list that is still empty at mount', async () => {
			// 远程数据还没到时视口已绑定：空列表的范围为 [0, 0]，数据到达后视口在内容之外也能保留首项
			const listRef = ref<any>();
			const wrapper = mount(() => <RecycleList ref={listRef} disabled />, { attachTo: document.body });
			await nextTick();
			const { states } = listRef.value.store;
			expect([states.firstItemIndex, states.lastItemIndex]).toEqual([0, 0]);
			wrapper.unmount();
		});

		it('stores the raw data item on a new node', () => {
			const item = reactive({ id: 1 });
			const node = RecycleListItemNode.of({ index: 0, data: item });
			expect(node.raw.data).toBe(toRaw(item));
		});

		it('updateVisibleRange with empty rebuildData resets indexes', () => {
			const store = new RecycleListStore({});
			store.states.rebuildData = [];
			store.position.updateVisibleRange(0, 100);
			expect(store.states.firstItemIndex).toBe(0);
			expect(store.states.lastItemIndex).toBe(0);
		});

		it('refreshItemPosition computes contentMaxSize and column distribution (cols=2)', () => {
			const store = new RecycleListStore({ cols: 2 });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]);
			store.states.rebuildData.forEach((it: any, i: number) => {
				it.states.size = (i + 1) * 10; // 10, 20, 30, 40
			});

			store.layout.refresh();

			// 列大小: 第一项进列0, 第二项进列1（最小都是0），然后比较
			// 0 -> col0 size=10, 1 -> col1 size=20, 2 -> col0 size=10+30=40, 3 -> col1 size=20+40=60
			// contentMaxSize = max(40, 60) = 60
			expect(store.states.contentMaxSize).toBe(60);
			expect(store.states.columnFillSize.length).toBe(2);
			expect(store.states.columnFillSize[1]).toBe(0); // 最高的 column 不需要填充
		});

		it('re-lays out rebound nodes when re-measured sizes are unchanged (resize refresh)', () => {
			// 回归用例：窗口resize -> 强制重建 + 重测得到相同尺寸；
			// 增量重排若只对比size会漏掉rebind重置的column/position，导致整段白屏
			const total = 600; // 需要超过一个重排块(256)，否则增量路径不会跳过前面的块
			const store = new RecycleListStore({ batchCount: total });
			store.setData(buildItems(total));
			store.states.rebuildData.forEach((it: any) => { it.states.size = 50; });
			store.layout.refresh();
			expect(store.states.contentMaxSize).toBe(total * 50);

			store.nodes.build(0, total, { force: true });
			store.states.rebuildData.forEach((it: any) => { it.states.size = 50; });
			store.layout.refresh();

			expect(store.states.rebuildData.every((it: any) => it.states.column >= 0)).toBe(true);
			expect(store.states.rebuildData.every((it: any, i: number) => it.states.position === i * 50)).toBe(true);
			expect(store.states.contentMaxSize).toBe(total * 50);
		});

		it('re-measures nodes whose measured size came back as 0', () => {
			const store = new RecycleListStore({ batchCount: 3 });
			store.setData(buildItems(3));

			// 首次构建时列表不可见，尺寸读到 0
			const first = store.nodes.build(0, 3);
			expect(first.length).toBe(3);
			first.forEach((node: any) => store.nodes.setSize(node, 0));

			// 再次构建时它们仍然待测，不能被当成已完成而跳过
			expect(store.nodes.build(0, 3).length).toBe(3);
		});

		it('trimPlaceholders trims trailing placeholders', () => {
			const store = new RecycleListStore({});
			store.states.rebuildData = [
				RecycleListItemNode.of({ index: 0, data: { id: 0 } }),
				RecycleListItemNode.of({ index: 1, data: { id: 1 } }),
				RecycleListItemNode.of({ index: 2 }) // 还没加载到的占位
			] as any;

			expect(store.nodes.trimPlaceholders()).toBe(true);
			expect(store.states.rebuildData.length).toBe(2);
			// 无可裁剪时返回false
			expect(store.nodes.trimPlaceholders()).toBe(false);
		});

		it('Store.setItemData stores node with data when provided, placeholder otherwise', () => {
			const store = new RecycleListStore({});
			store.nodes.upsert(0, { value: 'a' });
			store.nodes.upsert(1);

			const a = store.states.rebuildData[0];
			const b = store.states.rebuildData[1];
			expect(a.states.isPlaceholder).toBe(false);
			expect(a.states.data).toEqual({ value: 'a' });
			expect(a.states.index).toBe(0);
			expect(a.states.size).toBe(0);
			expect(b.states.isPlaceholder).toBe(true);
			expect(typeof a.id).toBe('string');
		});

		it('Scroll.broadcast forwards to all leafs except currentLeaf', () => {
			const store = new RecycleListStore({});
			const a = { exposed: { scrollTo: vi.fn() } };
			const b = { exposed: { scrollTo: vi.fn() } };

			store.scroll.add(a);
			store.scroll.add(b); // currentLeaf=a

			store.scroll.broadcast({ target: { scrollLeft: 10, scrollTop: 20 } });

			expect((a as any).exposed.scrollTo).not.toHaveBeenCalled();
			expect((b as any).exposed.scrollTo).toHaveBeenCalledWith({ x: 10, y: 20 });
		});

		it('Scroll.broadcast no-ops when no currentLeaf', () => {
			const store = new RecycleListStore({});
			expect(() => store.scroll.broadcast({ target: { scrollLeft: 10, scrollTop: 20 } })).not.toThrow();
		});

		// 直接构造已排好版的节点，并像正常构建一样登记到节点池（rebuildData 与节点集合保持同步）
		const layoutNode = (
			store: InstanceType<typeof RecycleListStore>,
			index: number,
			geometry: { position: number; size: number; column?: number }
		) => {
			const node = RecycleListItemNode.of({ index, data: { id: index } });
			node.states.position = geometry.position;
			node.states.size = geometry.size;
			node.states.column = geometry.column ?? 0;
			return store.nodes.attach(index, node);
		};

		it('Position.updateVisibleRange updates the range when scrolling back to the top', () => {
			const store = new RecycleListStore({ cols: 1, bufferCount: 0 });
			store.states.rebuildData = Array.from({ length: 10 }).map((_, i) => layoutNode(store, i, {
				position: i * 100,
				size: 100
			})) as any;

			// 先定位到底部
			store.position.updateVisibleRange(800, 900);
			expect(store.states.firstItemIndex).toBeGreaterThan(0);

			// 再往回滚到顶部
			store.position.updateVisibleRange(0, 50);
			expect(store.states.firstItemIndex).toBe(0);
		});

		it('Position.updateVisibleRange includes the previous item at a shared boundary', () => {
			const store = new RecycleListStore({ cols: 1, bufferCount: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;

			store.position.updateVisibleRange(101, 150);
			expect(store.states.firstItemIndex).toBe(1);

			store.position.updateVisibleRange(100, 150);
			expect(store.states.firstItemIndex).toBe(0);
		});

		it('Position.updateVisibleRange handles non-monotonic inverted multi-column positions', () => {
			const store = new RecycleListStore({ cols: 2, inverted: true, bufferCount: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 10, column: 0 }),
				layoutNode(store, 1, { position: 10, size: 10, column: 0 }),
				layoutNode(store, 2, { position: 20, size: 10, column: 0 }),
				layoutNode(store, 3, { position: 0, size: 100, column: 1 })
			] as any;
			store.states.columnFillSize = [70, 0];

			store.position.updateVisibleRange(85, 85);

			expect(store.states.firstItemIndex).toBe(1);
			expect(store.states.lastItemIndex).toBe(3);
		});

		it('Position.updateVisibleRange uses content-local coordinates for inverted lists', () => {
			const store = new RecycleListStore({ cols: 1, inverted: true, bufferCount: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;
			store.states.columnFillSize = [0];

			store.position.updateVisibleRange(100, 100);

			expect(store.states.firstItemIndex).toBe(0);
			expect(store.states.lastItemIndex).toBe(1);
		});

		it('converts wrapper scroll position to the content-local range', async () => {
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} inverted disabled />
			), { attachTo: document.body });
			await nextTick();

			const store = listRef.value.store;
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;
			store.states.columnFillSize = [0];

			const contentEl = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
			const restore = defineGetter(contentEl, 'offsetTop', 60);
			listRef.value.scrollTo(160);

			expect(store.states.firstItemIndex).toBe(0);
			expect(store.states.lastItemIndex).toBe(1);
			restore();
			wrapper.unmount();
		});

		it.each([
			{ overscan: undefined, vertical: true, expected: [0, 2] },
			{ overscan: 0, vertical: true, expected: [1, 1] },
			{ overscan: undefined, vertical: false, expected: [0, 2] }
		])('expands the $vertical range by overscan=$overscan', async ({ overscan, vertical, expected }) => {
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					disabled
					vertical={vertical}
					{...(typeof overscan === 'number' ? { overscan } : {})}
				/>
			), { attachTo: document.body });
			await nextTick();

			const store = listRef.value.store;
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 }),
				layoutNode(store, 2, { position: 200, size: 100 })
			] as any;
			store.states.columnFillSize = [0];
			store.states.contentMaxSize = 300;

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const restore = mockSize(wrapEl, vertical
				? { clientHeight: 80, offsetHeight: 80, scrollHeight: 300 }
				: { clientWidth: 80, offsetWidth: 80, scrollWidth: 300 });
			listRef.value.scrollTo(vertical ? 110 : { x: 110 });

			expect([store.states.firstItemIndex, store.states.lastItemIndex]).toEqual(expected);
			restore();
			wrapper.unmount();
		});

		it('Position.updateVisibleRange handles generated inverted positions', () => {
			const store = new RecycleListStore({ cols: 1, inverted: true });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }]);
			store.states.rebuildData.forEach((it: any, i: number) => {
				it.states.size = 50;
				it.states.column = 0;
				it.states.position = i * 50;
			});
			store.layout.refresh();
			expect(() => store.position.updateVisibleRange(60, 200)).not.toThrow();
		});

		it.each([
			{ cols: 3, inverted: false },
			{ cols: 1, inverted: true },
			{ cols: 3, inverted: true }
		])('Position.updateVisibleRange matches all visible items for $cols columns, inverted=$inverted', ({ cols, inverted }) => {
			const store = new RecycleListStore({ cols, inverted, batchCount: 12, bufferCount: 0 });
			store.setData(Array.from({ length: 12 }).map((_, id) => ({ id })));
			const sizes = [100, 20, 80, 40, 120, 30, 60, 90, 25, 110, 35, 70];
			store.states.rebuildData.forEach((item: any, index: number) => { item.states.size = sizes[index]; });
			store.layout.refresh();

			for (let headPosition = 0; headPosition <= store.states.contentMaxSize; headPosition += 10) {
				const tailPosition = headPosition + 75;
				const visible = store.states.rebuildData
					.map((item: any, index: number) => {
						const offset = inverted ? store.states.columnFillSize[item.states.column] : 0;
						const head = item.states.position + offset;
						const tail = head + item.states.size;
						return head <= tailPosition && tail >= headPosition ? index : -1;
					})
					.filter((index: number) => index >= 0);

				store.position.updateVisibleRange(headPosition, tailPosition);
				expect(store.states.firstItemIndex).toBe(Math.min(...visible));
				expect(store.states.lastItemIndex).toBe(Math.max(...visible));
			}
		});

		it('Position.updateVisibleRange no-ops when range unchanged', () => {
			const store = new RecycleListStore({ cols: 1 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;
			store.position.updateVisibleRange(0, 200);
			const f = store.states.firstItemIndex;
			const l = store.states.lastItemIndex;
			store.position.updateVisibleRange(0, 200); // 相同范围
			expect(store.states.firstItemIndex).toBe(f);
			expect(store.states.lastItemIndex).toBe(l);
		});

		it('Position.updateVisibleRange reads geometry updates from the current reactive source', () => {
			const store = new RecycleListStore({ cols: 1, bufferCount: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;

			store.position.updateVisibleRange(150, 150);
			expect([store.states.firstItemIndex, store.states.lastItemIndex]).toEqual([1, 1]);
			const positionSource = store.position.source;

			store.states.rebuildData[0].states.size = 200;
			store.states.rebuildData[1].states.position = 200;
			store.position.updateVisibleRange(150, 150);

			expect(store.position.source).toBe(positionSource);
			expect([store.states.firstItemIndex, store.states.lastItemIndex]).toEqual([0, 0]);
		});

		it('Position.updateVisibleRange rebuilds the column index after same-length source replacement', () => {
			const store = new RecycleListStore({ cols: 2, bufferCount: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 10, column: 0 }),
				layoutNode(store, 1, { position: 0, size: 100, column: 1 }),
				layoutNode(store, 2, { position: 10, size: 10, column: 0 })
			] as any;
			store.position.updateVisibleRange(15, 15);
			const positionSource = store.position.source;

			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100, column: 0 }),
				layoutNode(store, 1, { position: 0, size: 10, column: 1 }),
				layoutNode(store, 2, { position: 10, size: 10, column: 1 })
			] as any;
			store.position.updateVisibleRange(15, 15);

			expect(store.position.source).not.toBe(positionSource);
			expect(store.position.columns).toEqual([[0], [1, 2]]);
			expect([store.states.firstItemIndex, store.states.lastItemIndex]).toEqual([0, 2]);
		});

		it('Layout.refresh handles inverted multi-column', () => {
			const store = new RecycleListStore({ cols: 2, inverted: true });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]);
			store.states.rebuildData.forEach((it: any) => { it.states.size = 50; });
			store.layout.refresh();
			expect(store.states.contentMaxSize).toBeGreaterThan(0);
			expect(store.states.columnFillSize.length).toBe(2);
		});

		it('Layout.refresh skips sparse holes in rebuildData', () => {
			const store = new RecycleListStore({ cols: 1 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 40 }),
				null,
				layoutNode(store, 2, { position: 100, size: 20 })
			] as any;
			// 首轮：空洞写入 laidSizes=0
			store.layout.refresh();
			expect((store.layout as any).laidSizes[1]).toBe(0);
			expect(store.states.rebuildData[0].states.position).toBe(0);
			expect(store.states.rebuildData[2].states.position).toBe(40);
			expect(store.states.contentMaxSize).toBe(60);

			// 次轮：同引用、空洞仍在 → findDirtyScan 走 laidSizes===0 的 continue
			store.layout.refresh();
			expect(store.states.contentMaxSize).toBe(60);

			// 再铺满后原地挖洞 → findDirtyScan 走 laidSizes!==0 的脏点返回
			store.states.rebuildData[1] = layoutNode(store, 1, { position: 0, size: 60 }) as any;
			store.layout.refresh();
			expect(store.states.contentMaxSize).toBe(120);
			store.states.rebuildData[1] = null as any;
			expect((store.layout as any).laidSource).toBe(toRaw(store.states.rebuildData));
			store.layout.refresh();
			expect((store.layout as any).laidSizes[1]).toBe(0);
			expect(store.states.rebuildData[2].states.position).toBe(40);
			expect(store.states.contentMaxSize).toBe(60);
		});

		it('Store.setData with empty array clears rebuildData', () => {
			const store = new RecycleListStore({});
			store.setData([{ id: 0 }, { id: 1 }]);
			expect(store.states.rebuildData.length).toBe(2);

			store.setData([]);
			expect(store.states.rebuildData.length).toBe(0);
		});

		it('Store.trimPlaceholders inverted variant trims leading placeholders', () => {
			const store = new RecycleListStore({ inverted: true });
			store.states.rebuildData = [
				RecycleListItemNode.of({ index: 0 }),
				RecycleListItemNode.of({ index: 1 }),
				RecycleListItemNode.of({ index: 2, data: { id: 2 } }),
				RecycleListItemNode.of({ index: 3, data: { id: 3 } })
			] as any;

			// 反向模式下，前导 placeholder 应被裁掉
			expect(store.nodes.trimPlaceholders()).toBe(true);
			expect(store.states.rebuildData.length).toBe(2);
		});
	});

	describe('Container - pull to refresh', () => {
		// 触摸事件直接派发到根节点；鼠标按下后由 document 跟踪移动与松开（见 mouse drag 用例）
		const fireTouch = (el: Element, type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel', screenY: number) => {
			drag.fireTouch(el, type, { screenX: 0, screenY });
		};
		const fireHorizontalTouch = (el: Element, type: 'touchstart' | 'touchmove' | 'touchend', screenX: number) => {
			drag.fireTouch(el, type, { screenX, screenY: 0 });
		};
		const fireMouse = (
			el: EventTarget,
			type: 'mousedown' | 'mousemove' | 'mouseup',
			screenY: number,
			init: MouseEventInit = {}
		) => {
			drag.fireMouse(el, type, { screenY, ...init });
		};
		const settle = async () => {
			await nextTick();
			await sleep(0);
			await nextTick();
		};
		// 一次完整的触摸拉动（按下 → 移动 → 松开）并等待刷新流程推进
		const touchDrag = async (el: Element, from: number, to: number) => {
			fireTouch(el, 'touchstart', from);
			fireTouch(el, 'touchmove', to);
			fireTouch(el, 'touchend', to);
			await sleep(20);
			await nextTick();
		};
		const mountPullable = (loadData: any, props: Record<string, any> = {}) => {
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} pullable loadData={loadData} pauseOffset={30} {...props} />
			), { attachTo: document.body });
			const root = wrapper.find('.vc-recycle-list').element;
			return {
				wrapper,
				root,
				listRef,
				wrapEl: wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement,
				pull: () => root.querySelector('.vc-recycle-list__pull') as HTMLElement,
				container: () => root.querySelector('.vc-recycle-list__container') as HTMLElement
			};
		};
		const selectAll = (el: Element) => {
			const range = document.createRange();
			range.selectNodeContents(el);
			window.getSelection()!.removeAllRanges();
			window.getSelection()!.addRange(range);
		};

		it('does NOT trigger reload when not pullable', async () => {
			const loadData = vi.fn(async () => false);
			const wrapper = mount(() => (
				<RecycleList loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			const initialCalls = loadData.mock.calls.length;
			const root = wrapper.find('.vc-recycle-list').element;

			fireTouch(root, 'touchstart', 0);
			fireTouch(root, 'touchmove', 200);
			fireTouch(root, 'touchend', 200);

			await sleep(20);
			await nextTick();

			expect(loadData.mock.calls.length).toBe(initialCalls);
			wrapper.unmount();
		});

		it('triggers refresh (re-loadData) when pulled past pauseOffset and released', async () => {
			const loadData = vi.fn(async () => false);
			const wrapper = mount(() => (
				<RecycleList pullable loadData={loadData} pauseOffset={30} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			const initialCalls = loadData.mock.calls.length;

			const root = wrapper.find('.vc-recycle-list').element;

			fireTouch(root, 'touchstart', 0);
			fireTouch(root, 'touchmove', 200); // 远大于 pauseOffset 30
			await nextTick();

			fireTouch(root, 'touchend', 200);
			await sleep(20);
			await nextTick();

			expect(loadData.mock.calls.length).toBeGreaterThan(initialCalls);
			wrapper.unmount();
		});

		it('does NOT enter PENDING state when offset stays below pauseOffset', async () => {
			const loadData = vi.fn(async () => false);
			const wrapper = mount(() => (
				<RecycleList pullable loadData={loadData} pauseOffset={50} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			const initialCalls = loadData.mock.calls.length;

			const root = wrapper.find('.vc-recycle-list').element;

			fireTouch(root, 'touchstart', 0);
			fireTouch(root, 'touchmove', 10); // < pauseOffset 50
			await nextTick();
			fireTouch(root, 'touchend', 10);

			await sleep(20);
			await nextTick();
			// 未达到 pending 阈值，loadData 不应被再次触发
			expect(loadData.mock.calls.length).toBe(initialCalls);
			wrapper.unmount();
		});

		it('inverted: pulling up past pauseOffset at the end triggers refresh', async () => {
			const loadData = vi.fn(async () => false);
			const { wrapper, root, pull, container } = mountPullable(loadData, { inverted: true });
			await settle();
			const initialCalls = loadData.mock.calls.length;

			fireTouch(root, 'touchstart', 300);
			fireTouch(root, 'touchmove', 280); // 上拉 20 < pauseOffset 30
			await nextTick();
			expect(pull().textContent).toBe('↑ 上拉刷新');

			fireTouch(root, 'touchmove', 100); // 上拉 200，阻尼后 90 + (200 - 90) / 5 = 112
			await nextTick();
			expect(pull().textContent).toBe('↓ 释放更新');
			// 整体向上平移，露出尾部的提示条
			// transform 可能带浏览器前缀（jsdom 解析为 webkitTransform），只断言取值
			expect(container().getAttribute('style')).toContain('translateY(-112px)');

			fireTouch(root, 'touchend', 100);
			await sleep(20);
			await nextTick();

			expect(loadData.mock.calls.length).toBeGreaterThan(initialCalls);
			wrapper.unmount();
		});

		it('inverted: pulling down does NOT trigger refresh', async () => {
			const loadData = vi.fn(async () => false);
			const { wrapper, root } = mountPullable(loadData, { inverted: true });
			await settle();
			const initialCalls = loadData.mock.calls.length;

			await touchDrag(root, 100, 300);
			expect(loadData.mock.calls.length).toBe(initialCalls);
			wrapper.unmount();
		});

		it('inverted: only allows pulling up when the main axis is at its end', async () => {
			const loadData = vi.fn(async () => false);
			const { wrapper, root, wrapEl } = mountPullable(loadData, { inverted: true });
			await settle();
			const initialCalls = loadData.mock.calls.length;
			const restore = mockSize(wrapEl, { clientHeight: 200, scrollHeight: 1000 });

			// 未到末端：拖动是普通滚动
			wrapEl.scrollTop = 400;
			await touchDrag(root, 300, 100);
			expect(loadData.mock.calls.length).toBe(initialCalls);

			// 小数 scrollTop 距末端不足 1px 也算到底
			wrapEl.scrollTop = 799.5;
			await touchDrag(root, 300, 100);
			expect(loadData.mock.calls.length).toBeGreaterThan(initialCalls);

			restore();
			wrapper.unmount();
		});

		it('inverted: silent reset keeps the scroll position instead of jumping to 0', async () => {
			let resolveFn: (v: any) => void = () => {};
			let calls = 0;
			const loadData = vi.fn(() => {
				calls++;
				if (calls === 1) return Promise.resolve(false);
				return new Promise((resolve) => { resolveFn = resolve; });
			});
			const { wrapper, listRef, wrapEl } = mountPullable(loadData, { inverted: true });
			await settle();

			const restore = mockSize(wrapEl, { clientHeight: 200, scrollHeight: 1000 });
			wrapEl.scrollTop = 400;

			const pending = listRef.value.reset(true);
			await nextTick();
			// 请求挂起期间旧内容保持原位，贴底交给首批数据落地
			expect(listRef.value.store.states.isSilentRefresh).toBe(true);
			expect(wrapEl.scrollTop).toBe(400);

			resolveFn(false);
			await pending;
			restore();
			wrapper.unmount();
		});

		it('inverted horizontal: pulling left shows LEFT status and triggers refresh', async () => {
			const loadData = vi.fn(async () => false);
			const { wrapper, root, pull } = mountPullable(loadData, { inverted: true, vertical: false });
			await settle();
			const initialCalls = loadData.mock.calls.length;
			expect(pull().style.marginRight).toBe('-30px');

			fireHorizontalTouch(root, 'touchstart', 300);
			fireHorizontalTouch(root, 'touchmove', 280);
			await nextTick();
			expect(pull().textContent).toBe('← 左拉刷新');

			fireHorizontalTouch(root, 'touchmove', 100);
			fireHorizontalTouch(root, 'touchend', 100);
			await sleep(20);
			await nextTick();

			expect(loadData.mock.calls.length).toBeGreaterThan(initialCalls);
			wrapper.unmount();
		});

		it('follows only the finger that started the pull', async () => {
			const loadData = vi.fn(async () => false);
			const { wrapper, root, pull } = mountPullable(loadData);
			await settle();
			const initialCalls = loadData.mock.calls.length;
			const first = { identifier: 0, screenX: 0 };
			const second = { identifier: 1, screenX: 0, screenY: 600 };

			drag.fireTouch(root, 'touchstart', { ...first, screenY: 100 });
			drag.fireTouch(root, 'touchmove', { ...first, screenY: 110 });
			await nextTick();
			expect(pull().textContent).toBe('↓ 下拉刷新');

			// 第二根手指按下、移动、抬起都不影响拉动距离
			drag.fireTouch(root, 'touchstart', second, [{ ...first, screenY: 110 }]);
			drag.fireTouch(root, 'touchmove', second, [{ ...first, screenY: 110 }]);
			drag.fireTouch(root, 'touchend', second, [{ ...first, screenY: 110 }]);
			await nextTick();
			expect(pull().textContent).toBe('↓ 下拉刷新');

			// 发起拉动的手指抬起即结束
			drag.fireTouch(root, 'touchmove', { ...first, screenY: 300 });
			drag.fireTouch(root, 'touchend', { ...first, screenY: 300 });
			await sleep(20);
			await nextTick();
			expect(loadData.mock.calls.length).toBeGreaterThan(initialCalls);
			expect(pull().textContent).toBe('~');
			wrapper.unmount();
		});

		it('touchcancel rebounds without refreshing', async () => {
			const loadData = vi.fn(async () => false);
			const { wrapper, root, pull, container } = mountPullable(loadData);
			await settle();
			const initialCalls = loadData.mock.calls.length;

			fireTouch(root, 'touchstart', 100);
			fireTouch(root, 'touchmove', 300);
			await nextTick();
			expect(pull().textContent).toBe('↑ 释放更新');

			// 系统手势等打断了触摸：不会再有 touchend
			fireTouch(root, 'touchcancel', 300);
			await sleep(20);
			await nextTick();
			expect(pull().textContent).toBe('~');
			expect(container().getAttribute('style')).toContain('translateY(0px)');
			expect(loadData.mock.calls.length).toBe(initialCalls);

			// 取消后的移动不再拉动
			fireTouch(root, 'touchmove', 400);
			await nextTick();
			expect(pull().textContent).toBe('~');
			wrapper.unmount();
		});

		describe('mouse drag leaving the list', () => {
			it('releasing outside the list after passing pauseOffset still refreshes and rebounds', async () => {
				const loadData = vi.fn(async () => false);
				const { wrapper, root, pull } = mountPullable(loadData);
				await settle();
				const initialCalls = loadData.mock.calls.length;

				fireMouse(root, 'mousedown', 100);
				fireMouse(root, 'mousemove', 300);
				await nextTick();
				expect(pull().textContent).toBe('↑ 释放更新');

				// 指针已离开列表：松开发生在列表外
				fireMouse(document.body, 'mouseup', 300);
				await sleep(20);
				await nextTick();

				expect(loadData.mock.calls.length).toBeGreaterThan(initialCalls);
				expect(pull().textContent).toBe('~');
				wrapper.unmount();
			});

			it('keeps following the pointer outside the list', async () => {
				const loadData = vi.fn(async () => false);
				const { wrapper, root, pull } = mountPullable(loadData, { inverted: true });
				await settle();
				const initialCalls = loadData.mock.calls.length;

				// inverted 上拉：按下后指针移出列表继续向上
				fireMouse(root, 'mousedown', 300);
				fireMouse(document.body, 'mousemove', 100);
				await nextTick();
				expect(pull().textContent).toBe('↓ 释放更新');

				fireMouse(document.body, 'mouseup', 100);
				await sleep(20);
				await nextTick();

				expect(loadData.mock.calls.length).toBeGreaterThan(initialCalls);
				wrapper.unmount();
			});

			it('ends the gesture when the primary button is no longer pressed without a mouseup', async () => {
				const loadData = vi.fn(async () => false);
				const { wrapper, root, pull } = mountPullable(loadData);
				await settle();

				fireMouse(root, 'mousedown', 100);
				fireMouse(root, 'mousemove', 110);
				await nextTick();
				expect(pull().textContent).toBe('↓ 下拉刷新');

				// 右键菜单、原生拖拽等吞掉了 mouseup：下一次移动时主键已松开
				fireMouse(document.body, 'mousemove', 300, { buttons: 0 });
				await nextTick();
				expect(pull().textContent).toBe('~');

				// 已解绑：之后按着主键移动也不再拉动
				fireMouse(document.body, 'mousemove', 300);
				await nextTick();
				expect(pull().textContent).toBe('~');
				wrapper.unmount();
			});

			it('cancels without refreshing when the mouseup is lost after passing pauseOffset', async () => {
				const loadData = vi.fn(async () => false);
				const { wrapper, root, pull, container } = mountPullable(loadData);
				await settle();
				const initialCalls = loadData.mock.calls.length;

				fireMouse(root, 'mousedown', 100);
				fireMouse(root, 'mousemove', 300);
				await nextTick();
				expect(pull().textContent).toBe('↑ 释放更新');

				// 右键菜单、原生拖拽等吞掉了 mouseup：按取消处理，只回弹
				fireMouse(document.body, 'mousemove', 300, { buttons: 0 });
				await sleep(20);
				await nextTick();
				expect(pull().textContent).toBe('~');
				expect(container().getAttribute('style')).toContain('translateY(0px)');
				expect(loadData.mock.calls.length).toBe(initialCalls);
				wrapper.unmount();
			});

			it('ignores non-primary buttons', async () => {
				const loadData = vi.fn(async () => false);
				const { wrapper, root, pull } = mountPullable(loadData);
				await settle();

				fireMouse(root, 'mousedown', 100, { button: 2, buttons: 2 });
				fireMouse(document.body, 'mousemove', 300, { buttons: 2 });
				await nextTick();
				// 未进入拉动
				expect(root.classList.contains('is-pulling')).toBe(false);
				expect(pull().textContent).not.toBe('↑ 释放更新');
				wrapper.unmount();
			});

			it('clears the selection and blocks new selections only while pulling', async () => {
				const loadData = vi.fn(async () => false);
				const { wrapper, root } = mountPullable(loadData);
				await settle();

				const selectStartPrevented = () => {
					const ev = new Event('selectstart', { bubbles: true, cancelable: true });
					root.dispatchEvent(ev);
					return ev.defaultPrevented;
				};

				// 按下后未进入拉动：选区保留，可以开始新选区
				selectAll(root);
				fireMouse(root, 'mousedown', 100);
				expect(window.getSelection()!.rangeCount).toBe(1);
				expect(selectStartPrevented()).toBe(false);

				// 进入拉动：清掉选区，拉动期间不再开始新选区
				fireMouse(root, 'mousemove', 110);
				await nextTick();
				expect(window.getSelection()!.rangeCount).toBe(0);
				expect(root.classList.contains('is-pulling')).toBe(true);
				expect(selectStartPrevented()).toBe(true);

				// 手势结束后恢复
				fireMouse(document.body, 'mouseup', 110);
				await nextTick();
				expect(root.classList.contains('is-pulling')).toBe(false);
				expect(selectStartPrevented()).toBe(false);
				wrapper.unmount();
			});

			it('keeps the selection when the drag is not a pull', async () => {
				const loadData = vi.fn(async () => false);
				const { wrapper, root } = mountPullable(loadData);
				await settle();

				selectAll(root);

				// 正序反方向（向上）拖动是选字，不进入拉动
				fireMouse(root, 'mousedown', 300);
				fireMouse(root, 'mousemove', 100);
				await nextTick();
				expect(root.classList.contains('is-pulling')).toBe(false);
				expect(window.getSelection()!.rangeCount).toBe(1);

				fireMouse(document.body, 'mouseup', 100);
				window.getSelection()!.removeAllRanges();
				wrapper.unmount();
			});

			it('rebounds without refreshing when released outside below pauseOffset, and stops listening afterwards', async () => {
				const loadData = vi.fn(async () => false);
				const { wrapper, root, pull, container } = mountPullable(loadData);
				await settle();
				const initialCalls = loadData.mock.calls.length;

				fireMouse(root, 'mousedown', 100);
				fireMouse(root, 'mousemove', 110);
				await nextTick();
				expect(pull().textContent).toBe('↓ 下拉刷新');

				fireMouse(document.body, 'mouseup', 110);
				await nextTick();
				expect(pull().textContent).toBe('~');
				expect(container().getAttribute('style')).toContain('translateY(0px)');

				// 手势结束后，列表外的移动不再驱动拉动
				fireMouse(document.body, 'mousemove', 400);
				await nextTick();
				expect(pull().textContent).toBe('~');
				expect(loadData.mock.calls.length).toBe(initialCalls);
				wrapper.unmount();
			});
		});

		it('second touchend during ongoing refresh keeps offset at pauseOffset (REFRESH branch)', async () => {
			// 让 loadData 长时间挂起，模拟一次刷新仍在进行
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((r) => { resolveFn = r; });

			const wrapper = mount(() => (
				<RecycleList pullable loadData={loadData as any} pauseOffset={30} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			const root = wrapper.find('.vc-recycle-list').element;

			// 第一轮：触发刷新，进入 REFRESH 状态
			fireTouch(root, 'touchstart', 0);
			fireTouch(root, 'touchmove', 200);
			fireTouch(root, 'touchend', 200);
			await nextTick();

			// 此时 reset(true) 在等待 loadData，status 仍为 REFRESH
			// 第二轮：再次触发，handleEnd 命中 REFRESH 分支
			fireTouch(root, 'touchstart', 0);
			fireTouch(root, 'touchmove', 10); // 不超过 pauseOffset
			fireTouch(root, 'touchend', 10);
			await nextTick();

			// 释放第一轮的 loadData，避免悬挂
			resolveFn(false);
			await sleep(20);
			await nextTick();

			expect(true).toBe(true);
			wrapper.unmount();
		});
	});

	describe('Auto-recursive loadData when content is shorter than viewport', () => {
		it('triggers recursive loadData when contentMaxSize > 0 and <= offsetHeight', async () => {
			let callCount = 0;
			const loadData = vi.fn(async () => {
				callCount++;
				// 第一次：返回一页数据
				if (callCount === 1) {
					return buildItems(3);
				}
				// 第二次：终止
				return false;
			});

			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} loadData={loadData} />
			), { attachTo: document.body });

			await nextTick();
			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			// 让 offsetHeight 显著大于 contentMaxSize
			Object.defineProperty(wrapEl, 'offsetHeight', { configurable: true, get: () => 10000 });
			Object.defineProperty(wrapEl, 'clientHeight', { configurable: true, get: () => 10000 });

			// 劫持 refreshItemPosition：保证调用后 contentMaxSize > 0
			const store = listRef.value.store;
			const orig = store.layout.refresh.bind(store.layout);
			store.layout.refresh = function () {
				orig();
				if (store.states.contentMaxSize === 0 && store.states.rebuildData.length > 0) {
					store.states.contentMaxSize = 10;
				}
			};

			await sleep(0);
			await nextTick();
			await sleep(20);
			await nextTick();
			await sleep(20);
			await nextTick();

			expect(loadData.mock.calls.length).toBeGreaterThanOrEqual(2);
			wrapper.unmount();
		});
	});

	describe('Measure pool: only nodes without a size are measured, sizes are estimates until rendered', () => {
		/**
		 * 只推进微任务，不让出宏任务：Defer 的分片（MessageChannel）与浏览器绘制都发生在宏任务之间，
		 * 在这里完成的更新不会留下中间帧
		 * @param times 推进次数
		 */
		const flushMicrotasks = async (times = 30) => {
			for (let i = 0; i < times; i++) await Promise.resolve();
		};

		/**
		 * 挂载一个本地列表，等首批构建、测量并展示出来
		 *
		 * 几何：wrapper 视口 200、scrollHeight 1200，停在顶部时远离尾部阈值线，不会因滚动续建；
		 * 每项（直接包着 .x 的元素，含隐藏池与可见行）高度由 heightOf 按 id 给出，其余元素高 40
		 * @param count 数据条数
		 * @param batchCount 每批构建条数
		 * @param heightOf 按数据 id 给出项高度
		 * @param props 额外传给 RecycleList 的属性与事件
		 * @returns 挂载结果与读取工具
		 */
		const setup = async (
			count: number,
			batchCount: number,
			heightOf: (id: number) => number = () => 40,
			props: Record<string, any> = {}
		) => {
			const restoreSize = mockSize(HTMLElement.prototype, { clientHeight: 200, scrollHeight: 1200 });
			const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;
			// 隐藏池里被读取尺寸的数据 id，即实际发生测量的项
			const measuredIds: number[] = [];
			Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
				configurable: true,
				get(this: HTMLElement) {
					const item = this.querySelector(':scope > .x');
					if (!item) return 40;
					const id = Number(item.textContent);
					this.classList.contains('vc-recycle-list__hidden') && measuredIds.push(id);
					return heightOf(id);
				}
			});
			const data = ref(buildItems(count));
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data.value} batchCount={batchCount} disabled {...props}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });
			const states = listRef.value.store.states;
			const shown = () => wrapper.findAll('.vc-recycle-list__column .x');

			for (let i = 0; i < 40 && !(states.preData.length === 0 && shown().length > 0); i++) {
				await sleep(0);
			}
			expect(shown().length).toBeGreaterThan(0);

			return {
				data,
				list: listRef.value,
				states,
				wrapper,
				shown,
				measuredIds,
				pooled: () => wrapper.findAll('.vc-recycle-list__pool .x'),
				restore: () => {
					wrapper.unmount();
					Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeight);
					restoreSize();
				}
			};
		};

		/**
		 * 触发某个已渲染行的尺寸回调（行渲染出来时的首次测量，或之后内容变化）；行的尺寸由 offsetHeight 的 mock 给出
		 * @param wrapper 挂载结果
		 * @param id 数据 id
		 */
		const triggerRendered = (wrapper: any, id: number) => {
			const row = wrapper.findAll(ROW).find((item: any) => item.find('.x').text() === String(id));
			observerOf(row.element).trigger(row.element);
		};

		it('keeps shown rows on screen when data is replaced with new objects', async () => {
			const { data, states, shown, pooled, wrapper, restore } = await setup(30, 30);

			// 换成新对象（并删掉首行）：沿用同位置的尺寸作估计值，行原地换成新数据，不进隐藏池，也不会先白屏再出现
			const rows = wrapper.findAll(ROW).map((item: any) => item.element);
			data.value = data.value.slice(1).map(item => ({ ...item }));
			await flushMicrotasks();

			expect(states.preData.length).toBe(0);
			expect(pooled().length).toBe(0);
			expect(shown().length).toBeGreaterThan(0);
			expect(shown()[0].text()).toBe('1');
			expect(wrapper.findAll(ROW)[0].element).toBe(rows[0]);
			restore();
		});

		it('keeps shown rows on screen when the layout is refreshed', async () => {
			const { list, states, shown, wrapper, restore } = await setup(30, 30);
			const rows = wrapper.findAll(ROW).map((item: any) => item.element);

			// 整体重测：渲染中的行保留几何、按 DOM 重测，原地不动；其余已构建的行在隐藏池分片重测
			list.refreshLayout();
			await flushMicrotasks();

			expect(shown().length).toBe(rows.length);
			expect(wrapper.findAll(ROW).map((item: any) => item.element)).toEqual(rows);
			expect(states.preData.length).toBe(30 - rows.length);
			expect(states.preData.every((node: any) => !rows.some((el: Element) => el.textContent === String(node.states.data.id)))).toBe(true);

			for (let i = 0; i < 40 && states.preData.length > 0; i++) await sleep(0);
			expect(states.preData.length).toBe(0);
			restore();
		});

		it('still slices a freshly built batch across tasks', async () => {
			// setData 先构建一批，挂载时 loadData 再构建一批
			const { states, pooled, restore, wrapper } = await setup(90, 30);
			expect(states.rebuildData.length).toBe(60);

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			wrapEl.scrollTop = 1000;
			wrapEl.dispatchEvent(new Event('scroll'));
			await flushMicrotasks();

			// 新一批从未展示过，照常分片：同一个任务里不会整批渲染进隐藏池
			expect(states.rebuildData.length).toBe(90);
			expect(states.preData.length).toBe(30);
			expect(pooled().length).toBeLessThanOrEqual(10);

			for (let i = 0; i < 40 && states.preData.length > 0; i++) await sleep(0);
			expect(states.preData.length).toBe(0);
			restore();
		});

		describe('Sizes follow data items on setData', () => {
			// 每项高度不同，尺寸若按下标沿用会对不上
			const heightOf = (id: number) => 20 + id;

			/**
			 * 断言节点尺寸与各自数据项的高度一致，且位置首尾相接
			 * @param states store.states
			 */
			const expectLaidOutByData = (states: any) => {
				const nodes = states.rebuildData;
				nodes.forEach((node: any, i: number) => {
					expect(node.states.size).toBe(heightOf(node.states.data.id));
					i > 0 && expect(node.states.position).toBe(nodes[i - 1].states.position + nodes[i - 1].states.size);
				});
			};

			it('does not re-measure kept items when a row is deleted', async () => {
				const { data, states, shown, measuredIds, restore } = await setup(30, 30, heightOf);
				measuredIds.length = 0;

				data.value = data.value.filter(item => item.id !== 5);
				await flushMicrotasks();

				expect(measuredIds).toEqual([]);
				expect(states.preData.length).toBe(0);
				expect(states.rebuildData.length).toBe(29);
				expectLaidOutByData(states);
				expect(shown()[0].text()).toBe('0');
				restore();
			});

			it('measures only the inserted item', async () => {
				const { data, states, shown, measuredIds, restore } = await setup(30, 30, heightOf);
				measuredIds.length = 0;

				data.value = [...data.value.slice(0, 3), buildItem(100), ...data.value.slice(3)];
				await flushMicrotasks();
				// 新项从未展示过，照常分片测量；等待期间已有的行留在列中
				expect(shown().length).toBeGreaterThan(0);

				for (let i = 0; i < 40 && states.preData.length > 0; i++) await sleep(0);
				expect(measuredIds).toEqual([100]);
				expect(states.preData.length).toBe(0);
				expectLaidOutByData(states);
				restore();
			});

			it('moves nodes along with their data items', async () => {
				const { data, states, restore } = await setup(30, 30, heightOf);
				const idOf = (dataId: number) => states.rebuildData.find((node: any) => node.states.data.id === dataId).id;
				const before = [0, 6, 29].map(idOf);

				data.value = data.value.filter(item => item.id !== 5);
				await flushMicrotasks();

				// 节点 id 即渲染 key：跟着数据项走，删除后其余行只是移动，不会被换成别的数据重新渲染
				expect([0, 6, 29].map(idOf)).toEqual(before);
				expect(states.rebuildData.map((node: any) => node.states.index)).toEqual(Array.from({ length: 29 }, (_, i) => i));
				restore();
			});

			it('keeps sizes with their items when the order changes', async () => {
				const { data, states, measuredIds, restore } = await setup(30, 30, heightOf);
				measuredIds.length = 0;

				data.value = [...data.value].reverse();
				await flushMicrotasks();

				expect(measuredIds).toEqual([]);
				expectLaidOutByData(states);
				restore();
			});

			it('keeps reused rows on screen while only new items are being sliced', async () => {
				// batchCount 大于条数：追加一条时会被构建出来，待测集合里只有这条全新的项，隐藏池照常分片
				const { data, states, shown, restore } = await setup(30, 40, heightOf);

				data.value = [...[...data.value].reverse(), buildItem(100)];
				await flushMicrotasks();

				// 分片期间（跨宏任务）沿用尺寸的行不能从列中消失
				expect(states.preData.length).toBe(1);
				expect(shown().length).toBeGreaterThan(0);
				expect(shown()[0].text()).toBe('29');

				for (let i = 0; i < 40 && states.preData.length > 0; i++) await sleep(0);
				expect(states.preData.length).toBe(0);
				expectLaidOutByData(states);
				restore();
			});

			it('corrects a rendered item replaced by a new object from the DOM, without the pool', async () => {
				const heights: Record<number, number> = {};
				const dynamicHeightOf = (id: number) => heights[id] ?? heightOf(id);
				const { data, states, measuredIds, restore } = await setup(30, 30, dynamicHeightOf);
				measuredIds.length = 0;

				// 换成新对象且内容变高：沿用旧尺寸作估计值，行渲染出新内容后按 DOM 校正，不进隐藏池
				heights[2] = 77;
				data.value = data.value.map((item, i) => (i === 2 ? { ...item } : item));
				await flushMicrotasks();

				expect(measuredIds).toEqual([]);
				expect(states.rebuildData[2].states.size).toBe(77);
				expect(states.rebuildData[3].states.position).toBe(states.rebuildData[2].states.position + 77);
				restore();
			});

			it('keeps sizes as estimates when every item is replaced (e.g. switching pages)', async () => {
				const { data, states, wrapper, shown, measuredIds, restore } = await setup(30, 30, heightOf);
				const rendered = shown().length;
				expect(rendered).toBeLessThan(30);
				measuredIds.length = 0;

				// 整页换成新对象：没有任何项进隐藏池；正在渲染的按 DOM 校正，视口外的沿用原尺寸
				data.value = buildItems(30, 2, 100);
				await flushMicrotasks();

				expect(states.preData.length).toBe(0);
				expect(measuredIds).toEqual([]);
				expect(shown()[0].text()).toBe('100');
				expect(states.rebuildData[0].states.size).toBe(heightOf(100));
				expect(states.rebuildData[29].states.size).toBe(heightOf(29));

				// 视口外的项渲染出来时再按实际尺寸校正
				const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
				wrapEl.scrollTop = states.rebuildData[20].states.position;
				wrapEl.dispatchEvent(new Event('scroll'));
				await flushMicrotasks();
				triggerRendered(wrapper, 120);
				await flushMicrotasks();
				expect(states.rebuildData[20].states.size).toBe(heightOf(120));
				restore();
			});

			it('does the same in a multi-column list', async () => {
				const { data, states, shown, measuredIds, restore } = await setup(30, 30, heightOf, { cols: 2 });
				measuredIds.length = 0;

				// 多列同样沿用尺寸作估计值，渲染中的按 DOM 校正
				data.value = buildItems(30, 2, 100);
				await flushMicrotasks();

				expect(states.preData.length).toBe(0);
				expect(measuredIds).toEqual([]);
				expect(shown().length).toBeGreaterThan(0);
				const first = states.rebuildData.find((node: any) => node.states.data.id === Number(shown()[0].text()));
				expect(first.states.size).toBe(heightOf(first.states.data.id));
				restore();
			});
		});

		describe('Correct sizes when rows are rendered', () => {
			/**
			 * 可变的行高表：模拟在原对象上改了影响尺寸的字段（不替换数组）
			 * @returns 行高表与按 id 取高度的函数
			 */
			const createHeights = () => {
				const heights: Record<number, number> = {};
				return { heights, heightOf: (id: number) => heights[id] ?? 20 + id };
			};

			/**
			 * 断言节点尺寸与当前行高一致，且位置首尾相接
			 * @param states store.states
			 * @param heightOf 按 id 取高度
			 */
			const expectLaidOut = (states: any, heightOf: (id: number) => number) => {
				const nodes = states.rebuildData;
				nodes.forEach((node: any, i: number) => {
					expect(node.states.size).toBe(heightOf(node.states.data.id));
					i > 0 && expect(node.states.position).toBe(nodes[i - 1].states.position + nodes[i - 1].states.size);
				});
			};

			it('corrects a stale size when the row is rendered', async () => {
				const { heights, heightOf } = createHeights();
				const onRowResize = vi.fn();
				const { states, wrapper, restore } = await setup(30, 30, heightOf, { onRowResize });
				onRowResize.mockClear();

				// 原地改了第 3 行的内容，没有替换数组；该行渲染出来时首次测量读到新高度
				heights[3] = 80;
				triggerRendered(wrapper, 3);
				await flushMicrotasks();

				expectLaidOut(states, heightOf);
				expect(onRowResize).toHaveBeenCalledTimes(1);
				expect(onRowResize).toHaveBeenLastCalledWith([{ size: 80, index: 3 }]);
				restore();
			});

			it('keeps the viewport still when a row rendered above it is corrected', async () => {
				const { heights, heightOf } = createHeights();
				const { states, wrapper, restore } = await setup(30, 30, heightOf);
				const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
				// 视口上沿停在第 8 行起点之上 10px：第 6 行在视口上方，只因 overscan 被渲染出来
				wrapEl.scrollTop = states.rebuildData[8].states.position - 10;
				wrapEl.dispatchEvent(new Event('scroll'));
				await flushMicrotasks();

				expect(states.firstItemIndex).toBeLessThan(6);
				const before = wrapEl.scrollTop;

				// 第 6 行变高 30：视口里的内容被整体下推，滚动位置补偿同样的距离，画面不动
				heights[6] = heightOf(6) + 30;
				triggerRendered(wrapper, 6);
				await flushMicrotasks();

				expectLaidOut(states, heightOf);
				expect(wrapEl.scrollTop).toBe(before + 30);
				restore();
			});

			it('corrects only the resized row when rendered content changes (no full re-measure)', async () => {
				const { heights, heightOf } = createHeights();
				const onRowResize = vi.fn();
				const { list, states, wrapper, measuredIds, restore } = await setup(30, 30, heightOf, { onRowResize });
				heights[3] = 80;
				triggerRendered(wrapper, 3);
				await flushMicrotasks();

				const rows = () => wrapper.findAll(ROW).map((item: any) => item.element);
				const before = rows();
				const build = vi.spyOn(list.store.nodes, 'build');
				measuredIds.length = 0;
				onRowResize.mockClear();

				// 同一行再次变化（首次测量之后，如展开、编辑、图片撑开）
				heights[3] = 120;
				triggerRendered(wrapper, 3);
				await flushMicrotasks();
				await sleep(80);

				expectLaidOut(states, heightOf);
				expect(onRowResize).toHaveBeenCalledTimes(1);
				expect(onRowResize).toHaveBeenLastCalledWith([{ size: 120, index: 3 }]);
				// 不整体重建：节点不进隐藏池，已渲染的行原地保留
				expect(build).not.toHaveBeenCalled();
				expect(measuredIds).toEqual([]);
				expect(states.preData.length).toBe(0);
				// 行变高后视口内的行数可能减少，但仍在的行都是原来的元素
				expect(rows().length).toBeGreaterThan(0);
				expect(rows().every((el: Element) => before.includes(el))).toBe(true);
				restore();
			});

			it('does nothing when the rendered size matches the record', async () => {
				const { heightOf } = createHeights();
				const onRowResize = vi.fn();
				const { list, wrapper, restore } = await setup(30, 30, heightOf, { onRowResize });
				onRowResize.mockClear();
				const refresh = vi.spyOn(list.store.layout, 'refresh');

				triggerRendered(wrapper, 3);
				await flushMicrotasks();

				expect(refresh).not.toHaveBeenCalled();
				expect(onRowResize).not.toHaveBeenCalled();
				restore();
			});

			it('keeps the record when the rendered size cannot be read', async () => {
				const { heights, heightOf } = createHeights();
				const { states, wrapper, restore } = await setup(30, 30, heightOf);

				// 列表不可见时读到 0：不能把节点改回待测
				heights[3] = 0;
				triggerRendered(wrapper, 3);
				await flushMicrotasks();

				expect(states.rebuildData[3].states.size).toBe(23);
				expect(states.preData.length).toBe(0);
				restore();
			});
		});

		describe('Cross-axis resize: sizes stay as estimates', () => {
			// jsdom 下元素宽度恒为 0：给 wrapper 一个宽度并触发它的尺寸回调
			const resizeWrapper = (wrapper: any, width: number) => {
				const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as any;
				Object.defineProperty(wrapEl, 'clientWidth', { configurable: true, get: () => width });
				wrapEl.__rz__.handleResize([{ target: wrapEl }]);
			};
			const settle = async (states: any) => {
				await sleep(80);
				for (let i = 0; i < 40 && states.preData.length > 0; i++) await sleep(0);
				await flushMicrotasks();
			};

			it('does nothing on the first callback after mount', async () => {
				const { list, wrapper, measuredIds, restore } = await setup(30, 30);
				const build = vi.spyOn(list.store.nodes, 'build');
				const refresh = vi.spyOn(list.store.layout, 'refresh');
				measuredIds.length = 0;

				// 挂载后的首次回调：宽度与绑定视口时一致，只刷新几何，不重测
				const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as any;
				wrapEl.__rz__.handleResize([{ target: wrapEl }]);
				await sleep(80);

				expect(build).not.toHaveBeenCalled();
				expect(refresh).not.toHaveBeenCalled();
				expect(measuredIds).toEqual([]);
				restore();
			});

			it('re-measures everything when the list becomes visible', async () => {
				const { list, wrapper, states, shown, restore } = await setup(30, 30);
				const build = vi.spyOn(list.store.nodes, 'build');

				// 宽度从 0 变为有值：隐藏期间量到的尺寸不可信，整体重测
				resizeWrapper(wrapper, 300);
				await settle(states);

				expect(build).toHaveBeenCalledWith(0, 30, expect.objectContaining({ force: true }));
				expect(states.preData.length).toBe(0);
				expect(shown().length).toBeGreaterThan(0);
				restore();
			});

			it('re-measures only the rendered rows when the width changes', async () => {
				const heights: Record<number, number> = {};
				const { list, wrapper, states, shown, measuredIds, restore } = await setup(30, 30, id => heights[id] ?? 40);
				resizeWrapper(wrapper, 300);
				await settle(states);
				const rendered = shown().map(item => Number(item.text()));
				const build = vi.spyOn(list.store.nodes, 'build');
				measuredIds.length = 0;

				// 变窄后每行都变高：渲染中的行按 DOM 重测，其余保留原尺寸作估计值，不进隐藏池
				for (let id = 0; id < 30; id++) heights[id] = 60;
				resizeWrapper(wrapper, 200);
				await settle(states);

				expect(build).not.toHaveBeenCalled();
				expect(measuredIds).toEqual([]);
				rendered.forEach(id => expect(states.rebuildData[id].states.size).toBe(60));
				expect(states.rebuildData[29].states.size).toBe(40);
				restore();
			});
		});

		it('marks rows rendered in the measure pool as measuring', async () => {
			const restoreSize = mockSize(HTMLElement.prototype, { clientHeight: 200, scrollHeight: 1200, offsetHeight: 40 });
			const seen: boolean[] = [];
			const Probe = defineComponent({
				setup() {
					seen.push(useMeasuring());
					return () => <div class="x" />;
				}
			});
			const wrapper = mount(() => (
				<RecycleList data={buildItems(5)} disabled>
					{{ default: () => <Probe /> }}
				</RecycleList>
			), { attachTo: document.body });
			await flushLayout();

			// 隐藏池里那份渲染为 true，展示出来的行为 false
			expect(seen.filter(Boolean).length).toBe(5);
			expect(wrapper.findAll(`${ROW} .x`).length).toBe(5);
			expect(seen.filter(v => !v).length).toBe(5);
			restoreSize();
			wrapper.unmount();
		});

		describe('Row observer: one ResizeObserver per list', () => {
			const rowsOf = (wrapper: any): Element[] => wrapper.findAll(ROW).map((item: any) => item.element);

			it.each([
				['single column', {}],
				['multi column', { cols: 2 }],
				['inverted', { inverted: true }]
			])('observes exactly the rendered rows with a single observer (%s)', async (_, props) => {
				const { wrapper, restore } = await setup(60, 60, () => 40, props);
				const rows = rowsOf(wrapper);
				expect(rows.length).toBeGreaterThan(0);

				const used = new Set(rows.map(observerOf));
				expect(used.size).toBe(1);
				expect(new Set(observerOf(rows[0]).targets)).toEqual(new Set(rows));
				restore();
			});

			it('unobserves rows that leave the rendered range', async () => {
				const { wrapper, restore } = await setup(60, 60);
				const before = rowsOf(wrapper);
				const observer = observerOf(before[0]);

				const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
				wrapEl.scrollTop = 800;
				wrapEl.dispatchEvent(new Event('scroll'));
				await flushMicrotasks();

				const rows = rowsOf(wrapper);
				const left = before.filter(el => !rows.includes(el));
				expect(left.length).toBeGreaterThan(0);
				// 离开的行不再被观察，也不再留在文档里
				expect(new Set(observer.targets)).toEqual(new Set(rows));
				expect(left.every(el => !el.isConnected)).toBe(true);
				restore();
			});

			it('does not observe again when the list re-renders', async () => {
				const options = reactive<Record<string, any>>({ 'data-mark': 1 });
				const { wrapper, restore } = await setup(60, 60, () => 40, options);
				const rows = rowsOf(wrapper);
				const observer = observerOf(rows[0]);
				const observe = vi.spyOn(observer, 'observe');
				const unobserve = vi.spyOn(observer, 'unobserve');

				// 列表重渲染、可见范围不变：行元素原地保留，不重复登记
				options['data-mark'] = 2;
				await flushMicrotasks();

				expect(wrapper.find('.vc-recycle-list').attributes('data-mark')).toBe('2');
				expect(rowsOf(wrapper)).toEqual(rows);
				expect(observe).not.toHaveBeenCalled();
				expect(unobserve).not.toHaveBeenCalled();
				restore();
			});

			it('reports a resize to the node that owns the element after rows move', async () => {
				const heights: Record<number, number> = {};
				const heightOf = (id: number) => heights[id] ?? 20 + id;
				const { data, states, wrapper, restore } = await setup(30, 30, heightOf);
				const sizeOf = (id: number) => states.rebuildData.find((node: any) => node.states.data.id === id).states.size;

				// 删掉一行后其余行前移：元素跟着节点走，回调仍落到原来那条数据上
				data.value = data.value.filter(item => item.id !== 1);
				await flushMicrotasks();
				heights[3] = 90;
				triggerRendered(wrapper, 3);
				await flushMicrotasks();

				expect(sizeOf(3)).toBe(90);
				expect(sizeOf(2)).toBe(heightOf(2));
				expect(sizeOf(4)).toBe(heightOf(4));
				restore();
			});

			it('disconnects the observer on unmount', async () => {
				const { wrapper, restore } = await setup(30, 30);
				const observer = observerOf(rowsOf(wrapper)[0]);
				const disconnect = vi.spyOn(observer, 'disconnect');

				restore();

				expect(disconnect).toHaveBeenCalledTimes(1);
				expect(observer.targets.size).toBe(0);
			});

			it('does not observe skeleton placeholders', async () => {
				const restoreSize = mockSize(HTMLElement.prototype, { clientHeight: 200, scrollHeight: 1200, offsetHeight: 40 });
				const wrapper = mount(() => (
					<RecycleList loadData={() => new Promise(() => {})} batchCount={5} renderPlaceholder={() => <div class="ph">loading</div>}>
						{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
					</RecycleList>
				), { attachTo: document.body });
				await flushLayout(4);

				const placeholders = wrapper.findAll('.vc-recycle-list__column .ph');
				expect(placeholders.length).toBeGreaterThan(0);
				expect(wrapper.findAll(ROW).length).toBe(0);
				// 骨架占位不是数据行：不登记、不观察
				expect(placeholders.every(item => !observers.some(ro => ro.targets.has(item.element.parentElement)))).toBe(true);
				restoreSize();
				wrapper.unmount();
			});

			it('shows every skeleton placeholder at first, then windows them on scroll', async () => {
				const restoreSize = mockSize(HTMLElement.prototype, { clientHeight: 200, scrollHeight: 1200, offsetHeight: 40 });
				const wrapper = mount(() => (
					<RecycleList loadData={() => new Promise(() => {})} batchCount={20} renderPlaceholder={() => <div class="ph">loading</div>}>
						{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
					</RecycleList>
				), { attachTo: document.body });
				await flushLayout(4);

				const placeholders = () => wrapper.findAll('.vc-recycle-list__column .ph').length;
				const total = placeholders();
				expect(total).toBeGreaterThan(10);

				// 滚动后按视口裁剪：只有骨架时也不必一直渲染全部占位
				const el = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
				el.scrollTop = 400;
				el.dispatchEvent(new Event('scroll'));
				await flushLayout(2);
				expect(placeholders()).toBeGreaterThan(0);
				expect(placeholders()).toBeLessThan(total);
				restoreSize();
				wrapper.unmount();
			});

			it('corrects by width in a horizontal list', async () => {
				const restoreSize = mockSize(HTMLElement.prototype, { clientWidth: 200, scrollWidth: 1200 });
				const widths: Record<number, number> = {};
				const offsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
				Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
					configurable: true,
					get(this: HTMLElement) {
						const item = this.querySelector(':scope > .x');
						return item ? widths[Number(item.textContent)] ?? 50 : 50;
					}
				});
				const listRef = ref<any>();
				const wrapper = mount(() => (
					<RecycleList ref={listRef} data={buildItems(20)} batchCount={20} disabled vertical={false}>
						{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
					</RecycleList>
				), { attachTo: document.body });
				const { states } = listRef.value.store;
				for (let i = 0; i < 40 && !(states.preData.length === 0 && wrapper.findAll(ROW).length > 0); i++) await sleep(0);

				widths[2] = 90;
				triggerRendered(wrapper, 2);
				await flushMicrotasks();

				expect(states.rebuildData[2].states.size).toBe(90);
				expect(states.rebuildData[3].states.position).toBe(states.rebuildData[2].states.position + 90);
				wrapper.unmount();
				offsetWidth
					? Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidth)
					: delete (HTMLElement.prototype as any).offsetWidth;
				restoreSize();
			});
		});

		describe('estimateSize: skip the measure pool', () => {
			it('lays out every item from the estimate without rendering the pool', async () => {
				const { states, shown, pooled, measuredIds, restore } = await setup(100, 20, () => 40, { estimateSize: 40 });
				for (let i = 0; i < 20 && !states.isBuilt; i++) await sleep(0);

				// 尺寸已知：不分批，一次构建全部；没有任何项进隐藏池。挂载前排好版的行挂载后即按视口展示（200 / 40 + overscan）
				expect(shown().length).toBeGreaterThan(5);
				expect(states.rebuildData.length).toBe(100);
				expect(measuredIds).toEqual([]);
				expect(pooled().length).toBe(0);
				expect(states.contentMaxSize).toBe(4000);
				expect(states.isBuilt).toBe(true);
				expect(states.loaded).toBe(100);
				restore();
			});

			it('measures the items the function leaves undefined', async () => {
				const heightOf = (id: number) => (id % 10 === 3 ? 90 : 40);
				const estimateSize = vi.fn(({ row }: any) => (row.id % 10 === 3 ? undefined : 40));
				const { states, measuredIds, restore } = await setup(100, 20, heightOf, { estimateSize });
				// 入参与默认插槽一致：{ row, index }
				expect(estimateSize).toHaveBeenCalledWith({ row: expect.objectContaining({ id: 7 }), index: 7 });

				for (let i = 0; i < 40 && states.preData.length > 0; i++) await sleep(0);
				expect(measuredIds.sort((a, b) => a - b)).toEqual(Array.from({ length: 10 }, (_, i) => i * 10 + 3));
				expect(states.rebuildData[3].states.size).toBe(90);
				expect(states.contentMaxSize).toBe(90 * 10 + 40 * 90);
				restore();
			});

			it('counts only the items that need measuring toward a batch', async () => {
				// 偶数项没有预估：每批凑满 batchCount（10）个待测项为止，有预估的项不占批次、不进隐藏池
				const estimateSize = ({ row }: any) => (row.id % 2 === 0 ? undefined : 40);
				const { states, measuredIds, restore } = await setup(100, 10, () => 40, { estimateSize });
				for (let i = 0; i < 40 && states.preData.length > 0; i++) await sleep(0);

				// setData 构建到第 10 个待测项（id 18），挂载时再续一批到第 20 个（id 38）
				expect(states.rebuildData.length).toBe(39);
				expect(measuredIds.sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i * 2));
				restore();
			});

			it('corrects the estimate once the item is rendered', async () => {
				const heightOf = (id: number) => 20 + id;
				const { states, wrapper, restore } = await setup(100, 20, heightOf, { estimateSize: 30 });

				triggerRendered(wrapper, 2);
				await flushMicrotasks();

				expect(states.rebuildData[2].states.size).toBe(heightOf(2));
				// 没渲染过的项仍是估计值
				expect(states.rebuildData[50].states.size).toBe(30);
				expect(states.rebuildData[3].states.position).toBe(states.rebuildData[2].states.position + heightOf(2));
				restore();
			});

			it('re-lays out with the new estimate when estimateSize changes', async () => {
				const options = reactive<Record<string, any>>({ estimateSize: undefined });
				const { states, pooled, restore } = await setup(100, 20, () => 40, options);
				expect(states.rebuildData.length).toBeLessThan(100);

				// 挂载后才给出预估：剩余的本地数据一次构建完
				options.estimateSize = 60;
				for (let i = 0; i < 40 && states.rebuildData.length < 100; i++) await sleep(0);
				await flushMicrotasks();
				expect(states.rebuildData.length).toBe(100);
				expect(pooled().length).toBe(0);
				// 没渲染过的项换成新的预估值；渲染中的行随即按 DOM 校正
				expect(states.rebuildData[99].states.size).toBe(60);
				expect(states.rebuildData[0].states.size).toBe(40);

				// 撤掉预估：已有的尺寸原样保留（同样只是估计值），不重建列表，也不把已构建的数据放进隐藏池
				options.estimateSize = undefined;
				await flushMicrotasks();
				expect(states.rebuildData.length).toBe(100);
				expect(states.preData.length).toBe(0);
				expect(pooled().length).toBe(0);
				expect(states.rebuildData[99].states.size).toBe(60);
				restore();
			});

			it('re-estimates only the items whose estimate changed when the function is replaced', async () => {
				const options = reactive<Record<string, any>>({ estimateSize: () => 30 });
				// 渲染出来的行实测为 50，与预估不同
				const { states, list, wrapper, restore } = await setup(100, 20, () => 50, options);
				triggerRendered(wrapper, 0);
				await flushMicrotasks();
				const sizes = () => states.rebuildData.map((node: any) => node.states.size);
				expect(sizes()[0]).toBe(50);
				expect(sizes()[99]).toBe(30);
				const before = sizes();

				// 换了引用、取值没变（模板里的内联函数每次渲染都是这样）：不重排，实测过的尺寸保留
				const refresh = vi.spyOn(list.store.layout, 'refresh');
				options.estimateSize = () => 30;
				await flushMicrotasks();
				expect(refresh).not.toHaveBeenCalled();
				expect(sizes()).toEqual(before);

				// 取值变了：未渲染的项换成新的预估值，渲染中的行按 DOM 校正
				options.estimateSize = ({ index }: any) => (index < 50 ? 30 : 60);
				await flushMicrotasks();
				expect(refresh).toHaveBeenCalled();
				expect(sizes()[0]).toBe(50);
				expect(sizes()[49]).toBe(30);
				expect(sizes()[99]).toBe(60);
				restore();
			});

			it('applies the estimate to remotely loaded pages', async () => {
				const offsetHeight = spyOffsetHeight(1000, 40);
				const listRef = ref<any>();
				const loadData = vi.fn(async ({ page }: any) => (page === 1 ? buildItems(5) : []));
				const wrapper = mount(() => (
					<RecycleList ref={listRef} loadData={loadData} estimateSize={32}>
						{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
					</RecycleList>
				), { attachTo: document.body });

				await flushLayout();
				const { states } = listRef.value.store;
				expect(states.rebuildData.map((node: any) => node.states.size)).toEqual([32, 32, 32, 32, 32]);
				expect(wrapper.findAll('.vc-recycle-list__pool .x').length).toBe(0);
				offsetHeight.mockRestore();
				wrapper.unmount();
			});
		});
	});

	describe('Continue loading when a request finishes at the load edge', () => {
		/**
		 * 挂载一个远程列表：第 1 次返回一页数据，第 2 次结束。
		 * 几何：可见的 wrapper，内容比视口略高（不算不足一屏），用 scrollHeight 控制是否贴着尾部阈值线
		 * @param geometry 几何设定
		 * @param geometry.visible wrapper 是否可见（不可见时尺寸为 0）
		 * @param geometry.scrollHeight wrapper 的 scrollHeight，即列表尾部位置
		 * @returns 挂载结果与 loadData 桩
		 */
		const setup = async (geometry: { visible: boolean; scrollHeight: number }) => {
			let call = 0;
			const loadData = vi.fn(async () => {
				call++;
				return call === 1 ? buildItems(3) : false;
			});
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} loadData={loadData}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const size = geometry.visible ? 500 : 0;
			Object.defineProperty(wrapEl, 'offsetWidth', { configurable: true, get: () => (geometry.visible ? 300 : 0) });
			Object.defineProperty(wrapEl, 'offsetHeight', { configurable: true, get: () => size });
			Object.defineProperty(wrapEl, 'clientHeight', { configurable: true, get: () => size });
			Object.defineProperty(wrapEl, 'scrollHeight', { configurable: true, get: () => geometry.scrollHeight });

			// jsdom 下测不出尺寸：布局后把内容总高固定为 550（比视口 500 高，不属于内容不足一屏）
			const store = listRef.value.store;
			const refresh = store.layout.refresh.bind(store.layout);
			store.layout.refresh = () => {
				refresh();
				if (store.states.rebuildData.length > 0) store.states.contentMaxSize = 550;
			};

			for (let i = 0; i < 12; i++) { await sleep(10); await nextTick(); }
			return { wrapper, loadData };
		};

		it('loads the next page without a scroll event when still at the load edge', async () => {
			// 视口底 500，尾部阈值线 550 - 100 = 450：已越过阈值线
			const { wrapper, loadData } = await setup({ visible: true, scrollHeight: 550 });
			expect(loadData).toHaveBeenCalledTimes(2);
			wrapper.unmount();
		});

		it('does not continue when the list is hidden', async () => {
			// 隐藏时尺寸为 0，贴边判断恒为真；不应在后台把数据一次拉完
			const { wrapper, loadData } = await setup({ visible: false, scrollHeight: 550 });
			expect(loadData).toHaveBeenCalledTimes(1);
			wrapper.unmount();
		});

		it('does not continue when the viewport has left the load edge', async () => {
			// 尾部阈值线 5000 - 100 = 4900，视口底 500：离边缘很远
			const { wrapper, loadData } = await setup({ visible: true, scrollHeight: 5000 });
			expect(loadData).toHaveBeenCalledTimes(1);
			wrapper.unmount();
		});
	});

	describe('useDirectionKeys', () => {
		it('updates keys when vertical prop toggles', async () => {
			const vertical = ref(true);
			const wrapper = mount(() => (
				<RecycleList vertical={vertical.value} />
			), { attachTo: document.body });

			await nextTick();
			expect(wrapper.classes()).not.toContain('is-horizontal');

			vertical.value = false;
			await nextTick();
			await nextTick();
			expect(wrapper.classes()).toContain('is-horizontal');
			wrapper.unmount();
		});
	});

	describe('handleResize', () => {
		it('triggers throttled handleResize via Resize listeners', async () => {
			const data = buildItems(3);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data} disabled>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			Object.defineProperty(wrapEl, 'clientHeight', { configurable: true, get: () => 600 });
			Object.defineProperty(wrapEl, 'offsetHeight', { configurable: true, get: () => 600 });

			// 给每个 rebuildData item 一个 size 与 position，使 handleResize 内部判断为 isNeedRefreshLayout
			listRef.value.store.states.rebuildData.forEach((it: any, i: number) => {
				it.states.size = 80;
				it.states.position = i * 80;
				it.states.isPlaceholder = false;
			});

			// helper-resize 在元素上挂载了 __rz__，手动触发其内部 handleResize 回调
			const rz = (wrapEl as any).__rz__;
			expect(rz).toBeDefined();
			rz.handleResize([{ target: wrapEl }]);
			// throttle 50ms，再等一会
			await sleep(80);
			await nextTick();
			await nextTick();
			expect(true).toBe(true);
			wrapper.unmount();
		});

		it('handleResize early-returns when wrapper is gone', async () => {
			const wrapper = mount(() => (<RecycleList />), { attachTo: document.body });
			await nextTick();

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const rz = (wrapEl as any).__rz__;
			// 提前卸载，使 wrapper.value 失效；后续触发 handleResize 应当 early-return
			wrapper.unmount();
			expect(() => rz?.handleResize?.([{ target: wrapEl }])).not.toThrow();
			await sleep(60);
		});
	});

	describe('Lifecycle', () => {
		it('removes listeners and cleans up on unmount without throwing', async () => {
			const wrapper = mount(() => (<RecycleList />), { attachTo: document.body });
			await nextTick();
			expect(() => wrapper.unmount()).not.toThrow();
		});

		it('mouseenter / touchstart on second wrapper switches currentLeaf in shared store', async () => {
			const store = new RecycleListStore({});
			const wrapper = mount(() => (
				<>
					<RecycleList class="list-a" store={store}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
					<RecycleList class="list-b" store={store}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
				</>
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);

			expect(store.scroll.leafs.length).toBe(2);
			const [leafA, leafB] = store.scroll.leafs;
			expect(store.scroll.currentLeaf).toBe(leafA);

			const wrappers = wrapper.findAll('.vc-recycle-list__wrapper');
			const second = wrappers[1].element as HTMLElement;

			// jsdom 中 'ontouchend' in document 为 true，组件实际监听的是 touchstart
			const ev = new Event('touchstart') as any;
			ev.touches = [{ screenX: 0, screenY: 0 }];
			second.dispatchEvent(ev);

			expect(store.scroll.currentLeaf).toBe(leafB);
			wrapper.unmount();
		});
	});
});
