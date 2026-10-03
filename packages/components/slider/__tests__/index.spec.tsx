// @vitest-environment jsdom

import { Slider, Popover } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import * as drag from '../../../hooks/__tests__/fixtures/drag';
import { defineComponent, h, nextTick, ref } from 'vue';
import { checkLimits, clamp, getOffset } from '../utils';

const sleep = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const setRect = (el: Element, rect: Partial<DOMRect>) => {
	(el as HTMLElement).getBoundingClientRect = () => ({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		toJSON: () => ({}),
		...rect
	});
};

// 移动与松开发生在滑块之外
const mouseDown = (el: Element, clientX: number, init: MouseEventInit = {}) => {
	drag.fireMouse(el, 'mousedown', { clientX, ...init });
};

const mouseMove = (clientX: number, init: MouseEventInit = {}) => {
	drag.fireMouse(document.body, 'mousemove', { clientX, ...init });
};

const mouseUp = () => {
	drag.fireMouse(document.body, 'mouseup');
};

const click = (el: Element, clientX: number) => {
	el.dispatchEvent(new MouseEvent('click', {
		bubbles: true,
		cancelable: true,
		clientX
	}));
};

const touch = (el: Element, type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel', clientX: number) => {
	drag.fireTouch(el, type, { clientX });
};

