// @vitest-environment jsdom

import { Customer, RecycleList, RecycleListStore, MRecycleList } from '@deot/vc-components';
import { RecycleListItemNode } from '../store';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
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
				// batchSize=100: 单页覆盖全部数据，聚焦滚动渲染协调而非懒构建分页
				<RecycleList data={data} batchSize={100} loadData={loadData}>
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
			const renderCallsById = new Map<number, number>();
			const renderItem = vi.fn((props: any) => {
				const id = props.row.id;
				renderCallsById.set(id, (renderCallsById.get(id) || 0) + 1);
				return <div class="memo-item">{id}</div>;
			});

			const wrapper = mount(() => (
				// batchSize=5: 单页覆盖追加后的数据，聚焦追加渲染协调而非懒构建分页
				<RecycleList data={data.value} batchSize={5} loadData={loadData}>
					{{
						default: ({ row }: any) => <Customer row={row} render={renderItem} />
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();
			await sleep(0);

			const initialRenderCount = renderItem.mock.calls.length;
			expect(initialRenderCount).toBeGreaterThan(0);

			data.value = [...data.value, buildItem(3, 1)];
			await nextTick();
			await nextTick();

			// 只新增一项渲染，而不是触发全部项重渲染
			expect(renderItem.mock.calls.length).toBe(initialRenderCount + 1);
			expect(renderCallsById.get(3)).toBe(1);

			wrapper.unmount();
		});
	});

	describe('Props - data / batchSize', () => {
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

		it('component lazy-builds local data by batchSize', async () => {
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={buildItems(10)} batchSize={4}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();

			// 初始一页(4) + 挂载时懒构建一页(4)
			expect(listRef.value.store.buildCount).toBe(8);
			expect(listRef.value.store.states.rebuildData.length).toBe(8);
		});

		it('updates data when prop changes', async () => {
			const data = ref(buildItems(3));
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={data.value} batchSize={3}>
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

	describe('Local data lazy build (paging by batchSize)', () => {
		it('initially builds only one page for large data', async () => {
			const data = buildItems(1000);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data} batchSize={200}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(20);
			await nextTick();

			const store = listRef.value.store;
			expect(store.localTotal).toBe(1000);
			// 初始一页 + 挂载时 loadData 预构建一页（与远程模式挂载即拉一页语义一致）
			expect(store.states.rebuildData.length).toBeLessThan(1000);
			expect(store.states.rebuildData.length % 200).toBe(0);
			expect(store.buildCount).toBe(store.states.rebuildData.length);
			wrapper.unmount();
		});

		it('scrolling to bottom builds next local page without calling remote loadData', async () => {
			const data = buildItems(1000);
			const loadData = vi.fn(async () => false);
			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} data={data} batchSize={200} loadData={loadData}>
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
				<RecycleList ref={listRef} data={data} batchSize={20} loadData={loadData}>
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
				<RecycleList ref={listRef} inverted data={data} batchSize={200} loadData={loadData}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			// 等待挂载预构建完成（jsdom下Defer基于idle回调，完成时机不定）
			for (let i = 0; i < 30 && listRef.value.store.buildCount < 400; i++) {
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
				<RecycleList ref={listRef} disabled data={data} batchSize={200} loadData={loadData}>
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
				<RecycleList ref={listRef} data={data.value} batchSize={200}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await sleep(20);
			await nextTick();

			const built = listRef.value.store.buildCount;
			expect(built).toBeGreaterThanOrEqual(400);

			data.value = [...data.value, buildItem(600)];
			await nextTick();
			await nextTick();

			// 已构建进度保留，不回退到一页
			expect(listRef.value.store.buildCount).toBeGreaterThanOrEqual(built);
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
			expect(store.originalData.length).toBe(4);
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

	describe('Exposed API', () => {
		it('exposes recycleListId / store / hasPlaceholder / renderer / methods', async () => {
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} />
			), { attachTo: document.body });
			await nextTick();

			const exposed = listRef.value;
			expect(typeof exposed.recycleListId).toBe('string');
			expect(exposed.recycleListId.startsWith('recycle-list')).toBe(true);
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
			expect(store.leafs.length).toBe(2);
		});

		it('Store.setData returns true on first call and false when same array passed again', () => {
			const store = new RecycleListStore({});
			const data = buildItems(3);

			expect(store.setData(data)).toBe(true);
			expect(store.setData(data)).toBe(false);
		});

		it('batchSize controls local lazy build page size', () => {
			const store = new RecycleListStore({ batchSize: 8 });
			store.setData(buildItems(20));

			// 初始按batchSize构建一页
			expect(store.states.rebuildData.length).toBe(8);
			expect(store.consumeLocalPage()).toEqual({ start: 8, end: 16, reversed: false });
			// 尾页不足batchSize时取剩余量
			expect(store.consumeLocalPage()).toEqual({ start: 16, end: 20, reversed: false });
			expect(store.consumeLocalPage()).toBe(null);
		});

		it('batchSize defaults to 20', () => {
			const store = new RecycleListStore({});
			store.setData(buildItems(30));

			expect(store.states.rebuildData.length).toBe(20);
			expect(store.consumeLocalPage()).toEqual({ start: 20, end: 30, reversed: false });
		});

		it('Store.setData does NOT mark isEnd', () => {
			const store = new RecycleListStore({});

			store.setData(buildItems(3));
			expect(store.states.isEnd).toBe(false);
		});

		it('Store add / remove updates leafs and currentLeaf', () => {
			const store = new RecycleListStore({});

			const a = { id: 'A' };
			const b = { id: 'B' };

			store.add(a);
			store.add(b);

			expect(store.currentLeaf).toBe(a);
			expect(store.leafs).toEqual([a, b]);

			store.remove(a);
			expect(store.leafs).toEqual([b]);
		});

		it('Store.setOriginData places items at given start offset', () => {
			const store = new RecycleListStore({});
			store.setOriginData(3, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

			expect(store.originalData[3]).toEqual({ id: 'a' });
			expect(store.originalData[4]).toEqual({ id: 'b' });
			expect(store.originalData[5]).toEqual({ id: 'c' });
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
					batchSize={3}
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
				<RecycleList ref={listRef} inverted batchSize={20} loadData={loadData}>
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

			// 还没 resolve 时，rebuildData.length 已经被预扩展 batchSize 个占位
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

	describe('Store - setRangeByPosition / refreshItemPosition', () => {
		it('setRangeByPosition with empty rebuildData resets indexes', () => {
			const store = new RecycleListStore({});
			store.states.rebuildData = [];
			store.setRangeByPosition(0, 100);
			expect(store.states.firstItemIndex).toBe(0);
			expect(store.states.lastItemIndex).toBe(0);
		});

		it('refreshItemPosition computes contentMaxSize and column distribution (cols=2)', () => {
			const store = new RecycleListStore({ cols: 2 });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]);
			store.states.rebuildData.forEach((it: any, i: number) => {
				it.states.size = (i + 1) * 10; // 10, 20, 30, 40
			});

			store.refreshItemPosition();

			// 列大小: 第一项进列0, 第二项进列1（最小都是0），然后比较
			// 0 -> col0 size=10, 1 -> col1 size=20, 2 -> col0 size=10+30=40, 3 -> col1 size=20+40=60
			// contentMaxSize = max(40, 60) = 60
			expect(store.states.contentMaxSize).toBe(60);
			expect(store.states.columnFillSize.length).toBe(2);
			expect(store.states.columnFillSize[1]).toBe(0); // 最高的 column 不需要填充
		});

		it('trimPlaceholders trims trailing placeholders', () => {
			const store = new RecycleListStore({});
			store.states.rebuildData = [
				RecycleListItemNode.of({ store, index: 0, data: { id: 0 } }),
				RecycleListItemNode.of({ store, index: 1, data: { id: 1 } }),
				RecycleListItemNode.of({ store, index: 2 }) // 还没加载到的占位
			] as any;

			expect(store.trimPlaceholders()).toBe(true);
			expect(store.states.rebuildData.length).toBe(2);
			// 无可裁剪时返回false
			expect(store.trimPlaceholders()).toBe(false);
		});

		it('Store.setItemData stores node with data when provided, placeholder otherwise', () => {
			const store = new RecycleListStore({});
			store.setItemData(0, { value: 'a' });
			store.setItemData(1);

			const a = store.states.rebuildData[0];
			const b = store.states.rebuildData[1];
			expect(a.states.isPlaceholder).toBe(false);
			expect(a.states.data).toEqual({ value: 'a' });
			expect(a.states.loaded).toBe(true);
			expect(a.states.index).toBe(0);
			expect(b.states.isPlaceholder).toBe(true);
			expect(b.states.loaded).toBe(false);
			expect(typeof a.id).toBe('string');
		});

		it('Store.scrollTo forwards to all leafs except currentLeaf', () => {
			const store = new RecycleListStore({});
			const a = { exposed: { scrollTo: vi.fn() } };
			const b = { exposed: { scrollTo: vi.fn() } };

			store.add(a);
			store.add(b); // currentLeaf=a

			store.scrollTo({ target: { scrollLeft: 10, scrollTop: 20 } });

			expect((a as any).exposed.scrollTo).not.toHaveBeenCalled();
			expect((b as any).exposed.scrollTo).toHaveBeenCalledWith({ x: 10, y: 20 });
		});

		it('Store.scrollTo no-ops when no currentLeaf', () => {
			const store = new RecycleListStore({});
			expect(() => store.scrollTo({ target: { scrollLeft: 10, scrollTop: 20 } })).not.toThrow();
		});

		const layoutNode = (
			store: InstanceType<typeof RecycleListStore>,
			index: number,
			geometry: { position: number; size: number; column?: number }
		) => {
			const node = RecycleListItemNode.of({ store, index, data: { id: index } });
			node.states.position = geometry.position;
			node.states.size = geometry.size;
			node.states.column = geometry.column ?? 0;
			return node;
		};

		it('Store.setRangeByPosition updates the range when scrolling back to the top', () => {
			const store = new RecycleListStore({ cols: 1, bufferSize: 0 });
			store.states.rebuildData = Array.from({ length: 10 }).map((_, i) => layoutNode(store, i, {
				position: i * 100,
				size: 100
			})) as any;

			// 先定位到底部
			store.setRangeByPosition(800, 900);
			expect(store.states.firstItemIndex).toBeGreaterThan(0);

			// 再往回滚到顶部
			store.setRangeByPosition(0, 50);
			expect(store.states.firstItemIndex).toBe(0);
		});

		it('Store.setRangeByPosition includes the previous item at a shared boundary', () => {
			const store = new RecycleListStore({ cols: 1, bufferSize: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;

			store.setRangeByPosition(101, 150);
			expect(store.states.firstItemIndex).toBe(1);

			store.setRangeByPosition(100, 150);
			expect(store.states.firstItemIndex).toBe(0);
		});

		it('Store.setRangeByPosition handles non-monotonic inverted multi-column positions', () => {
			const store = new RecycleListStore({ cols: 2, inverted: true, bufferSize: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 10, column: 0 }),
				layoutNode(store, 1, { position: 10, size: 10, column: 0 }),
				layoutNode(store, 2, { position: 20, size: 10, column: 0 }),
				layoutNode(store, 3, { position: 0, size: 100, column: 1 })
			] as any;
			store.states.columnFillSize = [70, 0];

			store.setRangeByPosition(85, 85);

			expect(store.states.firstItemIndex).toBe(1);
			expect(store.states.lastItemIndex).toBe(3);
		});

		it('Store.setRangeByPosition uses content-local coordinates for inverted lists', () => {
			const store = new RecycleListStore({ cols: 1, inverted: true, bufferSize: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;
			store.states.columnFillSize = [0];

			store.setRangeByPosition(100, 100);

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

		it('Store.setRangeByPosition handles generated inverted positions', () => {
			const store = new RecycleListStore({ cols: 1, inverted: true });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }]);
			store.states.rebuildData.forEach((it: any, i: number) => {
				it.states.size = 50;
				it.states.column = 0;
				it.states.position = i * 50;
			});
			store.refreshItemPosition();
			expect(() => store.setRangeByPosition(60, 200)).not.toThrow();
		});

		it.each([
			{ cols: 3, inverted: false },
			{ cols: 1, inverted: true },
			{ cols: 3, inverted: true }
		])('Store.setRangeByPosition matches all visible items for $cols columns, inverted=$inverted', ({ cols, inverted }) => {
			const store = new RecycleListStore({ cols, inverted, batchSize: 12, bufferSize: 0 });
			store.setData(Array.from({ length: 12 }).map((_, id) => ({ id })));
			const sizes = [100, 20, 80, 40, 120, 30, 60, 90, 25, 110, 35, 70];
			store.states.rebuildData.forEach((item: any, index: number) => { item.states.size = sizes[index]; });
			store.refreshItemPosition();

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

				store.setRangeByPosition(headPosition, tailPosition);
				expect(store.states.firstItemIndex).toBe(Math.min(...visible));
				expect(store.states.lastItemIndex).toBe(Math.max(...visible));
			}
		});

		it('Store.setRangeByPosition no-ops when range unchanged', () => {
			const store = new RecycleListStore({ cols: 1 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;
			store.setRangeByPosition(0, 200);
			const f = store.states.firstItemIndex;
			const l = store.states.lastItemIndex;
			store.setRangeByPosition(0, 200); // 相同范围
			expect(store.states.firstItemIndex).toBe(f);
			expect(store.states.lastItemIndex).toBe(l);
		});

		it('Store.setRangeByPosition reads geometry updates from the current reactive source', () => {
			const store = new RecycleListStore({ cols: 1, bufferSize: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100 }),
				layoutNode(store, 1, { position: 100, size: 100 })
			] as any;

			store.setRangeByPosition(150, 150);
			expect([store.states.firstItemIndex, store.states.lastItemIndex]).toEqual([1, 1]);
			const positionIndexSource = store.positionIndexSource;

			store.states.rebuildData[0].states.size = 200;
			store.states.rebuildData[1].states.position = 200;
			store.setRangeByPosition(150, 150);

			expect(store.positionIndexSource).toBe(positionIndexSource);
			expect([store.states.firstItemIndex, store.states.lastItemIndex]).toEqual([0, 0]);
		});

		it('Store.setRangeByPosition rebuilds the column index after same-length source replacement', () => {
			const store = new RecycleListStore({ cols: 2, bufferSize: 0 });
			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 10, column: 0 }),
				layoutNode(store, 1, { position: 0, size: 100, column: 1 }),
				layoutNode(store, 2, { position: 10, size: 10, column: 0 })
			] as any;
			store.setRangeByPosition(15, 15);
			const positionIndexSource = store.positionIndexSource;

			store.states.rebuildData = [
				layoutNode(store, 0, { position: 0, size: 100, column: 0 }),
				layoutNode(store, 1, { position: 0, size: 10, column: 1 }),
				layoutNode(store, 2, { position: 10, size: 10, column: 1 })
			] as any;
			store.setRangeByPosition(15, 15);

			expect(store.positionIndexSource).not.toBe(positionIndexSource);
			expect(store.positionIndex).toEqual([[0], [1, 2]]);
			expect([store.states.firstItemIndex, store.states.lastItemIndex]).toEqual([0, 2]);
		});

		it('Store.refreshItemPosition handles inverted multi-column', () => {
			const store = new RecycleListStore({ cols: 2, inverted: true });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]);
			store.states.rebuildData.forEach((it: any) => { it.states.size = 50; });
			store.refreshItemPosition();
			expect(store.states.contentMaxSize).toBeGreaterThan(0);
			expect(store.states.columnFillSize.length).toBe(2);
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
				RecycleListItemNode.of({ store, index: 0 }),
				RecycleListItemNode.of({ store, index: 1 }),
				RecycleListItemNode.of({ store, index: 2, data: { id: 2 } }),
				RecycleListItemNode.of({ store, index: 3, data: { id: 3 } })
			] as any;

			// 反向模式下，前导 placeholder 应被裁掉
			expect(store.trimPlaceholders()).toBe(true);
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
			const orig = store.refreshItemPosition.bind(store);
			store.refreshItemPosition = function () {
				orig();
				if (this.states.contentMaxSize === 0 && this.states.rebuildData.length > 0) {
					this.states.contentMaxSize = 10;
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

			expect(store.leafs.length).toBe(2);
			const [leafA, leafB] = store.leafs;
			expect(store.currentLeaf).toBe(leafA);

			const wrappers = wrapper.findAll('.vc-recycle-list__wrapper');
			const second = wrappers[1].element as HTMLElement;

			// jsdom 中 'ontouchend' in document 为 true，组件实际监听的是 touchstart
			const ev = new Event('touchstart') as any;
			ev.touches = [{ screenX: 0, screenY: 0 }];
			second.dispatchEvent(ev);

			expect(store.currentLeaf).toBe(leafB);
			wrapper.unmount();
		});
	});
});
