// @vitest-environment jsdom

import { Intersection, MIntersection } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

class MockObserver {
	static instances: MockObserver[] = [];

	callback: IntersectionObserverCallback;
	options: IntersectionObserverInit;
	targets = new Set<Element>();
	disconnected = false;

	constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
		this.callback = callback;
		this.options = options;
		MockObserver.instances.push(this);
	}

	observe(el: Element) {
		this.targets.add(el);
	}

	unobserve(el: Element) {
		this.targets.delete(el);
	}

	disconnect() {
		this.targets.clear();
		this.disconnected = true;
	}

	trigger(el: Element, isIntersecting: boolean, intersectionRatio = isIntersecting ? 1 : 0) {
		if (!this.targets.has(el)) return;
		this.callback([{ target: el, isIntersecting, intersectionRatio } as any], this as any);
	}
}

const active = () => MockObserver.instances.filter(i => !i.disconnected);
const observerOf = (el: Element) => active().find(i => i.targets.has(el));
const trigger = (el: Element, isIntersecting: boolean, ratio?: number) => observerOf(el)?.trigger(el, isIntersecting, ratio);

beforeEach(() => {
	MockObserver.instances = [];
	vi.stubGlobal('IntersectionObserver', MockObserver);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Intersection).toBe('object');
		expect(typeof MIntersection).toBe('object');
	});

	it('渲染 tag 与标记类', () => {
		const wrapper = mount(() => (<Intersection tag="section" />));
		expect(wrapper.element.tagName).toBe('SECTION');
		expect(wrapper.classes()).toContain('vc-intersection');
		wrapper.unmount();

		const mobile = mount(() => (<MIntersection />));
		expect(mobile.classes()).toEqual(['vc-intersection', 'vcm-intersection']);
		mobile.unmount();
	});

	it('可见状态变化：v-model、change、插槽', async () => {
		const visible = ref(false);
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Intersection v-model={visible.value} onChange={onChange}>
				{{ default: ({ visible: v }) => (v ? 'in' : 'out') }}
			</Intersection>
		), { attachTo: document.body });
		const el = wrapper.element;

		expect(wrapper.text()).toBe('out');
		// 初始不可见不发出
		trigger(el, false);
		expect(onChange).not.toHaveBeenCalled();

		trigger(el, true, 0.8);
		await nextTick();
		expect(visible.value).toBe(true);
		expect(wrapper.text()).toBe('in');
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange.mock.calls[0][0]).toMatchObject({ visible: true, ratio: 0.8 });
		expect(onChange.mock.calls[0][0].entry.target).toBe(el);

		// 状态不变不重复发出
		trigger(el, true, 0.9);
		expect(onChange).toHaveBeenCalledTimes(1);

		trigger(el, false);
		await nextTick();
		expect(visible.value).toBe(false);
		expect(onChange).toHaveBeenCalledTimes(2);
		wrapper.unmount();
	});

	it('参照最近的滚动容器：原生 overflow、vc Scroller 类名、window', () => {
		const wrapper = mount(() => (
			<div>
				<div style="overflow: auto;" class="native">
					<Intersection class="a" />
				</div>
				<div class="vc-scroller">
					<Intersection class="b" />
				</div>
				<Intersection class="c" />
				{/* 自身是滚动容器时参照外层 */}
				<Intersection class="d" style="overflow: auto;" />
			</div>
		), { attachTo: document.body });

		expect(observerOf(wrapper.find('.a').element)!.options.root).toBe(wrapper.find('.native').element);
		expect(observerOf(wrapper.find('.b').element)!.options.root).toBe(wrapper.find('.vc-scroller').element);
		expect(observerOf(wrapper.find('.c').element)!.options.root).toBe(null);
		expect(observerOf(wrapper.find('.d').element)!.options.root).toBe(null);
		wrapper.unmount();
	});

	it('同一容器、同一参数共用一个 IntersectionObserver，最后一个卸载时断开', async () => {
		const length = ref(3);
		const wrapper = mount(() => (
			<div>
				{Array.from({ length: length.value }, (_, i) => (<Intersection key={i} />))}
				<Intersection threshold={0.5} />
			</div>
		), { attachTo: document.body });

		expect(active().length).toBe(2);
		const shared = observerOf(wrapper.findAll('.vc-intersection')[0].element)!;
		expect(shared.targets.size).toBe(3);

		length.value = 0;
		await nextTick();
		expect(shared.disconnected).toBe(true);
		expect(active().length).toBe(1);
		wrapper.unmount();
		expect(active().length).toBe(0);
	});

	it('threshold：露出比例未达到时不可见，越界时收进 [0, 1]', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (<Intersection threshold={0.5} onChange={onChange} />), { attachTo: document.body });
		const el = wrapper.element;
		expect(observerOf(el)!.options.threshold).toBe(0.5);

		trigger(el, true, 0.2);
		expect(onChange).not.toHaveBeenCalled();
		trigger(el, true, 0.5);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ visible: true }));
		trigger(el, true, 0.3);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ visible: false }));
		wrapper.unmount();

		const over = mount(() => (<Intersection threshold={2} />), { attachTo: document.body });
		expect(observerOf(over.element)!.options.threshold).toBe(1);
		over.unmount();
	});

	it('offset → rootMargin：桌面 px、移动端 750 稿、字符串原样、变化后重新监听', async () => {
		const offset = ref<any>(10);
		const wrapper = mount(() => (<Intersection offset={offset.value} />), { attachTo: document.body });
		const el = wrapper.element;
		expect(observerOf(el)!.options.rootMargin).toBe('10px');

		offset.value = [10, '5%'];
		await nextTick();
		expect(observerOf(el)!.options.rootMargin).toBe('10px 5%');

		offset.value = [1, 2, 3, 4, 5];
		await nextTick();
		expect(observerOf(el)!.options.rootMargin).toBe('1px 2px 3px 4px');
		wrapper.unmount();

		// jsdom 中量不到探针宽度，--vc-rem 为初始值 0.5（375 宽）
		const mobile = mount(() => (<MIntersection offset={[200, '10px']} />), { attachTo: document.body });
		expect(observerOf(mobile.element)!.options.rootMargin).toBe('100px 10px');
		mobile.unmount();
	});

	it('once：首次可见后停止监听', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (<Intersection once onChange={onChange} />), { attachTo: document.body });
		const el = wrapper.element;

		trigger(el, true);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(observerOf(el)).toBeUndefined();
		wrapper.unmount();
	});

	it('disabled：暂停监听，恢复后重新监听', async () => {
		const disabled = ref(true);
		const wrapper = mount(() => (<Intersection disabled={disabled.value} />), { attachTo: document.body });
		const el = wrapper.element;
		expect(observerOf(el)).toBeUndefined();

		disabled.value = false;
		await nextTick();
		expect(observerOf(el)).toBeDefined();

		disabled.value = true;
		await nextTick();
		expect(observerOf(el)).toBeUndefined();
		wrapper.unmount();
	});

	it('refresh：当作不可见重新判断，可见时再发出 change；once 后重新开始', async () => {
		const target = ref();
		const onChange = vi.fn();
		const wrapper = mount(() => (<Intersection ref={target} once onChange={onChange} />), { attachTo: document.body });
		const el = wrapper.element;

		trigger(el, true);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(target.value.visible).toBe(true);
		expect(observerOf(el)).toBeUndefined();

		target.value.refresh();
		trigger(el, true);
		expect(onChange).toHaveBeenCalledTimes(2);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ visible: true }));
		wrapper.unmount();
	});

	it('不支持 IntersectionObserver 时直接视为可见', async () => {
		vi.stubGlobal('IntersectionObserver', undefined);
		const onChange = vi.fn();
		const wrapper = mount(() => (<Intersection onChange={onChange} />), { attachTo: document.body });

		expect(onChange).toHaveBeenCalledWith({ visible: true, ratio: 1, entry: null });
		wrapper.unmount();
	});
});