const mountControlled = (options: Record<string, any> = {}) => {
	const value = ref(options.range ? [25, 50] : 25);
	const onChange = vi.fn();
	const onAfterChange = vi.fn();

	const wrapper = mount(defineComponent({
		setup() {
			return () => h(Slider, {
				modelValue: value.value,
				onChange,
				onAfterChange,
				...{
					'onUpdate:modelValue': (next: any) => {
						value.value = next;
					}
				},
				...options
			});
		}
	}), {
		attachTo: document.body
	});

	setRect(wrapper.find('.vc-slider__wrapper').element, {
		left: 0,
		width: 100
	});

	return {
		wrapper,
		value,
		onChange,
		onAfterChange
	};
};

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof Slider).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Slider />));

		expect(wrapper.classes()).toContain('vc-slider');
	});

	it('drag: 单滑块拖动时更新值并触发事件', async () => {
		const { wrapper, value, onChange, onAfterChange } = mountControlled();
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		mouseDown(button, 25);
		mouseMove(75);
		await flush();
		mouseUp();
		await flush();

		expect(value.value).toBe(75);
		expect(onChange).toHaveBeenCalledWith(75, expect.any(Function));
		expect(onAfterChange).toHaveBeenCalledWith(75, expect.any(Function));

		wrapper.unmount();
	});

	it('click: 点击轨道移动单滑块', async () => {
		const { wrapper, value, onChange } = mountControlled();
		const track = wrapper.find('.vc-slider__wrapper').element;

		click(track, 40);
		await flush();

		expect(value.value).toBe(40);
		expect(onChange).toHaveBeenCalledWith(40, expect.any(Function));

		wrapper.unmount();
	});

	it('range: 拖动两端并在交叉时夹紧', async () => {
		const { wrapper, value } = mountControlled({ range: true });
		const buttons = wrapper.findAll('.vc-slider__btn-wrapper');

		mouseDown(buttons[0].element, 25);
		mouseMove(35);
		mouseUp();
		await flush();

		expect(value.value).toEqual([35, 50]);

		mouseDown(buttons[0].element, 35);
		mouseMove(75);
		mouseUp();
		await flush();

		expect(value.value).toEqual([75, 75]);

		mouseDown(buttons[1].element, 75);
		mouseMove(45);
		mouseUp();
		await flush();

		expect(value.value).toEqual([45, 45]);

		mouseDown(buttons[1].element, 45);
		mouseMove(95);
		mouseUp();
		await flush();

		expect(value.value).toEqual([45, 95]);

		wrapper.unmount();
	});

	it('range: 点击轨道时移动最近的滑块', async () => {
		const { wrapper, value } = mountControlled({ range: true });
		const track = wrapper.find('.vc-slider__wrapper').element;

		click(track, 30);
		await flush();
		expect(value.value).toEqual([30, 50]);

		click(track, 80);
		await flush();
		expect(value.value).toEqual([30, 80]);

		wrapper.unmount();
	});

	it('click: 支持直接点击 bar 和 stop', async () => {
		const { wrapper, value } = mountControlled({
			step: 10,
			showStops: true
		});

		click(wrapper.find('.vc-slider__stop').element, 10);
		await flush();
		expect(value.value).toBe(10);

		click(wrapper.find('.vc-slider__bar').element, 60);
		await flush();
		expect(value.value).toBe(60);

		wrapper.unmount();
	});

	it('disabled: 禁用时不可拖动或点击', async () => {
		const { wrapper, value, onChange } = mountControlled({ disabled: true });
		const button = wrapper.find('.vc-slider__btn-wrapper').element;
		const track = wrapper.find('.vc-slider__wrapper').element;

		expect(wrapper.find('.vc-slider').classes()).toContain('is-slider-disabled');

		mouseDown(button, 25);
		mouseMove(75);
		mouseUp();
		click(track, 40);
		await flush();

		expect(value.value).toBe(25);
		expect(onChange).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('drag: 未移动时不触发 after-change', async () => {
		const { wrapper, onAfterChange } = mountControlled();
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		mouseDown(button, 25);
		mouseUp();
		await flush();

		expect(onAfterChange).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('drag: 只有主键能拖动', async () => {
		const { wrapper, value, onChange } = mountControlled();
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		mouseDown(button, 25, { button: 2, buttons: 2 });
		mouseMove(75, { buttons: 2 });
		await flush();

		expect(value.value).toBe(25);
		expect(onChange).not.toHaveBeenCalled();
		expect(wrapper.find('.vc-slider__button').classes()).not.toContain('is-dragging');

		wrapper.unmount();
	});

	it('drag: mouseup 丢失后不再跟手', async () => {
		const { wrapper, value, onAfterChange } = mountControlled();
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		mouseDown(button, 25);
		mouseMove(50);
		await flush();
		expect(value.value).toBe(50);

		// 右键菜单、原生拖拽等吞掉了 mouseup：下一次移动时主键已松开
		mouseMove(75, { buttons: 0 });
		await flush();
		expect(value.value).toBe(50);
		expect(onAfterChange).toHaveBeenCalledTimes(1);
		expect(wrapper.find('.vc-slider__button').classes()).not.toContain('is-dragging');

		// 已解绑：之后按着主键移动也不再拖动
		mouseMove(90);
		await flush();
		expect(value.value).toBe(50);

		wrapper.unmount();
	});

	it('drag: 拖动中卸载后不再响应', async () => {
		const { wrapper, onChange } = mountControlled();
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		mouseDown(button, 25);
		wrapper.unmount();
		mouseMove(75);
		mouseUp();

		expect(onChange).not.toHaveBeenCalled();
	});

	it('clickable=false: 禁止轨道点击但保留拖动', async () => {
		const { wrapper, value } = mountControlled({ clickable: false });
		const button = wrapper.find('.vc-slider__btn-wrapper').element;
		const track = wrapper.find('.vc-slider__wrapper').element;

		click(track, 40);
		await flush();
		expect(value.value).toBe(25);

		mouseDown(button, 25);
		mouseMove(70);
		mouseUp();
		await flush();
		expect(value.value).toBe(70);

		wrapper.unmount();
	});

	it('range: max 滑块支持触摸拖动', async () => {
		const { wrapper, value } = mountControlled({ range: true });
		const maxButton = wrapper.findAll('.vc-slider__btn-wrapper')[1].element;

		touch(maxButton, 'touchstart', 50);
		touch(maxButton, 'touchmove', 80);
		touch(maxButton, 'touchend', 80);
		await flush();

		expect(value.value).toEqual([25, 80]);

		wrapper.unmount();
	});

	it('step: 按步长向下对齐并渲染间断点', async () => {
		const { wrapper, value } = mountControlled({
			step: 10,
			showStops: true
		});
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		expect(wrapper.findAll('.vc-slider__stop').length).toBe(9);

		mouseDown(button, 25);
		mouseMove(58);
		mouseUp();
		await flush();

		expect(value.value).toBe(50);

		wrapper.unmount();
	});

	it('step: 支持小数步长精度', async () => {
		const value = ref(25.2);
		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Slider
						modelValue={value.value}
						step={0.1}
						onUpdate:modelValue={(next: number) => {
							value.value = next;
						}}
					/>
				);
			}
		}), {
			attachTo: document.body
		});
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		setRect(wrapper.find('.vc-slider__wrapper').element, {
			left: 0,
			width: 100
		});

		mouseDown(button, 25.2);
		mouseMove(75.2);
		mouseUp();
		await flush();

		expect(value.value).toBe(75.2);

		wrapper.unmount();
	});

	it('showInput: 输入框变化时同步单滑块值', async () => {
		const { wrapper, value, onChange } = mountControlled({
			showInput: true,
			min: 20,
			max: 60
		});
		const inputNumber = wrapper.findComponent({ name: 'vc-input-number' });

		expect(inputNumber.exists()).toBe(true);

		inputNumber.vm.$emit('input', 80);
		await flush();

		expect(value.value).toBe(60);
		expect(onChange).toHaveBeenCalledWith(60, expect.any(Function));

		wrapper.unmount();
	});

	it('showTip: 支持 hover、focus 和运行时切换', async () => {
		const showTip = ref<'hover' | 'always' | 'never'>('hover');
		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Slider
						modelValue={[20, 60]}
						range
						showTip={showTip.value}
					/>
				);
			}
		}));
		const popovers = () => wrapper.findAllComponents(Popover);
		const buttons = wrapper.findAll('.vc-slider__button');

		expect(popovers()[0].props('modelValue')).toBe(false);

		await buttons[0].trigger('mouseenter');
		await flush();
		expect(popovers()[0].props('modelValue')).toBe(true);

		await buttons[0].trigger('mouseleave');
		await flush();
		expect(popovers()[0].props('modelValue')).toBe(false);

		await buttons[1].trigger('focus');
		await flush();
		expect(popovers()[1].props('modelValue')).toBe(true);

		await buttons[1].trigger('blur');
		await flush();
		expect(popovers()[1].props('modelValue')).toBe(false);

		showTip.value = 'always';
		await flush();
		expect(popovers()[0].props('modelValue')).toBe(true);
		expect(popovers()[1].props('modelValue')).toBe(true);

		showTip.value = 'never';
		await flush();
		expect(popovers()[0].props('modelValue')).toBe(false);
		expect(popovers()[1].props('modelValue')).toBe(false);

		wrapper.unmount();
	});

	it('showTip: 支持 formatter 隐藏', async () => {
		const always = mount(() => (
			<Slider
				modelValue={20}
				showTip="always"
				formatter={(value: number) => `${value}%`}
			/>
		));

		expect(always.findComponent(Popover).props('modelValue')).toBe(true);
		always.unmount();

		const hidden = mount(() => (
			<Slider
				modelValue={20}
				showTip="always"
				formatter={() => null}
			/>
		));

		expect(hidden.findComponent(Popover).props('modelValue')).toBe(false);
		hidden.unmount();
	});

	it('touch: 支持触摸拖动', async () => {
		const { wrapper, value } = mountControlled();
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		touch(button, 'touchstart', 25);
		touch(button, 'touchmove', 75);
		touch(button, 'touchend', 75);
		await flush();

		expect(value.value).toBe(75);

		wrapper.unmount();
	});

	it('touch: touchcancel 结束拖动', async () => {
		const { wrapper, value, onAfterChange } = mountControlled();
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		touch(button, 'touchstart', 25);
		touch(button, 'touchmove', 60);
		await flush();
		expect(value.value).toBe(60);

		// 系统手势等打断了触摸：不会再有 touchend
		touch(button, 'touchcancel', 60);
		await flush();
		expect(onAfterChange).toHaveBeenCalledTimes(1);
		expect(wrapper.find('.vc-slider__button').classes()).not.toContain('is-dragging');

		// 结束后的移动不再拖动
		touch(button, 'touchmove', 90);
		await flush();
		expect(value.value).toBe(60);

		wrapper.unmount();
	});

	it('boundary: 空宽度和零范围时不移动', async () => {
		const value = ref(20);
		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Slider
						modelValue={value.value}
						min={20}
						max={20}
						showStops
						onUpdate:modelValue={(next: number) => {
							value.value = next;
						}}
					/>
				);
			}
		}), {
			attachTo: document.body
		});
		const track = wrapper.find('.vc-slider__wrapper').element;

		expect(wrapper.findAll('.vc-slider__stop').length).toBe(0);

		click(track, 50);
		await flush();

		expect(value.value).toBe(20);

		wrapper.unmount();
	});

	it('utils: 处理边界输入', () => {
		expect(clamp(Number.NaN, 1, 5)).toBe(1);
		expect(checkLimits([8, 3], { min: 0, max: 10 })).toEqual([8, 8]);
		expect(getOffset(75.2, 0.1)).toBe(0);
	});
});
