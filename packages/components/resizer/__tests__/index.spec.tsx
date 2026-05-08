// @vitest-environment jsdom

import { Resizer, MResizer } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (time = 0) => new Promise(resolve => setTimeout(resolve, time));

const setRect = (el: Element, width: number, height: number) => {
	(el as any).getBoundingClientRect = () => ({
		width,
		height,
		top: 0,
		left: 0,
		right: width,
		bottom: height,
		x: 0,
		y: 0,
		toJSON: () => ({})
	});
};

// helper-resize 在 el 上挂载了 __rz__；手动调用其 handleResize 等价于
// 真实 ResizeObserver 触发后的回调链（与 recycle-list 测试一致）
const triggerResize = (el: Element) => {
	const rz = (el as any).__rz__;
	rz?.handleResize?.([{ target: el }]);
};

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Resizer).toBe('object');
	});

	it('MResizer 与 Resizer 是同一个组件', () => {
		expect(MResizer).toBe(Resizer);
	});

	it('create', () => {
		const wrapper = mount(() => (<Resizer />));

		expect(wrapper.classes()).toContain('vc-resizer');
		wrapper.unmount();
	});

	it('默认渲染为 div, fill=true 时同时拥有 is-fill-width / is-fill-height', () => {
		const wrapper = mount(() => (<Resizer />));

		expect(wrapper.element.tagName).toBe('DIV');
		expect(wrapper.classes()).toContain('is-fill-width');
		expect(wrapper.classes()).toContain('is-fill-height');
		wrapper.unmount();
	});

	it('支持自定义 tag', () => {
		const wrapper = mount(() => (<Resizer tag="section" />));

		expect(wrapper.element.tagName).toBe('SECTION');
		wrapper.unmount();
	});

	it('fill=false 时不带 fill 类', () => {
		const wrapper = mount(() => (<Resizer fill={false} />));

		expect(wrapper.classes()).not.toContain('is-fill-width');
		expect(wrapper.classes()).not.toContain('is-fill-height');
		wrapper.unmount();
	});

	it('fill 数组形式可独立控制宽高', () => {
		const w1 = mount(() => (<Resizer fill={[true, false]} />));
		expect(w1.classes()).toContain('is-fill-width');
		expect(w1.classes()).not.toContain('is-fill-height');
		w1.unmount();

		const w2 = mount(() => (<Resizer fill={[false, true]} />));
		expect(w2.classes()).not.toContain('is-fill-width');
		expect(w2.classes()).toContain('is-fill-height');
		w2.unmount();
	});

	it('默认插槽 binds 同步包含 width / height / style', async () => {
		const wrapper = mount(() => (
			<Resizer>
				{{
					default: ({ width, height, style }: any) => (
						<div class="slot" data-style={style}>{`${width}x${height}`}</div>
					)
				}}
			</Resizer>
		), { attachTo: document.body });

		await nextTick();
		// 还未触发 resize 时, width / height 均为 0
		const slot = wrapper.find('.slot');
		expect(slot.exists()).toBe(true);
		expect(slot.text()).toBe('0x0');
		expect(slot.attributes('data-style')).toBe('height: 0px; width: 0px');
		wrapper.unmount();
	});

	it('尺寸变化时触发 resize, inited 由 false → true', async () => {
		const onResize = vi.fn();
		const wrapper = mount(() => (
			<Resizer onResize={onResize} />
		), { attachTo: document.body });

		await nextTick();

		setRect(wrapper.element, 200, 100);
		triggerResize(wrapper.element);
		await nextTick();

		expect(onResize).toHaveBeenCalledTimes(1);
		expect(onResize).toHaveBeenLastCalledWith({
			width: 200,
			height: 100,
			style: 'height: 100px; width: 200px',
			inited: false
		});

		// 第二次尺寸变化, inited 应为 true
		setRect(wrapper.element, 240, 120);
		triggerResize(wrapper.element);
		await nextTick();

		expect(onResize).toHaveBeenCalledTimes(2);
		expect(onResize).toHaveBeenLastCalledWith({
			width: 240,
			height: 120,
			style: 'height: 120px; width: 240px',
			inited: true
		});
		wrapper.unmount();
	});

	it('尺寸未变化不再触发 resize', async () => {
		const onResize = vi.fn();
		const wrapper = mount(() => (
			<Resizer onResize={onResize} />
		), { attachTo: document.body });

		await nextTick();

		setRect(wrapper.element, 100, 50);
		triggerResize(wrapper.element);
		triggerResize(wrapper.element);
		triggerResize(wrapper.element);
		await nextTick();

		expect(onResize).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('计算尺寸时会减去 padding (与 examples 中 padding: 40px 用法一致)', async () => {
		const onResize = vi.fn();
		const wrapper = mount(() => (
			<Resizer style="padding: 10px 20px 30px 40px;" onResize={onResize} />
		), { attachTo: document.body });

		await nextTick();
		// 边界 200x150 - (left 40 + right 20) = 140 width, - (top 10 + bottom 30) = 110 height
		setRect(wrapper.element, 200, 150);
		triggerResize(wrapper.element);
		await nextTick();

		expect(onResize).toHaveBeenCalledWith({
			width: 140,
			height: 110,
			style: 'height: 110px; width: 140px',
			inited: false
		});
		wrapper.unmount();
	});

	it('插槽内部能拿到最新的 width / height / style', async () => {
		const wrapper = mount(() => (
			<Resizer>
				{{
					default: ({ width, height, style }: any) => (
						<div class="slot" data-style={style}>{`${width}x${height}`}</div>
					)
				}}
			</Resizer>
		), { attachTo: document.body });

		await nextTick();

		setRect(wrapper.element, 320, 180);
		triggerResize(wrapper.element);
		await nextTick();

		const slot = wrapper.find('.slot');
		expect(slot.text()).toBe('320x180');
		expect(slot.attributes('data-style')).toBe('height: 180px; width: 320px');
		wrapper.unmount();
	});

	it('暴露 refresh / offsetWidth / offsetHeight', async () => {
		const resizerRef = ref<any>();
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Resizer ref={resizerRef} />);
			}
		}), { attachTo: document.body });

		await nextTick();

		expect(typeof resizerRef.value.refresh).toBe('function');
		expect(resizerRef.value.offsetWidth).toBe(0);
		expect(resizerRef.value.offsetHeight).toBe(0);

		setRect(wrapper.element, 220, 110);
		resizerRef.value.refresh();
		await nextTick();

		expect(resizerRef.value.offsetWidth).toBe(220);
		expect(resizerRef.value.offsetHeight).toBe(110);
		wrapper.unmount();
	});

	it('refresh 后会节流锁定 ~20ms, 锁内的 trigger 被忽略, 解锁后恢复', async () => {
		const onResize = vi.fn();
		const resizerRef = ref<any>();
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Resizer ref={resizerRef} onResize={onResize} />);
			}
		}), { attachTo: document.body });

		await nextTick();

		setRect(wrapper.element, 200, 100);
		resizerRef.value.refresh();
		await nextTick();

		expect(onResize).toHaveBeenCalledTimes(1);

		// 锁定阶段: 连续 trigger 不再生效
		setRect(wrapper.element, 300, 150);
		triggerResize(wrapper.element);
		triggerResize(wrapper.element);
		await nextTick();
		expect(onResize).toHaveBeenCalledTimes(1);

		// 解锁后再触发, 重新计算并 emit
		await sleep(40);
		triggerResize(wrapper.element);
		await nextTick();
		expect(onResize).toHaveBeenCalledTimes(2);
		expect(resizerRef.value.offsetWidth).toBe(300);
		expect(resizerRef.value.offsetHeight).toBe(150);
		wrapper.unmount();
	});

	it('卸载时移除监听并清理 timer, 之后再触发不会调用回调', async () => {
		const onResize = vi.fn();
		const resizerRef = ref<any>();
		const wrapper = mount(defineComponent({
			setup() {
				return () => (<Resizer ref={resizerRef} onResize={onResize} />);
			}
		}), { attachTo: document.body });

		await nextTick();

		const el = wrapper.element;
		setRect(el, 200, 100);
		resizerRef.value.refresh();
		await nextTick();
		expect(onResize).toHaveBeenCalledTimes(1);

		expect(() => wrapper.unmount()).not.toThrow();

		// 卸载后即使再次 trigger 也不应再调用
		setRect(el, 400, 220);
		triggerResize(el);
		await sleep(40);
		expect(onResize).toHaveBeenCalledTimes(1);
	});
});
