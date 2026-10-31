// @vitest-environment jsdom

import { Slider, Popover } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import * as drag from '../../../hooks/__tests__/fixtures/drag';
import { defineComponent, h, nextTick, ref } from 'vue';

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

const mountControlled = ({ modelValue, ...options }: Record<string, any> = {}) => {
	const value = ref(modelValue ?? (options.range ? [25, 50] : 25));
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

	it('click: 支持直接点击 bar 和刻度', async () => {
		const { wrapper, value } = mountControlled({
			step: 10,
			ticks: 'dot'
		});

		click(wrapper.find('.vc-slider__tick').element, 10);
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

	it('step: 按步长四舍五入对齐并渲染间断点', async () => {
		const { wrapper, value } = mountControlled({
			step: 10,
			ticks: 'dot'
		});
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		expect(wrapper.findAll('.vc-slider__tick').length).toBe(9);

		mouseDown(button, 25);
		mouseMove(54);
		mouseUp();
		await flush();
		expect(value.value).toBe(50);

		mouseDown(button, 50);
		mouseMove(56);
		mouseUp();
		await flush();
		expect(value.value).toBe(60);

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

	it('tooltip: 支持 hover、focus 和运行时切换', async () => {
		const tooltip = ref<'hover' | 'always' | 'never'>('hover');
		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Slider
						modelValue={[20, 60]}
						range
						tooltip={tooltip.value}
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

		tooltip.value = 'always';
		await flush();
		expect(popovers()[0].props('modelValue')).toBe(true);
		expect(popovers()[1].props('modelValue')).toBe(true);

		tooltip.value = 'never';
		await flush();
		expect(popovers()[0].props('modelValue')).toBe(false);
		expect(popovers()[1].props('modelValue')).toBe(false);

		wrapper.unmount();
	});

	it('tooltip: 支持 formatter 隐藏', async () => {
		const always = mount(() => (
			<Slider
				modelValue={20}
				tooltip="always"
				formatter={(value: number) => `${value}%`}
			/>
		));

		expect(always.findComponent(Popover).props('modelValue')).toBe(true);
		always.unmount();

		const hidden = mount(() => (
			<Slider
				modelValue={20}
				tooltip="always"
				formatter={() => null}
			/>
		));

		expect(hidden.findComponent(Popover).props('modelValue')).toBe(false);
		hidden.unmount();
	});

	it('tooltip: 拖动和外部改值时提示跟随', async () => {
		const { wrapper, value } = mountControlled({ tooltip: 'always' });
		const button = wrapper.find('.vc-slider__btn-wrapper').element;
		const tip = () => document.querySelector('.vc-popover-wrapper__content')?.textContent;

		await flush();
		expect(tip()).toBe('25');

		mouseDown(button, 25);
		mouseMove(60);
		await flush();
		expect(tip()).toBe('60');

		mouseUp();
		value.value = 40;
		await flush();
		expect(tip()).toBe('40');

		wrapper.unmount();
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
						ticks="dot"
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

		expect(wrapper.findAll('.vc-slider__tick').length).toBe(0);

		click(track, 50);
		await flush();

		expect(value.value).toBe(20);

		wrapper.unmount();
	});

	it('vertical: 起点在下方，按 clientY 拖动和点击', async () => {
		const { wrapper, value } = mountControlled({ vertical: true });
		const track = wrapper.find('.vc-slider__wrapper').element;
		const button = wrapper.find('.vc-slider__btn-wrapper');

		setRect(track, { top: 0, bottom: 100, height: 100, width: 4 });
		expect(wrapper.find('.vc-slider').classes()).toContain('is-vertical');
		expect(button.attributes('style')).toContain('bottom: 25%');

		mouseDown(button.element, 0, { clientY: 75 });
		mouseMove(0, { clientY: 30 });
		mouseUp();
		await flush();
		expect(value.value).toBe(70);

		track.dispatchEvent(new MouseEvent('click', { bubbles: true, clientY: 90 }));
		await flush();
		expect(value.value).toBe(10);

		wrapper.unmount();
	});

	it('inverted: 水平时起点在右侧，垂直时起点在上方', async () => {
		const { wrapper, value } = mountControlled({ inverted: true });
		const track = wrapper.find('.vc-slider__wrapper').element;
		const button = wrapper.find('.vc-slider__btn-wrapper');

		expect(button.attributes('style')).toContain('right: 25%');

		click(track, 40);
		await flush();
		expect(value.value).toBe(60);

		mouseDown(button.element, 40);
		mouseMove(90);
		mouseUp();
		await flush();
		expect(value.value).toBe(10);

		wrapper.unmount();

		const vertical = mountControlled({ vertical: true, inverted: true });
		const verticalTrack = vertical.wrapper.find('.vc-slider__wrapper').element;

		setRect(verticalTrack, { top: 0, bottom: 100, height: 100, width: 4 });
		expect(vertical.wrapper.find('.vc-slider__btn-wrapper').attributes('style')).toContain('top: 25%');

		verticalTrack.dispatchEvent(new MouseEvent('click', { bubbles: true, clientY: 80 }));
		await flush();
		expect(vertical.value.value).toBe(80);

		vertical.wrapper.unmount();
	});

	it('drag: 按下点偏离滑块中心时不跳动', async () => {
		const { wrapper, value, onChange } = mountControlled();
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		// 按在滑块中心右侧 3px
		mouseDown(button, 28);
		mouseMove(28);
		await flush();
		expect(onChange).not.toHaveBeenCalled();

		mouseMove(48);
		mouseUp();
		await flush();
		expect(value.value).toBe(45);

		wrapper.unmount();
	});

	it('range: 多滑块，越过相邻滑块时一起推动', async () => {
		const { wrapper, value, onChange } = mountControlled({ range: true, modelValue: [10, 40, 70] });
		const buttons = () => wrapper.findAll('.vc-slider__btn-wrapper');

		expect(buttons().length).toBe(3);
		expect(wrapper.find('.vc-slider__bar').attributes('style')).toContain('left: 10%; width: 60%');

		mouseDown(buttons()[1].element, 40);
		mouseMove(55);
		mouseUp();
		await flush();
		expect(value.value).toEqual([10, 55, 70]);

		mouseDown(buttons()[0].element, 10);
		mouseMove(80);
		mouseUp();
		await flush();
		expect(value.value).toEqual([80, 80, 80]);
		expect(onChange).toHaveBeenLastCalledWith([80, 80, 80], expect.any(Function));

		wrapper.unmount();
	});

	it('range: 多滑块点击移动最近的，值相同时按点击方向选择', async () => {
		const { wrapper, value } = mountControlled({ range: true, modelValue: [20, 50, 50, 80] });
		const track = wrapper.find('.vc-slider__wrapper').element;

		click(track, 45);
		await flush();
		expect(value.value).toEqual([20, 45, 50, 80]);

		click(track, 60);
		await flush();
		expect(value.value).toEqual([20, 45, 60, 80]);

		click(track, 30);
		await flush();
		expect(value.value).toEqual([30, 45, 60, 80]);

		wrapper.unmount();
	});

	it('range: 传入的值排序并夹到边界，单个数字展开成两个滑块', async () => {
		const unsorted = mount(() => <Slider modelValue={[60, -10, 120]} range />);
		const styles = unsorted.findAll('.vc-slider__btn-wrapper').map(item => item.attributes('style'));

		expect(styles).toEqual(['left: 0%;', 'left: 60%;', 'left: 100%;']);
		unsorted.unmount();

		const single = mount(() => <Slider modelValue={30} range />);
		expect(single.findAll('.vc-slider__btn-wrapper').length).toBe(2);
		single.unmount();
	});

	it('segments: 按段宽定位，段内使用各自的步长', async () => {
		const { wrapper, value } = mountControlled({
			max: 50,
			modelValue: 10,
			segments: [{ end: 10, width: '50%' }, { end: 50, step: 8 }],
			ticks: 'dot'
		});
		const track = wrapper.find('.vc-slider__wrapper').element;

		expect(wrapper.find('.vc-slider__btn-wrapper').attributes('style')).toContain('left: 50%');

		click(track, 20);
		await flush();
		expect(value.value).toBe(4);

		click(track, 64);
		await flush();
		expect(value.value).toBe(18);

		click(track, 99);
		await flush();
		expect(value.value).toBe(50);

		// 0~10 每 1 一个，10~50 每 8 一个，不含两端
		expect(wrapper.findAll('.vc-slider__tick').length).toBe(9 + 5);

		wrapper.unmount();
	});

	it('step=null: 只能落在 marks 上', async () => {
		const { wrapper, value } = mountControlled({
			step: null,
			modelValue: 0,
			marks: { 0: 'A', 30: 'B', 100: 'C', 150: 'D' },
			ticks: 'dot',
			showInput: true
		});
		const track = wrapper.find('.vc-slider__wrapper').element;
		const button = wrapper.find('.vc-slider__btn-wrapper').element;

		expect(wrapper.findComponent({ name: 'vc-input-number' }).exists()).toBe(false);
		// 刻度落在标签上时由标签圆点代替
		expect(wrapper.findAll('.vc-slider__tick').length).toBe(0);
		expect(wrapper.findAll('.vc-slider__mark-dot').length).toBe(3);

		click(track, 20);
		await flush();
		expect(value.value).toBe(30);

		mouseDown(button, 30);
		mouseMove(70);
		mouseUp();
		await flush();
		expect(value.value).toBe(100);

		wrapper.unmount();
	});
	it('ticks: dot 与 line 两种样式，按选中范围标记', async () => {
		const ticks = ref<'none' | 'dot' | 'line'>('none');
		const wrapper = mount(defineComponent({
			setup() {
				return () => <Slider modelValue={[20, 50]} range step={10} ticks={ticks.value} />;
			}
		}));
		const items = () => wrapper.findAll('.vc-slider__tick');

		expect(items().length).toBe(0);

		ticks.value = 'line';
		await flush();
		expect(items().length).toBe(9);
		expect(items()[0].classes()).toContain('is-line');
		expect(items().filter(item => item.classes().includes('is-active')).map(item => item.attributes('style'))).toEqual([
			'left: 20%;',
			'left: 30%;',
			'left: 40%;',
			'left: 50%;'
		]);

		ticks.value = 'dot';
		await flush();
		expect(items()[0].classes()).toContain('is-dot');

		wrapper.unmount();
	});

	it('marks: 渲染圆点与标签，过滤越界，支持对象写法', async () => {
		const wrapper = mount(() => (
			<Slider
				modelValue={30}
				marks={{
					0: '0°C',
					30: { label: '30°C', class: 'is-warm', style: { color: 'red' } },
					60: '',
					120: 'out'
				}}
			/>
		));
		const marks = wrapper.findAll('.vc-slider__mark');
		const dots = wrapper.findAll('.vc-slider__mark-dot');

		expect(wrapper.find('.vc-slider').classes()).toContain('is-marked');
		expect(dots.length).toBe(3);
		expect(dots.map(item => item.classes().includes('is-active'))).toEqual([true, true, false]);
		// 空标签只画圆点
		expect(marks.map(item => item.text())).toEqual(['0°C', '30°C']);
		expect(marks[1].classes()).toEqual(expect.arrayContaining(['is-warm', 'is-active']));
		expect(marks[1].attributes('style')).toBe('left: 30%; color: red;');

		wrapper.unmount();
	});

	it('marks: 点击标签或圆点跳到该值，range 时移动最近的滑块', async () => {
		const { wrapper, value, onChange } = mountControlled({
			range: true,
			marks: { 10: 'A', 37: 'B', 90: 'C' }
		});
		const marks = wrapper.findAll('.vc-slider__mark');

		await marks[0].trigger('click');
		expect(value.value).toEqual([10, 50]);

		await wrapper.findAll('.vc-slider__mark-dot')[1].trigger('click');
		expect(value.value).toEqual([10, 37]);

		await marks[2].trigger('click');
		expect(value.value).toEqual([10, 90]);
		expect(onChange).toHaveBeenCalledTimes(3);

		wrapper.unmount();

		const disabled = mountControlled({ disabled: true, marks: { 10: 'A' } });
		await disabled.wrapper.find('.vc-slider__mark').trigger('click');
		expect(disabled.value.value).toBe(25);
		disabled.wrapper.unmount();
	});

	it('slots: mark / thumb / tooltip', async () => {
		const wrapper = mount(() => (
			<Slider
				modelValue={[20, 60]}
				range
				tooltip="always"
				formatter={() => null}
				marks={{ 20: 'A', 80: 'B' }}
				v-slots={{
					mark: ({ value, label, active }: any) => `${label}-${value}-${active}`,
					thumb: ({ value, index, dragging }: any) => <i class="thumb">{`${index}:${value}:${dragging}`}</i>,
					tooltip: ({ value, index }: any) => `#${index} ${value}`
				}}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.findAll('.vc-slider__mark').map(item => item.text())).toEqual(['A-20-true', 'B-80-false']);
		expect(wrapper.findAll('.vc-slider__button').every(item => item.classes().includes('is-custom'))).toBe(true);
		expect(wrapper.findAll('.thumb').map(item => item.text())).toEqual(['0:20:false', '1:60:false']);
		// formatter 返回空时，有 #tooltip 插槽仍然显示
		expect(wrapper.findAllComponents(Popover).map(item => item.props('modelValue'))).toEqual([true, true]);
		expect([...document.querySelectorAll('.vc-popover-wrapper__content')].map(item => item.textContent)).toEqual(['#0 20', '#1 60']);

		wrapper.unmount();
	});

	it('tooltipPlacement: 默认水平在上、垂直在右，可覆盖', async () => {
		const placement = (props: Record<string, any>) => {
			const wrapper = mount(() => <Slider modelValue={20} {...props} />);
			const result = wrapper.findComponent(Popover).props('placement');
			wrapper.unmount();
			return result;
		};

		expect(placement({})).toBe('top');
		expect(placement({ vertical: true })).toBe('right');
		expect(placement({ tooltipPlacement: 'bottom' })).toBe('bottom');
		expect(placement({ vertical: true, tooltipPlacement: 'left' })).toBe('left');
	});
	it('range.draggable: 按住选中条整体平移，首尾不越界', async () => {
		const { wrapper, value, onAfterChange } = mountControlled({
			range: { draggable: true },
			modelValue: [20, 50],
			step: 10
		});
		const bar = wrapper.find('.vc-slider__bar');

		expect(bar.classes()).toContain('is-draggable');

		mouseDown(bar.element, 30);
		mouseMove(52);
		await flush();
		expect(value.value).toEqual([40, 70]);
		expect(bar.classes()).toContain('is-dragging');

		// 位移 +70 超出右边界，限制为 +50
		mouseMove(95);
		await flush();
		expect(value.value).toEqual([70, 100]);

		mouseMove(5);
		await flush();
		expect(value.value).toEqual([0, 30]);

		// 浏览器在 mouseup 后立即派发 click：不算点击轨道
		mouseUp();
		click(bar.element, 80);
		await flush();
		expect(value.value).toEqual([0, 30]);
		expect(onAfterChange).toHaveBeenCalledTimes(1);
		expect(onAfterChange).toHaveBeenCalledWith([0, 30], expect.any(Function));
		expect(bar.classes()).not.toContain('is-dragging');

		click(bar.element, 80);
		await flush();
		expect(value.value).toEqual([0, 80]);

		wrapper.unmount();
	});

	it('range.draggable: 未移动时按点击处理，松开在外部时不吞下一次点击', async () => {
		const { wrapper, value, onAfterChange } = mountControlled({
			range: { draggable: true },
			modelValue: [20, 50]
		});
		const bar = wrapper.find('.vc-slider__bar').element;

		mouseDown(bar, 30);
		mouseUp();
		click(bar, 30);
		await flush();
		expect(value.value).toEqual([30, 50]);
		expect(onAfterChange).not.toHaveBeenCalled();

		mouseDown(bar, 40);
		mouseMove(45);
		mouseUp();
		await sleep(10);
		expect(value.value).toEqual([35, 55]);

		click(bar, 50);
		await flush();
		expect(value.value).toEqual([35, 50]);

		wrapper.unmount();
	});

	it('range.draggable: 未开启或禁用时选中条不可平移', async () => {
		const plain = mountControlled({ range: true, modelValue: [20, 50] });
		const bar = plain.wrapper.find('.vc-slider__bar');

		expect(bar.classes()).not.toContain('is-draggable');
		mouseDown(bar.element, 30);
		mouseMove(60);
		mouseUp();
		await flush();
		expect(plain.value.value).toEqual([20, 50]);
		plain.wrapper.unmount();

		const disabled = mountControlled({ range: { draggable: true }, modelValue: [20, 50], disabled: true });
		mouseDown(disabled.wrapper.find('.vc-slider__bar').element, 30);
		mouseMove(60);
		mouseUp();
		await flush();
		expect(disabled.value.value).toEqual([20, 50]);
		disabled.wrapper.unmount();
	});

	it('keyboard: 方向键按视觉方向移动一步，触发 change 与 after-change', async () => {
		const { wrapper, value, onChange, onAfterChange } = mountControlled({ step: 5 });
		const button = wrapper.find('.vc-slider__button');

		await button.trigger('keydown', { key: 'ArrowRight' });
		expect(value.value).toBe(30);
		await button.trigger('keydown', { key: 'ArrowUp' });
		expect(value.value).toBe(35);
		await button.trigger('keydown', { key: 'ArrowLeft' });
		await button.trigger('keydown', { key: 'ArrowDown' });
		expect(value.value).toBe(25);
		expect(onChange).toHaveBeenCalledTimes(4);
		expect(onAfterChange).toHaveBeenCalledTimes(4);

		await button.trigger('keydown', { key: 'PageUp' });
		expect(value.value).toBe(75);
		await button.trigger('keydown', { key: 'End' });
		expect(value.value).toBe(100);
		// 已在边界：不触发事件
		await button.trigger('keydown', { key: 'ArrowRight' });
		expect(onChange).toHaveBeenCalledTimes(6);
		await button.trigger('keydown', { key: 'Home' });
		expect(value.value).toBe(0);
		await button.trigger('keydown', { key: 'Enter' });
		expect(onChange).toHaveBeenCalledTimes(7);

		wrapper.unmount();
	});

	it('keyboard: inverted / vertical 下跟随视觉方向，Home / End 停在相邻滑块', async () => {
		const inverted = mountControlled({ inverted: true });
		await inverted.wrapper.find('.vc-slider__button').trigger('keydown', { key: 'ArrowRight' });
		expect(inverted.value.value).toBe(24);
		inverted.wrapper.unmount();

		const vertical = mountControlled({ vertical: true, inverted: true });
		const verticalButton = vertical.wrapper.find('.vc-slider__button');
		await verticalButton.trigger('keydown', { key: 'ArrowUp' });
		expect(vertical.value.value).toBe(24);
		await verticalButton.trigger('keydown', { key: 'ArrowRight' });
		expect(vertical.value.value).toBe(25);
		vertical.wrapper.unmount();

		const range = mountControlled({ range: true, modelValue: [20, 40, 60] });
		const buttons = range.wrapper.findAll('.vc-slider__button');
		await buttons[1].trigger('keydown', { key: 'End' });
		expect(range.value.value).toEqual([20, 60, 60]);
		await buttons[1].trigger('keydown', { key: 'Home' });
		expect(range.value.value).toEqual([20, 20, 60]);
		range.wrapper.unmount();
	});

	it('keyboard: 分段与 step=null 时按段步长或标签移动，禁用时无效', async () => {
		const segments = mountControlled({ max: 50, modelValue: 9, segments: [{ end: 10 }, { end: 50, step: 8 }] });
		const segmentButton = segments.wrapper.find('.vc-slider__button');
		await segmentButton.trigger('keydown', { key: 'ArrowRight' });
		await segmentButton.trigger('keydown', { key: 'ArrowRight' });
		expect(segments.value.value).toBe(18);
		await segmentButton.trigger('keydown', { key: 'ArrowLeft' });
		await segmentButton.trigger('keydown', { key: 'ArrowLeft' });
		expect(segments.value.value).toBe(9);
		segments.wrapper.unmount();

		const marks = mountControlled({ step: null, modelValue: 30, marks: { 0: 'A', 30: 'B', 80: 'C' } });
		const markButton = marks.wrapper.find('.vc-slider__button');
		await markButton.trigger('keydown', { key: 'ArrowRight' });
		expect(marks.value.value).toBe(80);
		await markButton.trigger('keydown', { key: 'PageDown' });
		expect(marks.value.value).toBe(0);
		marks.wrapper.unmount();

		const disabled = mountControlled({ disabled: true });
		await disabled.wrapper.find('.vc-slider__button').trigger('keydown', { key: 'ArrowRight' });
		expect(disabled.value.value).toBe(25);
		disabled.wrapper.unmount();
	});

	it('aria: role、取值、方向与禁用', async () => {
		const wrapper = mount(() => (
			<Slider modelValue={30} min={10} max={90} vertical formatter={(value: number) => `${value}%`} />
		));
		const button = wrapper.find('.vc-slider__button');

		expect(button.attributes()).toMatchObject({
			'role': 'slider',
			'tabindex': '0',
			'aria-valuemin': '10',
			'aria-valuemax': '90',
			'aria-valuenow': '30',
			'aria-valuetext': '30%',
			'aria-orientation': 'vertical',
			'aria-disabled': 'false'
		});
		wrapper.unmount();

		const disabled = mount(() => <Slider modelValue={30} disabled formatter={() => null} />);
		const disabledButton = disabled.find('.vc-slider__button');
		expect(disabledButton.attributes('tabindex')).toBe('-1');
		expect(disabledButton.attributes('aria-disabled')).toBe('true');
		expect(disabledButton.attributes('aria-valuetext')).toBeUndefined();
		disabled.unmount();
	});

	it('showInput: 两个滑块的范围显示两个输入框，超过两个时不显示', async () => {
		const { wrapper, value } = mountControlled({ range: true, showInput: true });
		const inputs = wrapper.findAllComponents({ name: 'vc-input-number' });

		expect(inputs.length).toBe(2);
		// 分列轨道两端：第一个值在前、第二个值在后
		const children = [...wrapper.find('.vc-slider').element.children]
			.map(el => el.className.split(' ').find(name => name.startsWith('vc-slider__')));
		expect(children).toEqual(['vc-slider__input', 'vc-slider__wrapper', 'vc-slider__input']);
		expect(inputs.map(item => item.classes().find(name => /^is-(before|after)$/.test(name)))).toEqual(['is-before', 'is-after']);
		expect(inputs.map(item => item.props('modelValue'))).toEqual(['25', '50']);

		inputs[1].vm.$emit('input', 70);
		await flush();
		expect(value.value).toEqual([25, 70]);

		// 第一个超过第二个时一起收拢
		inputs[0].vm.$emit('input', 90);
		await flush();
		expect(value.value).toEqual([90, 90]);

		wrapper.unmount();

		// 反向或垂直时各自靠近对应的滑块：水平反向第二个值在左，垂直时第二个值在上
		const order = (props: Record<string, any>) => {
			const instance = mount(() => <Slider modelValue={[20, 60]} range showInput {...props} />);
			const result = instance.findAllComponents({ name: 'vc-input-number' }).map(item => item.props('modelValue'));
			instance.unmount();
			return result;
		};
		expect(order({ inverted: true })).toEqual(['60', '20']);
		expect(order({ vertical: true })).toEqual(['60', '20']);
		expect(order({ vertical: true, inverted: true })).toEqual(['20', '60']);

		const single = mount(() => <Slider modelValue={20} showInput />);
		expect(single.find('.vc-input-number').classes()).toContain('is-after');
		single.unmount();

		const multiple = mount(() => <Slider modelValue={[10, 20, 30]} range showInput />);
		expect(multiple.findComponent({ name: 'vc-input-number' }).exists()).toBe(false);
		multiple.unmount();
	});
});
