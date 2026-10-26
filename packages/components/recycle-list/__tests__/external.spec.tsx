// @vitest-environment jsdom

import { RecycleList, RecycleListStore, Scroller } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import type { Ref } from 'vue';
import { vi } from 'vitest';
import * as drag from '../../../hooks/__tests__/fixtures/drag';

const sleep = (time = 0) => new Promise(resolve => setTimeout(resolve, time));

// 记录所有 ResizeObserver 实例：测试里按被观察的元素找到对应的观察器再触发回调
const observers: any[] = [];
const MockResizeObserver = (globalThis as any).ResizeObserver;
(globalThis as any).ResizeObserver = class extends MockResizeObserver {
	constructor(cb: any) {
		super(cb);
		observers.push(this);
	}
};
// 观察着某个元素的观察器
const observerOf = (el: Element) => observers.find(ro => ro.targets.has(el));

const defineGetter = (target: any, key: string, getter: () => any) => {
	const original = Object.getOwnPropertyDescriptor(target, key);
	Object.defineProperty(target, key, {
		configurable: true,
		get: getter
	});
	return () => {
		if (original) {
			Object.defineProperty(target, key, original);
		} else {
			delete target[key];
		}
	};
};

const rect = (top: number, left: number, width: number, height: number) => ({
	x: left,
	y: top,
	top,
	right: left + width,
	bottom: top + height,
	left,
	width,
	height,
	toJSON: () => ({})
});

const setRect = (el: Element, getter: () => ReturnType<typeof rect>) => {
	const original = Object.getOwnPropertyDescriptor(el, 'getBoundingClientRect');
	Object.defineProperty(el, 'getBoundingClientRect', {
		configurable: true,
		value: getter
	});
	return () => {
		if (original) {
			Object.defineProperty(el, 'getBoundingClientRect', original);
		} else {
			delete (el as any).getBoundingClientRect;
		}
	};
};

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const mockVerticalGeometry = (
	viewport: HTMLElement,
	root: HTMLElement,
	content: HTMLElement,
	options: {
		clientSize?: number;
		// 函数形式用来模拟前置内容伸缩：列表根随之整体平移
		listStart?: number | (() => number);
		listSize?: number;
		contentStart?: () => number;
		contentSize?: number;
		// 祖先的 transform 缩放（如弹层的展开动画）：客户区中的距离与尺寸都乘上它，offsetHeight 不变
		scale?: number;
	} = {}
) => {
	const {
		clientSize = 200,
		listStart = 500,
		listSize = 400,
		contentSize = listSize,
		scale = 1
	} = options;
	const start = typeof listStart === 'function' ? listStart : () => listStart;
	const { contentStart = start } = options;
	const restores = [
		defineGetter(viewport, 'clientHeight', () => clientSize),
		defineGetter(viewport, 'offsetHeight', () => clientSize),
		defineGetter(viewport, 'scrollHeight', () => 4000),
		setRect(viewport, () => rect(100, 0, 600, clientSize * scale)),
		setRect(root, () => rect(100 + (start() - viewport.scrollTop) * scale, 0, 600, listSize * scale)),
		setRect(content, () => rect(100 + (contentStart() - viewport.scrollTop) * scale, 0, 600, contentSize * scale))
	];
	return () => restores.forEach(restore => restore());
};

// 高 200 的原生滚动容器里放一个两项的列表；返回各层节点
const mountInViewport = async (listRef: Ref<any>) => {
	const wrapper = mount(() => (
		<div class="viewport" style="overflow-y: auto; height: 200px;">
			<RecycleList ref={listRef} fill={false} disabled data={[{ id: 1 }, { id: 2 }]} batchCount={10}>
				{{ default: ({ row }: any) => <div>{row.id}</div> }}
			</RecycleList>
		</div>
	), { attachTo: document.body });
	await flush();
	const find = (selector: string) => wrapper.find(selector).element as HTMLElement;
	return {
		wrapper,
		viewport: find('.viewport'),
		root: find('.vc-recycle-list'),
		content: find('.vc-recycle-list__content'),
		inner: find('.vc-recycle-list__wrapper')
	};
};

const mockHorizontalGeometry = (
	viewport: HTMLElement,
	root: HTMLElement,
	content: HTMLElement,
	options: {
		clientSize?: number;
		listStart?: number;
		listSize?: number;
		contentStart?: number;
	} = {}
) => {
	const {
		clientSize = 320,
		listStart = 480,
		listSize = 700,
		contentStart = listStart
	} = options;
	const restores = [
		defineGetter(viewport, 'clientWidth', () => clientSize),
		defineGetter(viewport, 'offsetWidth', () => clientSize),
		defineGetter(viewport, 'scrollWidth', () => 5000),
		setRect(viewport, () => rect(0, 80, clientSize, 240)),
		setRect(root, () => rect(0, 80 + listStart - viewport.scrollLeft, listSize, 240)),
		setRect(content, () => rect(0, 80 + contentStart - viewport.scrollLeft, listSize, 240))
	];
	return () => restores.forEach(restore => restore());
};

