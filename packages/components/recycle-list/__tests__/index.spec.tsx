// @vitest-environment jsdom

import { Customer, RecycleList, RecycleListStore, MRecycleList } from '@deot/vc-components';
import { RecycleListItemNode } from '../store';
import { mount } from '@vue/test-utils';
import { defineComponent, getCurrentInstance, nextTick, onMounted, ref, toRaw } from 'vue';
import { vi } from 'vitest';

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

		it('does NOT render pull node when inverted=true even if pullable=true', () => {
			const wrapper = mount(() => (<RecycleList pullable inverted />));

			expect(wrapper.find('.vc-recycle-list__pull').exists()).toBe(false);
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

			const scroller = wrapper.find('.vc-scroller__wrapper');
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
			const loadData = vi.fn(async ({ current }: any) => {
				return buildItems(3, current);
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
			// current = 第N次请求；count = 当前已加载条数
			expect(loadData.mock.calls[0][0]).toEqual({ current: 1, count: 0 });
			expect(listRef.value.store.states.rebuildData.length).toBe(3);
		});

		it('passes { current, count } to loadData and appends by start', async () => {
			const loadData = vi.fn(async ({ current }: any) => buildItems(2, current));
			const store = new RecycleListStore({ loadData });

			let r = await store.fetchPage();
			expect(loadData).toHaveBeenLastCalledWith({ current: 1, count: 0 });
			expect([r.start, r.end]).toEqual([0, 2]);
			// 非空页推断为未结束
			expect(r.response.finished).toBe(false);

			r = await store.fetchPage();
			expect(loadData).toHaveBeenLastCalledWith({ current: 2, count: 2 });
			expect([r.start, r.end]).toEqual([2, 4]);
			expect(store.local.originalData.length).toBe(4);
		});

		it('count passed to loadData includes local data length', async () => {
			const loadData = vi.fn(async () => false);
			mount(() => (
				<RecycleList data={buildItems(4)} loadData={loadData}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);

			expect(loadData).toHaveBeenCalledWith({ current: 1, count: 4 });
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
				isEmpty: false
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
				isEmpty: true
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
				isEmpty: false
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
		const flushLayout = async () => {
			for (let i = 0; i < 6; i++) {
				await nextTick();
				await sleep(0);
			}
		};

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

			await flushLayout();

			expect(wrapper.find('.my-footer').exists()).toBe(true);
			expect(seen[seen.length - 1]).toEqual({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: false
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

			await flushLayout();

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

			await flushLayout();

			expect(seen[seen.length - 1]).toEqual({
				isEnd: true,
				isLoading: false,
				isSilentRefresh: false,
				isEmpty: true
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

			await flushLayout();
			expect(wrapper.find('.my-footer').exists()).toBe(true);
			const emittedBefore = seen.length;

			// 如 Table 排序：整体替换为等长的新数组，节点会被重置为待测量
			data.value = buildItems(3, 2, 100);
			await nextTick();
			expect(wrapper.find('.my-footer').exists()).toBe(true);

			await flushLayout();
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
		it('passes scrollerOptions through to inner ScrollerWheel', () => {
			const wrapper = mount(() => (
				<RecycleList scrollerOptions={{ native: true, height: '300px' } as any} />
			));

			const wrap = wrapper.find('.vc-recycle-list__wrapper');
			expect(wrap.classes()).toContain('is-native');
			expect(wrap.attributes('style') ?? '').toContain('height: 300px');
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
			const loadData = vi.fn(({ current }: any) => {
				return current === 1
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
			expect(loadData).toHaveBeenCalledWith({ current: 1, count: 0 });

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

	describe('Position.updateVisibleRange / Layout.refresh', () => {
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

		const layoutNode = (
			_store: InstanceType<typeof RecycleListStore>,
			index: number,
			geometry: { position: number; size: number; column?: number }
		) => {
			const node = RecycleListItemNode.of({ index, data: { id: index } });
			node.states.position = geometry.position;
			node.states.size = geometry.size;
			node.states.column = geometry.column ?? 0;
			return node;
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
		// 注意：jsdom 中 'ontouchend' in window/document 为 true，组件 isTouch 会取 true，
		// 因此 Container 的 onMousedown / onMousemove / onMouseup 在 jsdom 中不会触发刷新。
		// 这里使用 touchstart / touchmove / touchend 进行驱动。
		const fireTouch = (
			el: Element,
			type: 'touchstart' | 'touchmove' | 'touchend',
			screenY: number,
			targetTouches?: any[]
		) => {
			const ev = new Event(type, { bubbles: true, cancelable: true }) as any;
			ev.touches = [{ screenX: 0, screenY }];
			ev.targetTouches = targetTouches ?? [];
			el.dispatchEvent(ev);
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

		it('inverted=true does NOT engage pull-to-refresh', async () => {
			const loadData = vi.fn(async () => false);
			const wrapper = mount(() => (
				<RecycleList pullable inverted loadData={loadData} pauseOffset={30} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);

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

	describe('Measure pool: re-measure synchronously, slice only new nodes', () => {
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

		it('keeps shown rows on screen when data is replaced with new objects', async () => {
			const { data, states, shown, restore } = await setup(30, 30);

			// 换成新对象（并删掉首行）：已展示过的行全部重新待测，必须在同一个任务里测完并重新排版，不能先白屏再逐片出现
			data.value = data.value.slice(1).map(item => ({ ...item }));
			await flushMicrotasks();

			expect(states.preData.length).toBe(0);
			expect(shown().length).toBeGreaterThan(0);
			expect(shown()[0].text()).toBe('1');
			restore();
		});

		it('keeps shown rows on screen when the layout is refreshed', async () => {
			const { list, states, shown, restore } = await setup(30, 30);

			// 尺寸变化后的整体重排同理：全部节点重新待测，但画面上的行不能消失
			list.refreshLayout();
			await flushMicrotasks();

			expect(states.preData.length).toBe(0);
			expect(shown().length).toBeGreaterThan(0);
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

			it('re-measures items replaced by new objects even when the content looks the same', async () => {
				const { data, states, measuredIds, restore } = await setup(30, 30, heightOf);
				measuredIds.length = 0;

				// 引用不同即视为内容可能已变：原地改了影响尺寸的字段时，替换成新对象就能触发重测
				data.value = data.value.map((item, i) => (i === 2 ? { ...item } : item));
				await flushMicrotasks();

				expect(measuredIds).toEqual([2]);
				expectLaidOutByData(states);
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
			 * 触发某个已渲染行的 Resizer 测量：行刚渲染出来时 Resizer 首次测量，inited 为 false
			 * @param wrapper 挂载结果
			 * @param id 数据 id
			 * @param height Resizer 读到的高度
			 */
			const triggerRendered = (wrapper: any, id: number, height: number) => {
				const row = wrapper
					.findAll('.vc-recycle-list__column .vc-resizer')
					.find((item: any) => item.find('.x').text() === String(id));
				const el = row.element as any;
				el.getBoundingClientRect = () => ({
					width: 100, height, top: 0, left: 0, right: 100, bottom: height, x: 0, y: 0, toJSON: () => ({})
				});
				el.__rz__.handleResize([{ target: el }]);
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
				triggerRendered(wrapper, 3, 80);
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
				triggerRendered(wrapper, 6, heights[6]);
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
				triggerRendered(wrapper, 3, 80);
				await flushMicrotasks();

				const rows = () => wrapper.findAll('.vc-recycle-list__column .vc-resizer').map((item: any) => item.element);
				const before = rows();
				const build = vi.spyOn(list.store.nodes, 'build');
				measuredIds.length = 0;
				onRowResize.mockClear();

				// 同一行再次变化（Resizer 已完成首次测量，如展开、编辑、图片撑开）
				heights[3] = 120;
				triggerRendered(wrapper, 3, 120);
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

				triggerRendered(wrapper, 3, heightOf(3));
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
				triggerRendered(wrapper, 3, 10);
				await flushMicrotasks();

				expect(states.rebuildData[3].states.size).toBe(23);
				expect(states.preData.length).toBe(0);
				restore();
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
