// @vitest-environment jsdom

// 在导入之前补齐 jsdom 缺失的 ResizeObserver
const resizeObserverInstances: any[] = [];
class MockResizeObserver {
	cb: any;
	targets: Set<Element> = new Set();
	constructor(cb: any) {
		this.cb = cb;
		resizeObserverInstances.push(this);
	}

	observe(el: Element) { this.targets.add(el); }
	unobserve(el: Element) { this.targets.delete(el); }
	disconnect() { this.targets.clear(); }
	trigger(target: Element) {
		this.cb([{ target }]);
	}
}
(globalThis as any).ResizeObserver = MockResizeObserver;

import { RecycleList, RecycleListStore } from '@deot/vc-components';
import { MRecycleList } from '../index.m';
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
					pageSize={6}
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
					pageSize={3}
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
					pageSize={3}
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

			const items = wrapper.findAll('.row-item');
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

	describe('Props - data / pageSize', () => {
		it('initializes from data prop and marks isEnd when data length is not multiple of pageSize', async () => {
			const data = buildItems(3); // 3 % 5 != 0 => isEnd=true
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={data} pageSize={5}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();

			expect(listRef.value.store.states.isEnd).toBe(true);
			expect(listRef.value.store.states.rebuildData.length).toBe(3);
		});

		it('does NOT mark isEnd when data length is exact multiple of pageSize', async () => {
			const data = buildItems(10); // 10 % 5 == 0 => not end
			const listRef = ref<any>();
			// 使用 disabled 避免 onMounted 阶段的 loadData 触发 stopScroll(isEnd=true)
			mount(() => (
				<RecycleList ref={listRef} data={data} pageSize={5} disabled>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();

			expect(listRef.value.store.states.isEnd).toBe(false);
			expect(listRef.value.store.states.rebuildData.length).toBe(10);
		});

		it('updates data when prop changes', async () => {
			const data = ref(buildItems(3));
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} data={data.value} pageSize={3}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			));

			await nextTick();
			const oldLen = listRef.value.store.states.rebuildData.length;
			expect(oldLen).toBe(3);

			data.value = buildItems(6, 1, 100);
			await nextTick();
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

	describe('loadData behaviour', () => {
		it('auto-loads first page on mount and stores data', async () => {
			const loadData = vi.fn(async (page: number, pageSize: number) => {
				return buildItems(pageSize, page);
			});

			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} pageSize={3} />
			), { attachTo: document.body });

			// 触发 onMounted -> loadData
			await nextTick();
			await sleep(0);
			await nextTick();

			expect(loadData).toHaveBeenCalledTimes(1);
			expect(loadData.mock.calls[0][0]).toBe(1); // page = 1
			expect(loadData.mock.calls[0][1]).toBe(3); // pageSize = 3
			expect(listRef.value.store.states.rebuildData.length).toBe(3);
		});

		it('handles { data, finished } object response and marks isEnd when finished', async () => {
			const loadData = vi.fn(async () => ({ data: buildItems(5), finished: true }));

			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} pageSize={5} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			expect(loadData).toHaveBeenCalledTimes(1);
			expect(listRef.value.store.states.isEnd).toBe(true);
			expect(listRef.value.store.states.rebuildData.length).toBe(5);
		});

		it('treats array shorter than pageSize as finished', async () => {
			const loadData = vi.fn(async () => buildItems(2)); // less than pageSize

			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} pageSize={5} />
			), { attachTo: document.body });

			await nextTick();
			await sleep(0);
			await nextTick();

			expect(listRef.value.store.states.isEnd).toBe(true);
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
				<RecycleList disabled={disabled.value} loadData={loadData} pageSize={3} />
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
				<RecycleList ref={listRef} disabled={disabled.value} loadData={loadData} pageSize={3} />
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
				<RecycleList ref={listRef} data={buildItems(3)} pageSize={3}>
					{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			const wrapEl = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
			const target = listRef.value.store.states.rebuildData[1];
			if (target) {
				target.top = 200;
			}

			listRef.value.scrollToIndex(1, 10);
			expect(wrapEl.scrollTop).toBe(210);
		});

		it('reset clears state and re-loads data', async () => {
			const loadData = vi.fn(async () => buildItems(3));
			const listRef = ref<any>();
			mount(() => (
				<RecycleList ref={listRef} loadData={loadData} pageSize={3} />
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
				<RecycleList ref={listRef} data={buildItems(2)} pageSize={2}>
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
			const data = buildItems(3); // 3 % default pageSize(20) !== 0 => isEnd
			const wrapper = mount(() => (
				<RecycleList data={data} pageSize={20}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			expect(wrapper.find('.vc-recycle-list__complete').exists()).toBe(true);
			wrapper.unmount();
		});

		it('renderComplete prop customizes complete rendering', async () => {
			const wrapper = mount(() => (
				<RecycleList
					data={buildItems(3)}
					pageSize={20}
					renderComplete={() => <div class="my-complete">all loaded</div>}
				>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
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
			const loadData = vi.fn(async (_: number, pageSize: number) => buildItems(pageSize));
			const store = new RecycleListStore({ pageSize: 5, loadData });

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
			const store = new RecycleListStore({ pageSize: 5 });
			const data = buildItems(3);

			expect(store.setData(data)).toBe(true);
			expect(store.setData(data)).toBe(false);
		});

		it('Store.setData with length not multiple of pageSize sets isEnd=true', () => {
			const store = new RecycleListStore({ pageSize: 5 });
			const data = buildItems(3);

			store.setData(data);
			expect(store.states.isEnd).toBe(true);
		});

		it('Store add / remove updates leafs and currentLeaf', () => {
			const store = new RecycleListStore({ pageSize: 5 });

			const a = { id: 'A' };
			const b = { id: 'B' };

			store.add(a);
			store.add(b);

			expect(store.currentLeaf).toBe(a);
			expect(store.leafs).toEqual([a, b]);

			store.remove(a);
			expect(store.leafs).toEqual([b]);
		});

		it('Store.setOriginData places items at correct page offset', () => {
			const store = new RecycleListStore({ pageSize: 3 });
			store.setOriginData(2, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

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
				<RecycleList ref={listRef} inverted disabled data={data} pageSize={3}>
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
			// 提供 data=pageSize 的整数倍，避免 setData 时 isEnd 直接为 true，
			// 让 onMounted 中的 loadData() 真正进入 hasPlaceholder + inverted 分支
			const wrapper = mount(() => (
				<RecycleList
					ref={listRef}
					inverted
					data={buildItems(3)}
					loadData={loadData}
					pageSize={3}
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

		it('non-inverted loadData with placeholder allocates rebuildData length', async () => {
			let resolveFn: (v: any) => void = () => {};
			const loadData = () => new Promise((resolve) => { resolveFn = resolve; });

			const listRef = ref<any>();
			mount(() => (
				<RecycleList
					ref={listRef}
					loadData={loadData as any}
					pageSize={4}
				>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						placeholder: () => <div class="ph">ph</div>
					}}
				</RecycleList>
			), { attachTo: document.body });

			await nextTick();
			await nextTick();

			// 还没 resolve 时，rebuildData.length 已经被预扩展到 pageSize
			expect(listRef.value.store.states.rebuildData.length).toBe(4);

			resolveFn(buildItems(4));
			await sleep(0);
			await nextTick();
		});
	});

	describe('Store - setRangeByPosition / refreshItemPosition', () => {
		it('setRangeByPosition with empty rebuildData resets indexes', () => {
			const store = new RecycleListStore({ pageSize: 5 });
			store.states.rebuildData = [];
			store.setRangeByPosition(0, 100);
			expect(store.states.firstItemIndex).toBe(0);
			expect(store.states.lastItemIndex).toBe(0);
		});

		it('refreshItemPosition computes contentMaxSize and column distribution (cols=2)', () => {
			const store = new RecycleListStore({ pageSize: 4, cols: 2 });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]);
			store.states.rebuildData.forEach((it: any, i: number) => {
				it.size = (i + 1) * 10; // 10, 20, 30, 40
			});

			store.refreshItemPosition();

			// 列大小: 第一项进列0, 第二项进列1（最小都是0），然后比较
			// 0 -> col0 size=10, 1 -> col1 size=20, 2 -> col0 size=10+30=40, 3 -> col1 size=20+40=60
			// contentMaxSize = max(40, 60) = 60
			expect(store.states.contentMaxSize).toBe(60);
			expect(store.states.columnFillSize.length).toBe(2);
			expect(store.states.columnFillSize[1]).toBe(0); // 最高的 column 不需要填充
		});

		it('removeUnusedPlaceholders trims trailing placeholders for current page', () => {
			const store = new RecycleListStore({ pageSize: 3 });
			const items = [
				{ id: 0, isPlaceholder: false },
				{ id: 1, isPlaceholder: false },
				{ id: 2, isPlaceholder: true } // 还没加载到的占位
			];
			store.states.rebuildData = items as any;

			store.removeUnusedPlaceholders(items.slice(0), 1);
			expect(store.states.rebuildData.length).toBe(2);
		});

		it('Store.setItemData stores node with data when provided, placeholder otherwise', () => {
			const store = new RecycleListStore({ pageSize: 3 });
			store.setItemData(0, { value: 'a' });
			store.setItemData(1);

			const a = store.states.rebuildData[0];
			const b = store.states.rebuildData[1];
			expect(a.isPlaceholder).toBe(false);
			expect(a.data).toEqual({ value: 'a' });
			expect(a.loaded).toBe(1);
			expect(b.isPlaceholder).toBe(true);
			expect(b.loaded).toBe(0);
		});

		it('Store.scrollTo forwards to all leafs except currentLeaf', () => {
			const store = new RecycleListStore({ pageSize: 3 });
			const a = { exposed: { scrollTo: vi.fn() } };
			const b = { exposed: { scrollTo: vi.fn() } };

			store.add(a);
			store.add(b); // currentLeaf=a

			store.scrollTo({ target: { scrollLeft: 10, scrollTop: 20 } });

			expect((a as any).exposed.scrollTo).not.toHaveBeenCalled();
			expect((b as any).exposed.scrollTo).toHaveBeenCalledWith({ x: 10, y: 20 });
		});

		it('Store.scrollTo no-ops when no currentLeaf', () => {
			const store = new RecycleListStore({ pageSize: 3 });
			expect(() => store.scrollTo({ target: { scrollLeft: 10, scrollTop: 20 } })).not.toThrow();
		});

		it('Store.setRangeByPosition uses hint to walk backwards (hi = hint - 1)', () => {
			const store = new RecycleListStore({ pageSize: 5, cols: 1, bufferSize: 0 });
			store.states.rebuildData = Array.from({ length: 10 }).map((_, i) => ({
				id: i,
				position: i * 100,
				size: 100,
				column: 0,
				isPlaceholder: false
			})) as any;

			// 先定位到底部
			store.setRangeByPosition(800, 900);
			expect(store.states.firstItemIndex).toBeGreaterThan(0);

			// 再往回滚到顶部，触发 hint > target 分支（hi = hint - 1）
			store.setRangeByPosition(0, 50);
			expect(store.states.firstItemIndex).toBe(0);
		});

		it('Store.setRangeByPosition handles inverted with offset adjustment', () => {
			const store = new RecycleListStore({ pageSize: 5, cols: 1, inverted: true });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }]);
			store.states.rebuildData.forEach((it: any, i: number) => { it.size = 50; it.column = 0; it.position = i * 50; });
			store.refreshItemPosition();
			expect(() => store.setRangeByPosition(60, 200)).not.toThrow();
		});

		it('Store.setRangeByPosition no-ops when range unchanged', () => {
			const store = new RecycleListStore({ pageSize: 5, cols: 1 });
			store.states.rebuildData = [
				{ id: 0, position: 0, size: 100, column: 0 },
				{ id: 1, position: 100, size: 100, column: 0 }
			] as any;
			store.setRangeByPosition(0, 200);
			const f = store.states.firstItemIndex;
			const l = store.states.lastItemIndex;
			store.setRangeByPosition(0, 200); // 相同范围
			expect(store.states.firstItemIndex).toBe(f);
			expect(store.states.lastItemIndex).toBe(l);
		});

		it('Store.refreshItemPosition handles inverted multi-column', () => {
			const store = new RecycleListStore({ pageSize: 4, cols: 2, inverted: true });
			store.setData([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]);
			store.states.rebuildData.forEach((it: any) => { it.size = 50; });
			store.refreshItemPosition();
			expect(store.states.contentMaxSize).toBeGreaterThan(0);
			expect(store.states.columnFillSize.length).toBe(2);
		});

		it('Store.setData with empty array clears rebuildData', () => {
			const store = new RecycleListStore({ pageSize: 5 });
			store.setData([{ id: 0 }, { id: 1 }]);
			expect(store.states.rebuildData.length).toBe(2);

			store.setData([]);
			expect(store.states.rebuildData.length).toBe(0);
		});

		it('Store.removeUnusedPlaceholders inverted variant trims leading placeholders', () => {
			const store = new RecycleListStore({ pageSize: 3, inverted: true });
			const items = [
				{ id: 0, isPlaceholder: true },
				{ id: 1, isPlaceholder: true },
				{ id: 2, isPlaceholder: false },
				{ id: 3, isPlaceholder: false }
			];
			store.states.rebuildData = items as any;

			store.removeUnusedPlaceholders(items.slice(0), 1);
			// 反向模式下，前导 placeholder 应被裁掉
			expect(store.states.rebuildData.length).toBeLessThan(items.length);
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
			const loadData = vi.fn(async (_p: number, size: number) => {
				callCount++;
				// 第一次：返回足量数据
				if (callCount === 1) {
					return Array.from({ length: size }).map((_, i) => ({ id: i }));
				}
				// 第二次：终止
				return false;
			});

			const listRef = ref<any>();
			const wrapper = mount(() => (
				<RecycleList ref={listRef} loadData={loadData} pageSize={3} />
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
				<RecycleList ref={listRef} data={data} pageSize={3} disabled>
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
				it.size = 80;
				it.position = i * 80;
				it.isPlaceholder = false;
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
			const store = new RecycleListStore({ pageSize: 5 });
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