const fireTouch = (
	el: Element,
	type: 'touchstart' | 'touchmove' | 'touchend',
	screenY: number
) => {
	drag.fireTouch(el, type, { screenX: 0, screenY });
};

const fireHorizontalTouch = (
	el: Element,
	type: 'touchstart' | 'touchmove' | 'touchend',
	screenX: number
) => {
	drag.fireTouch(el, type, { screenX, screenY: 0 });
};

describe('RecycleList fill=false', () => {
	it('uses the nearest native vertical ancestor and splits public scroll axes', async () => {
		const listRef = ref<any>();
		const data = [{ id: 1 }, { id: 2 }];
		const wrapper = mount(() => (
			<div class="outer" style="overflow-y: auto; height: 300px;">
				<div class="viewport" style="overflow-y: auto; height: 200px;">
					<div class="before" />
					<RecycleList ref={listRef} fill={false} disabled data={data} batchCount={10}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
				</div>
			</div>
		), { attachTo: document.body });
		await flush();

		const outer = wrapper.find('.outer').element as HTMLElement;
		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const inner = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
		const restore = mockVerticalGeometry(viewport, root, content);
		await listRef.value.refreshLayout();

		listRef.value.scrollTo({ x: 35, y: 180 });
		expect(viewport.scrollTop).toBe(180);
		expect(inner.scrollLeft).toBe(35);
		expect(outer.scrollTop).toBe(0);

		listRef.value.scrollTo(75);
		expect(viewport.scrollTop).toBe(75);
		expect(inner.scrollLeft).toBe(0);
		expect(root.classList.contains('is-external')).toBe(true);

		restore();
		wrapper.unmount();
	});

	it('uses Window when no scrollable ancestor exists', async () => {
		const listRef = ref<any>();
		const documentElement = document.documentElement;
		const originalScrollTop = documentElement.scrollTop;
		const restoreInnerHeight = defineGetter(window, 'innerHeight', () => 640);
		const restoreScrollHeight = defineGetter(documentElement, 'scrollHeight', () => 5000);
		documentElement.scrollTop = 0;

		const wrapper = mount(() => (
			<RecycleList ref={listRef} fill={false} disabled data={[{ id: 1 }]}>
				{{ default: ({ row }: any) => <div>{row.id}</div> }}
			</RecycleList>
		), { attachTo: document.body });
		await flush();

		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const restoreRoot = setRect(root, () => rect(300 - documentElement.scrollTop, 0, 600, 500));
		const restoreContent = setRect(content, () => rect(340 - documentElement.scrollTop, 0, 600, 420));
		await listRef.value.refreshLayout();

		listRef.value.scrollTo(260);
		expect(documentElement.scrollTop).toBe(260);

		restoreContent();
		restoreRoot();
		restoreScrollHeight();
		restoreInnerHeight();
		documentElement.scrollTop = originalScrollTop;
		wrapper.unmount();
	});

	it.each([
		['Scroller', {}],
		['Scroller wheel', { wheel: true }]
	])('reuses an outer VC %s as its main carrier', async (_label, attrs) => {
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<Scroller height={200} {...attrs}>
				<div class="before" />
				<RecycleList ref={listRef} fill={false} disabled />
			</Scroller>
		), { attachTo: document.body });
		await flush();

		const carriers = wrapper.findAll('.vc-scroller');
		const outer = carriers[0].element as HTMLElement;
		listRef.value.scrollTo(140);
		expect(outer.scrollTop).toBe(140);

		wrapper.unmount();
	});

	it('supports horizontal external scrolling and emits a combined event snapshot', async () => {
		const listRef = ref<any>();
		const onScroll = vi.fn();
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-x: auto; width: 320px;">
				<RecycleList
					ref={listRef}
					fill={false}
					vertical={false}
					disabled
					data={[{ id: 1 }]}
					onScroll={onScroll}
				>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const inner = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
		const restore = mockHorizontalGeometry(viewport, root, content);
		await listRef.value.refreshLayout();

		onScroll.mockClear();
		listRef.value.scrollTo({ x: 210, y: 27 });
		expect(viewport.scrollLeft).toBe(210);
		expect(inner.scrollTop).toBe(27);
		expect(onScroll).toHaveBeenCalledTimes(1);
		expect(onScroll.mock.calls[0][0].target.scrollLeft).toBe(210);
		expect(onScroll.mock.calls[0][0].target.scrollTop).toBe(27);

		onScroll.mockClear();
		viewport.scrollLeft = 240;
		inner.scrollTop = 19;
		viewport.dispatchEvent(new Event('scroll'));
		await nextTick();
		expect(onScroll).toHaveBeenCalledTimes(1);
		expect(onScroll.mock.calls[0][0].target.scrollLeft).toBe(240);
		expect(onScroll.mock.calls[0][0].target.scrollTop).toBe(19);
		expect(onScroll.mock.calls[0][0].target.clientWidth).toBe(320);

		restore();
		wrapper.unmount();
	});

	it('aligns initial local inverted data after its first asynchronous measurement', async () => {
		const data = ref<any[]>([]);
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<div class="before" />
				<RecycleList ref={listRef} fill={false} inverted disabled data={data.value} batchCount={10}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const restoreGeometry = mockVerticalGeometry(viewport, root, content, {
			listStart: 500,
			listSize: 400,
			contentStart: () => 540,
			contentSize: 200
		});
		const restoreItemSize = defineGetter(HTMLElement.prototype, 'offsetHeight', () => 100);

		data.value = [{ id: 1 }, { id: 2 }];
		for (let i = 0; i < 30 && listRef.value.store.states.contentMaxSize === 0; i++) {
			await sleep(20);
		}
		await flush();

		expect(listRef.value.store.states.contentMaxSize).toBe(200);
		expect(viewport.scrollTop).toBe(700);

		restoreItemSize();
		restoreGeometry();
		wrapper.unmount();
	});

	it('aligns initial horizontal inverted data to the external tail', async () => {
		const data = ref<any[]>([]);
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-x: auto; width: 320px;">
				<div class="before" />
				<RecycleList ref={listRef} fill={false} vertical={false} inverted disabled data={data.value}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const restoreGeometry = mockHorizontalGeometry(viewport, root, content, {
			listStart: 480,
			listSize: 700,
			contentStart: 520
		});
		const restoreItemSize = defineGetter(HTMLElement.prototype, 'offsetWidth', () => 100);

		data.value = [{ id: 1 }, { id: 2 }];
		for (let i = 0; i < 30 && listRef.value.store.states.contentMaxSize === 0; i++) {
			await sleep(20);
		}
		await flush();

		expect(listRef.value.store.states.contentMaxSize).toBe(200);
		expect(viewport.scrollLeft).toBe(860);

		restoreItemSize();
		restoreGeometry();
		wrapper.unmount();
	});

	it('aligns initial inverted placeholders and refreshes bounds after trimming them', async () => {
		let resolveLoad!: (value: any) => void;
		const loadData = vi.fn(() => new Promise(resolve => (resolveLoad = resolve)));
		const listRef = ref<any>();
		const restoreItemSize = defineGetter(HTMLElement.prototype, 'offsetHeight', () => 100);
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<div class="before" />
				<RecycleList ref={listRef} fill={false} inverted batchCount={2} loadData={loadData}>
					{{
						default: ({ row }: any) => <div>{row.id}</div>,
						placeholder: () => <div>loading</div>
					}}
				</RecycleList>
			</div>
		), { attachTo: document.body });

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const restoreGeometry = mockVerticalGeometry(viewport, root, content, {
			listStart: 500,
			listSize: 400,
			contentStart: () => 540,
			contentSize: 200
		});

		for (let i = 0; i < 30 && loadData.mock.calls.length === 0; i++) {
			await sleep(20);
		}
		expect(loadData).toHaveBeenCalledTimes(1);
		expect(viewport.scrollTop).toBe(700);

		resolveLoad({ data: [{ id: 1 }], finished: true });
		for (let i = 0; i < 30 && !listRef.value.store.states.isEnd; i++) {
			await sleep(20);
		}
		await flush();
		expect(listRef.value.store.states.rebuildData).toHaveLength(1);

		restoreGeometry();
		restoreItemSize();
		wrapper.unmount();
	});

	it('scrollToIndex includes contentStart, resets the cross axis, and refreshes moved headers', async () => {
		const listRef = ref<any>();
		let contentStart = 540;
		const { wrapper, viewport, root, content, inner } = await mountInViewport(listRef);
		const restore = mockVerticalGeometry(viewport, root, content, {
			contentStart: () => contentStart
		});
		await listRef.value.refreshLayout();
		listRef.value.store.states.rebuildData[1].raw.position = 160;

		inner.scrollLeft = 44;
		listRef.value.scrollToIndex(1, -10);
		expect(viewport.scrollTop).toBe(690);
		expect(inner.scrollLeft).toBe(0);

		contentStart = 720;
		await listRef.value.refreshLayout();
		listRef.value.store.states.rebuildData[1].raw.position = 160;
		listRef.value.scrollToIndex(1, 5);
		expect(viewport.scrollTop).toBe(885);

		restore();
		wrapper.unmount();
	});

	it('measures bounds in scroll coordinates when an ancestor is scaled (e.g. an opening popup)', async () => {
		const listRef = ref<any>();
		const { wrapper, viewport, root, content } = await mountInViewport(listRef);
		// 视口高 200、content 在滚动坐标 300 处；祖先 scaleY(0.5)：客户区中的距离都减半
		const restore = mockVerticalGeometry(viewport, root, content, { listStart: 300, scale: 0.5 });
		await listRef.value.refreshLayout();
		listRef.value.store.states.rebuildData[1].raw.position = 160;
		viewport.scrollTop = 0;
		listRef.value.scrollToIndex(1);
		expect(viewport.scrollTop).toBe(460);

		restore();
		wrapper.unmount();
	});

	it('scrollToIndex align nearest keeps visible items and scrolls to the nearer edge otherwise', async () => {
		const listRef = ref<any>();
		const { wrapper, viewport, root, content, inner } = await mountInViewport(listRef);
		// 视口 200，content 起点 500
		const restore = mockVerticalGeometry(viewport, root, content);
		await listRef.value.refreshLayout();
		const item = listRef.value.store.states.rebuildData[1];
		const place = (position: number, size: number) => {
			item.raw.position = position;
			item.raw.size = size;
		};
		const nearest = { align: 'nearest' };

		// 完整可见：主轴与交叉轴都不动
		place(160, 40);
		viewport.scrollTop = 550;
		inner.scrollLeft = 44;
		listRef.value.scrollToIndex(1, nearest);
		expect(viewport.scrollTop).toBe(550);
		expect(inner.scrollLeft).toBe(44);

		// 在视口下方：底边贴齐视口底边（700 - 200）
		viewport.scrollTop = 300;
		listRef.value.scrollToIndex(1, nearest);
		expect(viewport.scrollTop).toBe(500);
		expect(inner.scrollLeft).toBe(0);

		// 在视口上方：置顶
		viewport.scrollTop = 800;
		listRef.value.scrollToIndex(1, nearest);
		expect(viewport.scrollTop).toBe(660);

		// 露出一部分也算不可见
		viewport.scrollTop = 680;
		listRef.value.scrollToIndex(1, nearest);
		expect(viewport.scrollTop).toBe(660);

		// 比视口大：置顶
		place(160, 300);
		viewport.scrollTop = 300;
		listRef.value.scrollToIndex(1, nearest);
		expect(viewport.scrollTop).toBe(660);

		// offset 加在滚动目标上；start 与数字参数一致
		place(160, 40);
		viewport.scrollTop = 300;
		listRef.value.scrollToIndex(1, { align: 'nearest', offset: 8 });
		expect(viewport.scrollTop).toBe(508);
		listRef.value.scrollToIndex(1, { offset: -10 });
		expect(viewport.scrollTop).toBe(650);
		listRef.value.scrollToIndex(1, { align: 'start' });
		expect(viewport.scrollTop).toBe(660);

		restore();
		wrapper.unmount();
	});

	it('reset moves the external main carrier to absolute zero', async () => {
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<RecycleList ref={listRef} fill={false} disabled data={[{ id: 1 }]}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		viewport.scrollTop = 340;
		await listRef.value.reset();
		expect(viewport.scrollTop).toBe(0);

		wrapper.unmount();
	});

	it('loads at the list boundary instead of the external footer boundary', async () => {
		const loadData = vi.fn()
			.mockResolvedValueOnce({ data: [], finished: false })
			.mockResolvedValue(false);
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<div class="before" />
				<RecycleList ref={listRef} fill={false} threshold={50} loadData={loadData} />
				<div class="long-footer" />
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const restore = mockVerticalGeometry(viewport, root, content, {
			listStart: 500,
			listSize: 400
		});
		await listRef.value.refreshLayout();
		expect(loadData).toHaveBeenCalledTimes(1);

		viewport.scrollTop = 100;
		viewport.dispatchEvent(new Event('scroll'));
		await flush();
		expect(loadData).toHaveBeenCalledTimes(1);

		viewport.scrollTop = 660;
		viewport.dispatchEvent(new Event('scroll'));
		await flush();
		expect(loadData).toHaveBeenCalledTimes(2);

		listRef.value.store.states.isEnd = false;
		viewport.scrollTop = 1600;
		viewport.dispatchEvent(new Event('scroll'));
		await flush();
		expect(loadData).toHaveBeenCalledTimes(2);

		restore();
		wrapper.unmount();
	});

	it('uses the list start as the inverted loading edge', async () => {
		const loadData = vi.fn()
			.mockResolvedValueOnce({ data: [], finished: false })
			.mockResolvedValue(false);
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<RecycleList ref={listRef} fill={false} inverted threshold={20} loadData={loadData} />
			</div>
		), { attachTo: document.body });
		await flush();
		await sleep(20);

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const restore = mockVerticalGeometry(viewport, root, content, {
			listStart: 500,
			listSize: 400
		});
		await listRef.value.refreshLayout();
		expect(loadData).toHaveBeenCalledTimes(1);

		viewport.scrollTop = 680;
		viewport.dispatchEvent(new Event('scroll'));
		await flush();
		expect(loadData).toHaveBeenCalledTimes(1);

		viewport.scrollTop = 500;
		viewport.dispatchEvent(new Event('scroll'));
		await flush();
		expect(loadData).toHaveBeenCalledTimes(2);

		restore();
		wrapper.unmount();
	});

	it('only allows pull-to-refresh at the external carrier absolute start', async () => {
		const loadData = vi.fn()
			.mockResolvedValueOnce({ data: [], finished: false })
			.mockResolvedValue(false);
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<RecycleList fill={false} pullable pauseOffset={30} loadData={loadData} />
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element;
		viewport.scrollTop = 40;
		fireTouch(root, 'touchstart', 10);
		fireTouch(root, 'touchmove', 160);
		fireTouch(root, 'touchend', 160);
		await flush();
		expect(loadData).toHaveBeenCalledTimes(1);

		viewport.scrollTop = 0;
		fireTouch(root, 'touchstart', 10);
		fireTouch(root, 'touchmove', 160);
		fireTouch(root, 'touchend', 160);
		await flush();
		expect(loadData).toHaveBeenCalledTimes(2);

		wrapper.unmount();
	});

	it('only allows inverted pull-up at the external carrier absolute end', async () => {
		const loadData = vi.fn()
			.mockResolvedValueOnce({ data: [], finished: false })
			.mockResolvedValue(false);
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<RecycleList fill={false} inverted pullable pauseOffset={30} loadData={loadData} />
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element;
		const restores = [
			defineGetter(viewport, 'scrollHeight', () => 1000),
			defineGetter(viewport, 'clientHeight', () => 200)
		];

		// 承载者未到绝对末端（例如还有后置内容没滚完）：拖动是普通滚动
		viewport.scrollTop = 40;
		fireTouch(root, 'touchstart', 160);
		fireTouch(root, 'touchmove', 10);
		fireTouch(root, 'touchend', 10);
		await flush();
		expect(loadData).toHaveBeenCalledTimes(1);

		viewport.scrollTop = 800;
		fireTouch(root, 'touchstart', 160);
		fireTouch(root, 'touchmove', 10);
		fireTouch(root, 'touchend', 10);
		await flush();
		expect(loadData).toHaveBeenCalledTimes(2);

		restores.forEach(fn => fn());
		wrapper.unmount();
	});

	it('keeps horizontal pull-to-refresh on the external absolute start', async () => {
		const loadData = vi.fn()
			.mockResolvedValueOnce({ data: [], finished: false })
			.mockResolvedValue(false);
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-x: auto; width: 320px;">
				<RecycleList fill={false} vertical={false} pullable pauseOffset={30} loadData={loadData} />
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element;
		viewport.scrollLeft = 40;
		fireHorizontalTouch(root, 'touchstart', 10);
		fireHorizontalTouch(root, 'touchmove', 160);
		fireHorizontalTouch(root, 'touchend', 160);
		await flush();
		expect(loadData).toHaveBeenCalledTimes(1);

		viewport.scrollLeft = 0;
		fireHorizontalTouch(root, 'touchstart', 10);
		fireHorizontalTouch(root, 'touchmove', 160);
		fireHorizontalTouch(root, 'touchend', 160);
		await flush();
		expect(loadData).toHaveBeenCalledTimes(2);

		wrapper.unmount();
	});

	it('rebinds on fill changes and removes the external listener on unmount', async () => {
		const fill = ref(false);
		const listRef = ref<any>();
		const onScroll = vi.fn();
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<RecycleList ref={listRef} fill={fill.value} disabled onScroll={onScroll} />
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		onScroll.mockClear();
		viewport.dispatchEvent(new Event('scroll'));
		await nextTick();
		expect(onScroll).toHaveBeenCalledTimes(1);

		fill.value = true;
		await flush();
		onScroll.mockClear();
		viewport.dispatchEvent(new Event('scroll'));
		await nextTick();
		expect(onScroll).not.toHaveBeenCalled();

		listRef.value.scrollTo(30);
		expect(onScroll).toHaveBeenCalledTimes(1);

		fill.value = false;
		await flush();
		onScroll.mockClear();
		wrapper.unmount();
		viewport.dispatchEvent(new Event('scroll'));
		await nextTick();
		expect(onScroll).not.toHaveBeenCalled();
	});

	it('does not bind a pending external viewport after unmount', async () => {
		const fill = ref(true);
		const onScroll = vi.fn();
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<RecycleList fill={fill.value} disabled onScroll={onScroll} />
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		fill.value = false;
		await nextTick();
		wrapper.unmount();
		await flush();

		onScroll.mockClear();
		viewport.dispatchEvent(new Event('scroll'));
		await nextTick();
		expect(onScroll).not.toHaveBeenCalled();
	});

	it('keeps main-axis expansion ahead of scrollerOptions and preserves horizontal cross height', async () => {
		const vertical = mount(() => (
			<div style="overflow-y: auto; height: 200px;">
				<RecycleList
					fill={false}
					disabled
					scrollerOptions={{ height: 300, maxHeight: 400 } as any}
				/>
			</div>
		), { attachTo: document.body });
		const horizontal = mount(() => (
			<div style="overflow-x: auto; width: 300px;">
				<RecycleList
					fill={false}
					vertical={false}
					disabled
					scrollerOptions={{ height: 180 } as any}
				/>
			</div>
		), { attachTo: document.body });
		await flush();

		const verticalStyle = vertical.find('.vc-recycle-list__wrapper').attributes('style') || '';
		const horizontalStyle = horizontal.find('.vc-recycle-list__wrapper').attributes('style') || '';
		expect(verticalStyle).toContain('height: auto');
		expect(verticalStyle).toContain('max-height: none');
		expect(verticalStyle).not.toContain('300px');
		expect(horizontalStyle).toContain('height: 180px');
		expect(horizontalStyle).toContain('width: max-content');

		vertical.unmount();
		horizontal.unmount();
	});

	it('does not recurse when shared external leaves use the same carrier', async () => {
		const store = new RecycleListStore({});
		const onScroll = vi.fn();
		const data: any[] = [];
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<RecycleList fill={false} store={store} data={data} disabled onScroll={onScroll} />
				<RecycleList fill={false} store={store} data={data} disabled />
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		onScroll.mockClear();
		viewport.scrollTop = 80;
		expect(() => viewport.dispatchEvent(new Event('scroll'))).not.toThrow();
		await nextTick();
		expect(onScroll).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('mirrors coordinates between mixed external and internal shared Store leaves', async () => {
		const store = new RecycleListStore({});
		const externalRef = ref<any>();
		const internalRef = ref<any>();
		const data: any[] = [];
		const wrapper = mount(() => (
			<div>
				<div class="viewport" style="overflow-y: auto; height: 200px;">
					<RecycleList ref={externalRef} fill={false} store={store} data={data} disabled />
				</div>
				<div style="height: 200px;">
					<RecycleList ref={internalRef} class="internal-list" store={store} data={data} disabled />
				</div>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const internal = wrapper.find('.internal-list .vc-recycle-list__wrapper').element as HTMLElement;
		viewport.scrollTop = 80;
		viewport.dispatchEvent(new Event('scroll'));
		await nextTick();
		expect(internal.scrollTop).toBe(80);

		if ('ontouchend' in document) {
			fireTouch(internal, 'touchstart', 0);
		} else {
			internal.dispatchEvent(new Event('mouseenter'));
		}
		internalRef.value.scrollTo({ x: 0, y: 125 });
		expect(viewport.scrollTop).toBe(125);

		wrapper.unmount();
	});

	it('gates the tail slot on isEnd rather than on fill', async () => {
		let resolveFn: (v: any) => void = () => {};
		const loadData = () => new Promise((resolve) => { resolveFn = resolve; });

		const wrapper = mount(() => (
			<RecycleList fill={false} lazyTail loadData={loadData as any}>
				{{
					header: () => <div class="my-header">HEADER</div>,
					footer: () => <div class="my-footer">FOOTER</div>
				}}
			</RecycleList>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.my-footer').exists()).toBe(false);
		expect(wrapper.find('.my-header').exists()).toBe(true);

		resolveFn(false);
		await flush();

		expect(wrapper.find('.my-footer').exists()).toBe(true);
		wrapper.unmount();
	});

	it('does not compensate again for the scroll written by its own displacement (outer VC Scroller notifies synchronously)', async () => {
		const listRef = ref<any>();
		const data = Array.from({ length: 200 }, (_, i) => ({ id: i }));
		const wrapper = mount(() => (
			<Scroller height={200}>
				<RecycleList ref={listRef} fill={false} disabled data={data} estimateSize={20}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			</Scroller>
		), { attachTo: document.body });
		await flush();

		// jsdom 中元素的位置都为 0：列表起点随滚动位置一起变，看起来就像被前置内容推走了。
		// 平移写入的滚动经 VC Scroller 同步通知、重新测量，这期间不再按新的测量平移，否则会一直平移下去
		const outer = wrapper.findAll('.vc-scroller')[0].element as HTMLElement;
		expect(() => listRef.value.scrollToIndex(50)).not.toThrow();
		expect(Number.isFinite(outer.scrollTop)).toBe(true);
		wrapper.unmount();
	});

	it('does not re-measure every node when only the external carrier resizes', async () => {
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<RecycleList ref={listRef} fill={false} disabled data={[{ id: 1 }, { id: 2 }]} batchCount={10}>
				{{ default: ({ row }: any) => <div>{row.id}</div> }}
			</RecycleList>
		), { attachTo: document.body });
		await flush();

		// 节点尺寸只取决于列表自身的交叉轴，承载者（这里是 Window）尺寸变化由列表 wrapper 的观察负责
		const build = vi.spyOn(listRef.value.store.nodes, 'build');
		window.dispatchEvent(new Event('resize'));
		await sleep(80);
		await flush();

		expect(build).not.toHaveBeenCalled();
		wrapper.unmount();
	});
});

// 列表之前的内容变高 / 变矮会把列表整体推走，列表与承载者的尺寸都不变
describe('RecycleList fill=false: content before the list changes', () => {
	const ITEM_SIZE = 40;
	// 前置内容的增量，折合 6 行
	const SHIFT = 240;

	// 50 行 × 40px，视口 200px；列表起点可变，用来模拟前置内容的伸缩（列表根与 content 一起平移）；
	// headerSize 只移动 content，模拟列表自己的 header 变化
	// overscan 固定为 50，可见范围的换算不受默认值影响
	const setup = async () => {
		const listRef = ref<any>();
		const geometry = { listStart: 500, headerSize: 0 };
		const data = Array.from({ length: 50 }, (_, id) => ({ id }));
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<div class="page">
					<div class="before" />
					<RecycleList ref={listRef} fill={false} disabled data={data} estimateSize={ITEM_SIZE} overscan={50}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
				</div>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const restore = mockVerticalGeometry(
			viewport,
			wrapper.find('.vc-recycle-list').element as HTMLElement,
			wrapper.find('.vc-recycle-list__content').element as HTMLElement,
			{
				listSize: 2000,
				listStart: () => geometry.listStart,
				contentStart: () => geometry.listStart + geometry.headerSize
			}
		);
		await listRef.value.refreshViewport();

		const page = wrapper.find('.page').element;
		const scroll = async (value: number) => {
			viewport.scrollTop = value;
			viewport.dispatchEvent(new Event('scroll'));
			await flush();
		};
		// 列表之前的内容伸缩：祖先尺寸变化的回调随之而来
		const resizePage = async () => {
			observerOf(page).trigger(page);
			await flush();
		};
		const range = () => {
			const { firstItemIndex, lastItemIndex } = listRef.value.store.states;
			return [firstItemIndex, lastItemIndex];
		};
		return {
			wrapper,
			viewport,
			page,
			geometry,
			scroll,
			resizePage,
			range,
			destroy: () => {
				restore();
				wrapper.unmount();
			}
		};
	};

	it('keeps the list in place when content before it changes while the viewport is inside the list', async () => {
		const { wrapper, viewport, page, geometry, scroll, resizePage, range, destroy } = await setup();
		await scroll(900);
		const visible = range();
		expect(visible[0]).toBeGreaterThan(0);

		// 列表到承载者之间的祖先被观察；列表根自身不算
		expect(observerOf(page)).toBeTruthy();
		expect(observerOf(wrapper.find('.vc-recycle-list').element)).toBeUndefined();

		// 前置内容变高：滚动位置同步平移，视口里还是同样的行（与浏览器的滚动锚定一致）
		geometry.listStart += SHIFT;
		await resizePage();
		expect(viewport.scrollTop).toBe(900 + SHIFT);
		expect(range()).toEqual(visible);

		// 变回去；承载者自身的尺寸变化同样会重新测量
		geometry.listStart -= SHIFT;
		observerOf(viewport).trigger(viewport);
		await flush();
		expect(viewport.scrollTop).toBe(900);
		expect(range()).toEqual(visible);

		destroy();
		expect(observerOf(page)).toBeUndefined();
	});

	it('catches the shift when a scroll measures it before the resize callback', async () => {
		const { viewport, geometry, scroll, range, destroy } = await setup();
		await scroll(900);
		const visible = range();

		// 平移后先到的是滚动事件：同样按平移量补偿
		geometry.listStart += SHIFT;
		await scroll(900);
		expect(viewport.scrollTop).toBe(900 + SHIFT);
		expect(range()).toEqual(visible);
		destroy();
	});

	it('carries sub-pixel shifts over instead of dropping or jittering them', async () => {
		const { viewport, geometry, scroll, resizePage, destroy } = await setup();
		await scroll(900);
		// 与浏览器一样，写入的滚动位置被取整
		const writes = vi.fn();
		let current = 900;
		Object.defineProperty(viewport, 'scrollTop', {
			configurable: true,
			get: () => current,
			set: (v) => {
				writes(v);
				current = Math.round(v);
			}
		});

		// 来回的亚像素抖动：不写滚动位置
		geometry.listStart += 0.4;
		await resizePage();
		geometry.listStart -= 0.4;
		await resizePage();
		expect(writes).not.toHaveBeenCalled();

		// 连续的小平移（如展开动画）：零头累计到 1px 再写，写入后的取整误差留到下一次
		for (let i = 0; i < 10; i++) {
			geometry.listStart += 13.7;
			await resizePage();
		}
		expect(current).toBe(900 + 137);

		delete (viewport as any).scrollTop;
		destroy();
	});

	it('lets the list move when the viewport starts before it', async () => {
		const { viewport, geometry, scroll, resizePage, range, destroy } = await setup();
		// 同样的视口与列表相对位置：视口起点比列表起点晚 140px
		await scroll(640);
		const expected = range();

		// 视口 [400, 600) 起点在列表（500 起）之前：不跟随列表平移，列表收起 240px 后视口落进列表
		await scroll(400);
		geometry.listStart -= SHIFT;
		await resizePage();
		expect(viewport.scrollTop).toBe(400);
		expect(range()).toEqual(expected);
		destroy();
	});

	it('follows a header change inside the list without scrolling', async () => {
		const { viewport, geometry, scroll, resizePage, range, destroy } = await setup();
		await scroll(900);
		const [first, last] = range();

		// 列表自己的 header 变高：列表根不动，只有 content 下移，同样的滚动位置对应更靠前的行
		geometry.headerSize += SHIFT;
		await resizePage();
		expect(viewport.scrollTop).toBe(900);
		expect(range()).toEqual([first - SHIFT / ITEM_SIZE, last - SHIFT / ITEM_SIZE]);

		// 滚动时同样按新位置重算
		geometry.headerSize -= SHIFT;
		await scroll(900);
		expect(range()).toEqual([first, last]);
		destroy();
	});

	it('only moves a shared carrier once for the list the viewport is in', async () => {
		const data = Array.from({ length: 50 }, (_, id) => ({ id }));
		const geometry = { shift: 0 };
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<div class="page">
					<RecycleList class="first" fill={false} disabled data={data} estimateSize={ITEM_SIZE}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
					<RecycleList class="second" fill={false} disabled data={data} estimateSize={ITEM_SIZE}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
				</div>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const geometryOf = (selector: string, start: number) => mockVerticalGeometry(
			viewport,
			wrapper.find(`${selector}`).element as HTMLElement,
			wrapper.find(`${selector} .vc-recycle-list__content`).element as HTMLElement,
			{ listSize: 2000, listStart: () => start + geometry.shift }
		);
		const restores = [geometryOf('.first', 500), geometryOf('.second', 2600)];
		viewport.scrollTop = 3000;
		viewport.dispatchEvent(new Event('scroll'));
		await flush();

		// 两个列表都被前置内容推走 240px；视口在第二个列表里，滚动位置只平移一次
		// 共用模式下每个列表各有一个观察器，祖先变化时都会回调
		geometry.shift = SHIFT;
		const page = wrapper.find('.page').element;
		const pageObservers = observers.filter(ro => ro.targets.has(page));
		expect(pageObservers.length).toBe(2);
		pageObservers.forEach(ro => ro.trigger(page));
		await flush();
		expect(viewport.scrollTop).toBe(3000 + SHIFT);

		// 两个回调的先后不影响结果
		geometry.shift = 0;
		pageObservers.reverse().forEach(ro => ro.trigger(page));
		await flush();
		expect(viewport.scrollTop).toBe(3000);

		restores.reverse().forEach(restore => restore());
		wrapper.unmount();
	});

	it('stays at the end of an inverted list when content before it collapses right after the alignment', async () => {
		const data = ref<any[]>([]);
		const listRef = ref<any>();
		const geometry = { listStart: 800 };
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<div class="page">
					<div class="before" />
					<RecycleList ref={listRef} fill={false} inverted disabled data={data.value} estimateSize={ITEM_SIZE}>
						{{ default: ({ row }: any) => <div>{row.id}</div> }}
					</RecycleList>
				</div>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const restore = mockVerticalGeometry(
			viewport,
			wrapper.find('.vc-recycle-list').element as HTMLElement,
			wrapper.find('.vc-recycle-list__content').element as HTMLElement,
			{ listSize: 400, listStart: () => geometry.listStart }
		);

		data.value = Array.from({ length: 10 }, (_, id) => ({ id }));
		for (let i = 0; i < 30 && viewport.scrollTop === 0; i++) {
			await sleep(5);
		}
		// 贴到列表末端：800 + 400 - 200
		expect(viewport.scrollTop).toBe(1000);

		// 贴底后紧接着（仍在屏蔽滚动事件的那一帧里）前置内容收起 300px：视口随列表回到末端，不越过末端
		geometry.listStart -= 300;
		const page = wrapper.find('.page').element;
		observerOf(page).trigger(page);
		await flush();
		expect(viewport.scrollTop).toBe(700);

		restore();
		wrapper.unmount();
	});

	it('observes every ancestor up to the document root when Window carries the scroll', async () => {
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<div class="page">
				<RecycleList ref={listRef} fill={false} disabled data={[{ id: 1 }]} estimateSize={ITEM_SIZE}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			</div>
		), { attachTo: document.body });
		await flush();

		const ancestors = [wrapper.find('.page').element, document.body, document.documentElement];
		expect(ancestors.every(observerOf)).toBe(true);
		expect(observerOf(wrapper.find('.vc-recycle-list').element)).toBeUndefined();

		// 各层共用一个观察器：多层同时变化由一次回调带回，只重算一次
		expect(new Set(ancestors.map(observerOf)).size).toBe(1);
		const update = vi.spyOn(listRef.value.store.position, 'updateVisibleRange');
		observerOf(ancestors[0]).cb(ancestors.map(target => ({ target })));
		expect(update).toHaveBeenCalledTimes(1);

		wrapper.unmount();
		expect(ancestors.some(observerOf)).toBe(false);
	});

	it('stops observing the ancestors when switching back to fill', async () => {
		const fill = ref(false);
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<div class="page">
					<RecycleList fill={fill.value} disabled />
				</div>
			</div>
		), { attachTo: document.body });
		await flush();

		const page = wrapper.find('.page').element;
		expect(observerOf(page)).toBeTruthy();

		fill.value = true;
		await flush();
		expect(observerOf(page)).toBeUndefined();

		// 切回外部滚动后重新观察
		fill.value = false;
		await flush();
		expect(observerOf(page)).toBeTruthy();
		wrapper.unmount();
		expect(observerOf(page)).toBeUndefined();
	});
});
