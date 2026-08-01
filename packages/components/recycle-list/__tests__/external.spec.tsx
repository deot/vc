// @vitest-environment jsdom

import { RecycleList, RecycleListStore, Scroller, ScrollerWheel } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (time = 0) => new Promise(resolve => setTimeout(resolve, time));

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
		listStart?: number;
		listSize?: number;
		contentStart?: () => number;
		contentSize?: number;
	} = {}
) => {
	const {
		clientSize = 200,
		listStart = 500,
		listSize = 400,
		contentStart = () => listStart,
		contentSize = listSize
	} = options;
	const restores = [
		defineGetter(viewport, 'clientHeight', () => clientSize),
		defineGetter(viewport, 'scrollHeight', () => 4000),
		setRect(viewport, () => rect(100, 0, 600, clientSize)),
		setRect(root, () => rect(100 + listStart - viewport.scrollTop, 0, 600, listSize)),
		setRect(content, () => rect(100 + contentStart() - viewport.scrollTop, 0, 600, contentSize))
	];
	return () => restores.forEach(restore => restore());
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
	const event = new Event(type, { bubbles: true, cancelable: true }) as any;
	event.touches = type === 'touchend' ? [] : [{ screenX: 0, screenY }];
	event.targetTouches = type === 'touchend' ? [] : [{ screenX: 0, screenY }];
	el.dispatchEvent(event);
};

const fireHorizontalTouch = (
	el: Element,
	type: 'touchstart' | 'touchmove' | 'touchend',
	screenX: number
) => {
	const event = new Event(type, { bubbles: true, cancelable: true }) as any;
	event.touches = type === 'touchend' ? [] : [{ screenX, screenY: 0 }];
	event.targetTouches = type === 'touchend' ? [] : [{ screenX, screenY: 0 }];
	el.dispatchEvent(event);
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
		['Scroller', Scroller],
		['ScrollerWheel', ScrollerWheel]
	])('reuses an outer VC %s as its main carrier', async (_label, Carrier: any) => {
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<Carrier height={200}>
				<div class="before" />
				<RecycleList ref={listRef} fill={false} disabled />
			</Carrier>
		), { attachTo: document.body });
		await flush();

		const carriers = wrapper.findAll('.vc-scroller__wrapper');
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
		const wrapper = mount(() => (
			<div class="viewport" style="overflow-y: auto; height: 200px;">
				<div class="before" />
				<RecycleList ref={listRef} fill={false} disabled data={[{ id: 1 }, { id: 2 }]} batchCount={10}>
					{{ default: ({ row }: any) => <div>{row.id}</div> }}
				</RecycleList>
			</div>
		), { attachTo: document.body });
		await flush();

		const viewport = wrapper.find('.viewport').element as HTMLElement;
		const root = wrapper.find('.vc-recycle-list').element as HTMLElement;
		const content = wrapper.find('.vc-recycle-list__content').element as HTMLElement;
		const inner = wrapper.find('.vc-recycle-list__wrapper').element as HTMLElement;
		const restore = mockVerticalGeometry(viewport, root, content, {
			contentStart: () => contentStart
		});
		await listRef.value.refreshLayout();
		listRef.value.store.states.rebuildData[1].states.position = 160;

		inner.scrollLeft = 44;
		listRef.value.scrollToIndex(1, -10);
		expect(viewport.scrollTop).toBe(690);
		expect(inner.scrollLeft).toBe(0);

		contentStart = 720;
		await listRef.value.refreshLayout();
		listRef.value.store.states.rebuildData[1].states.position = 160;
		listRef.value.scrollToIndex(1, 5);
		expect(viewport.scrollTop).toBe(885);

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
});
