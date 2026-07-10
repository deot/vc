// @vitest-environment jsdom

import { ColorPicker, Portal } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { ColorPickerView } from '../picker-view';
import { Color } from '../color';
import { useDraggable } from '../use-draggable';

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

const setNonEnumerableRect = (el: Element, rect: Partial<DOMRect>) => {
	const domRect = {};

	Object.entries({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		...rect
	}).forEach(([key, value]) => {
		Object.defineProperty(domRect, key, {
			value,
			enumerable: false
		});
	});

	Object.defineProperty(domRect, 'toJSON', {
		value: () => ({}),
		enumerable: false
	});

	(el as HTMLElement).getBoundingClientRect = () => domRect as DOMRect;
};

const click = (el: Element) => {
	el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
};

const mouseDown = (el: Element, options: MouseEventInit) => {
	el.dispatchEvent(new MouseEvent('mousedown', {
		bubbles: true,
		cancelable: true,
		...options
	}));
};

const mouseMove = (options: MouseEventInit) => {
	document.dispatchEvent(new MouseEvent('mousemove', {
		bubbles: true,
		cancelable: true,
		...options
	}));
};

const mouseUp = (options: MouseEventInit) => {
	document.dispatchEvent(new MouseEvent('mouseup', {
		bubbles: true,
		cancelable: true,
		...options
	}));
};

const touch = (el: Element | Document, type: string, clientX: number, clientY = 0, cancelable = true) => {
	const e = new Event(type, { bubbles: true, cancelable });
	const key = type === 'touchend' || type === 'touchcancel' ? 'changedTouches' : 'touches';

	Object.defineProperty(e, key, {
		value: [{ clientX, clientY }]
	});
	el.dispatchEvent(e);
};

const getPicker = () => document.querySelector('.vc-color-picker__picker') as HTMLElement | null;
const getPrimaryButton = () => document.querySelector('.vc-color-picker__confirm .is-primary') as HTMLElement;
const getDefaultButton = () => document.querySelector('.vc-color-picker__confirm .is-default') as HTMLElement;

describe('index.ts', () => {
	afterEach(() => {
		Portal.clear(true);
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof ColorPicker).toBe('object');
		expect(typeof ColorPickerView).toBe('object');
		expect(typeof Color).toBe('function');
		expect(ColorPicker.View).toBe(ColorPickerView);
	});

	it('create', async () => {
		const wrapper = mount(() => (<ColorPicker />));

		expect(wrapper.classes()).toContain('vc-color-picker');
		expect(wrapper.classes()).toContain('is-medium');

		wrapper.unmount();
	});

	it('disabled: 禁用时不打开面板', async () => {
		const wrapper = mount(() => (
			<ColorPicker disabled size="large" />
		), { attachTo: document.body });

		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.classes()).toContain('is-large');

		await wrapper.trigger('click');
		await flush();

		expect(getPicker()).toBeNull();

		wrapper.unmount();
	});

	it('trigger="click": 打开面板并触发 visible-change', async () => {
		const visible = ref<boolean[]>([]);
		const wrapper = mount(() => (
			<ColorPicker
				modelValue="#FFFF00"
				onVisibleChange={(value: boolean) => visible.value.push(value)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		expect(getPicker()).not.toBeNull();
		expect(document.querySelector('.vc-color-picker-panel')).not.toBeNull();
		expect(document.querySelector('.vc-color-picker-hue-slider')).not.toBeNull();
		expect(visible.value).toEqual([true]);

		wrapper.unmount();
	});

	it('outside click: 外部点击关闭并触发 visible-change=false', async () => {
		const visible = ref<boolean[]>([]);
		const outside = document.createElement('div');
		outside.className = 'outside-area';
		document.body.appendChild(outside);
		const wrapper = mount(() => (
			<ColorPicker
				modelValue="#FFFF00"
				onVisibleChange={(value: boolean) => visible.value.push(value)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		click(outside);
		await sleep(200);
		await flush();

		expect(visible.value).toEqual([true, false]);

		wrapper.unmount();
	});

	it('透传 Popover attrs 并合并 portalClass', async () => {
		const wrapper = mount(() => (
			<ColorPicker
				modelValue="#FFFF00"
				portalClass="custom-color-picker-portal"
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		const portal = document.querySelector('.vc-color-picker-wrapper.custom-color-picker-portal');
		expect(portal).not.toBeNull();

		wrapper.unmount();
	});

	it('confirm: 无初始值时确认默认颜色', async () => {
		const value = ref('');
		const wrapper = mount(() => (
			<ColorPicker
				modelValue={value.value}
				onUpdate:modelValue={(v: string) => (value.value = v)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		click(getPrimaryButton());
		await flush();

		expect(value.value).toBe('#FF0000');

		wrapper.unmount();
	});

	it('clear: 点击清空同步 v-model', async () => {
		const value = ref('#FF0000');
		const wrapper = mount(() => (
			<ColorPicker
				modelValue={value.value}
				onUpdate:modelValue={(v: string) => (value.value = v)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		click(getDefaultButton());
		await flush();

		expect(value.value).toBe('');

		wrapper.unmount();
	});

	it('editable: 输入色值后确认', async () => {
		const value = ref('#FFFF00');
		const wrapper = mount(() => (
			<ColorPicker
				modelValue={value.value}
				onUpdate:modelValue={(v: string) => (value.value = v)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		const input = document.querySelector('.vc-color-picker__value input') as HTMLInputElement;
		input.value = '#00FF00';
		input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
		input.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true }));
		await flush();

		click(getPrimaryButton());
		await flush();

		expect(value.value).toBe('#00FF00');

		wrapper.unmount();
	});

	it('editable=false: 只显示当前色值', async () => {
		const wrapper = mount(() => (
			<ColorPicker modelValue="#FFFF00" editable={false} />
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		const value = document.querySelector('.vc-color-picker__value') as HTMLElement;
		expect(value.textContent).toBe('#FFFF00');
		expect(value.querySelector('input')).toBeNull();

		wrapper.unmount();
	});

	it('alpha: 显示透明度滑块并确认 rgba 默认值', async () => {
		const value = ref('');
		const wrapper = mount(() => (
			<ColorPicker
				alpha
				modelValue={value.value}
				onUpdate:modelValue={(v: string) => (value.value = v)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.vc-color-picker-alpha')).not.toBeNull();

		click(getPrimaryButton());
		await flush();

		expect(value.value).toBe('rgba(255, 0, 0, 1)');

		wrapper.unmount();
	});

	it('color-change: 拖拽面板时只预览, 确认后同步', async () => {
		const value = ref('#FF0000');
		const changes: string[] = [];
		const wrapper = mount(() => (
			<ColorPicker
				modelValue={value.value}
				onUpdate:modelValue={(v: string) => (value.value = v)}
				onColorChange={(v: string) => changes.push(v)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		const panel = document.querySelector('.vc-color-picker-panel') as HTMLElement;
		setRect(panel, { left: 0, top: 0, width: 200, height: 100 });
		mouseDown(panel, { clientX: 100, clientY: 50 });
		mouseUp({ clientX: 100, clientY: 50 });
		await flush();

		expect(changes[changes.length - 1]).toBe('#804040');
		expect(value.value).toBe('#FF0000');

		click(getPrimaryButton());
		await flush();

		expect(value.value).toBe('#804040');

		wrapper.unmount();
	});

	it('color-change: alpha 模式拖拽透明度', async () => {
		const changes: string[] = [];
		const wrapper = mount(() => (
			<ColorPicker
				alpha
				modelValue="#FF0000"
				onColorChange={(v: string) => changes.push(v)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		const slider = document.querySelector('.vc-color-picker-alpha') as HTMLElement;
		const bar = document.querySelector('.vc-color-picker-alpha__bar') as HTMLElement;
		setRect(slider, { left: 0, width: 100 });
		mouseDown(bar, { clientX: 50, clientY: 0 });
		mouseUp({ clientX: 50, clientY: 0 });
		await flush();

		expect(changes[changes.length - 1]).toBe('rgba(255, 0, 0, 0.5)');

		wrapper.unmount();
	});

	it('predefine: 渲染并选择预设颜色', async () => {
		const value = ref('hsva(180, 65%, 20%, 0.5)');
		const colors = [
			'rgba(19, 206, 102, 0.18)',
			'rgb(25, 159, 147)',
			'hsv(250, 54%, 98%)',
			'hsva(180, 65%, 20%, 0.5)'
		];
		const wrapper = mount(() => (
			<ColorPicker
				alpha
				colors={colors}
				modelValue={value.value}
				onUpdate:modelValue={(v: string) => (value.value = v)}
			/>
		), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();

		const blocks = document.querySelectorAll('.vc-color-picker-predefine__block');
		expect(blocks.length).toBe(4);
		expect(blocks[3].classList.contains('is-selected')).toBe(true);

		click(blocks[2]);
		await flush();
		click(getPrimaryButton());
		await flush();

		expect(value.value).toBe('rgba(137, 115, 250, 1)');

		wrapper.unmount();
	});
});

describe('ColorPickerView', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('panel: 拖拽修改饱和度和明度', async () => {
		const changes: any[] = [];
		const wrapper = mount(() => (
			<ColorPickerView
				modelValue="hsv(0, 50%, 50%)"
				format="hsv"
				onChange={(...args: any[]) => changes.push(args)}
			/>
		), { attachTo: document.body });
		await flush();

		const panel = wrapper.find('.vc-color-picker-panel').element;
		mouseDown(panel, { clientX: 10, clientY: 10 });
		mouseUp({ clientX: 10, clientY: 10 });
		await flush();

		setRect(panel, { left: 0, top: 0, width: 200, height: 100 });
		mouseDown(panel, { clientX: 100, clientY: 25 });
		await flush();

		let latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(0, 50%, 75%)');

		mouseMove({ clientX: -10, clientY: -10 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(0, 0%, 100%)');

		mouseMove({ clientX: 300, clientY: 200 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(0, 100%, 0%)');

		mouseUp({ clientX: 150, clientY: 50 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(0, 75%, 50%)');

		wrapper.unmount();
	});

	it('panel: 兼容真实 DOMRect 非枚举坐标属性', async () => {
		const changes: any[] = [];
		const wrapper = mount(() => (
			<ColorPickerView
				modelValue="hsv(0, 50%, 50%)"
				format="hsv"
				onChange={(...args: any[]) => changes.push(args)}
			/>
		), { attachTo: document.body });
		await flush();

		const panel = wrapper.find('.vc-color-picker-panel').element;
		setNonEnumerableRect(panel, { left: 10, top: 20, width: 200, height: 100 });
		mouseDown(panel, { clientX: 110, clientY: 45 });
		await flush();

		const latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(0, 50%, 75%)');

		wrapper.unmount();
	});

	it('hue: 拖拽修改色相', async () => {
		const changes: any[] = [];
		const wrapper = mount(() => (
			<ColorPickerView
				modelValue="#FF0000"
				format="hsv"
				onChange={(...args: any[]) => changes.push(args)}
			/>
		), { attachTo: document.body });
		await flush();

		const slider = wrapper.find('.vc-color-picker-hue-slider').element;
		const bar = wrapper.find('.vc-color-picker-hue-slider__bar').element;
		mouseDown(bar, { clientX: 10, clientY: 0 });
		mouseUp({ clientX: 10, clientY: 0 });
		await flush();

		setRect(slider, { left: 0, width: 360 });
		mouseDown(bar, { clientX: 180, clientY: 0 });
		mouseDown(bar, { clientX: 90, clientY: 0 });
		await flush();

		let latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(180, 100%, 100%)');

		mouseMove({ clientX: -10, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(0, 100%, 100%)');

		mouseMove({ clientX: 500, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(360, 100%, 100%)');

		mouseUp({ clientX: 90, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(90, 100%, 100%)');

		wrapper.unmount();
	});

	it('alpha: 拖拽修改透明度', async () => {
		const changes: any[] = [];
		const wrapper = mount(() => (
			<ColorPickerView
				alpha
				modelValue="#FF0000"
				onChange={(...args: any[]) => changes.push(args)}
			/>
		), { attachTo: document.body });
		await flush();

		const slider = wrapper.find('.vc-color-picker-alpha').element;
		const bar = wrapper.find('.vc-color-picker-alpha__bar').element;
		mouseDown(bar, { clientX: 10, clientY: 0 });
		mouseUp({ clientX: 10, clientY: 0 });
		await flush();

		setRect(slider, { left: 0, width: 100 });
		mouseDown(bar, { clientX: 30, clientY: 0 });
		await flush();

		let latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 0.3)');

		mouseMove({ clientX: -10, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 0)');

		mouseMove({ clientX: 120, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 1)');

		mouseUp({ clientX: 80, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 0.8)');

		wrapper.unmount();
	});

	it('alpha: 支持 touch 拖拽', async () => {
		const changes: any[] = [];
		const wrapper = mount(() => (
			<ColorPickerView
				alpha
				modelValue="#FF0000"
				onChange={(...args: any[]) => changes.push(args)}
			/>
		), { attachTo: document.body });
		await flush();

		const slider = wrapper.find('.vc-color-picker-alpha').element;
		const bar = wrapper.find('.vc-color-picker-alpha__bar').element;
		setRect(slider, { left: 0, width: 100 });

		touch(bar, 'touchstart', 40);
		await flush();
		let latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 0.4)');

		touch(document, 'touchmove', 60);
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 0.6)');

		touch(document, 'touchend', 70);
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 0.7)');

		wrapper.unmount();
	});

	it('recommend: 无自定义 colors 时渲染推荐色', async () => {
		const wrapper = mount(() => (
			<ColorPickerView recommend panel={false} hue={false} />
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-color-picker-panel').exists()).toBe(false);
		expect(wrapper.find('.vc-color-picker-hue-slider').exists()).toBe(false);
		expect(wrapper.findAll('.vc-color-picker-predefine__block').length).toBe(20);

		wrapper.unmount();
	});

	it('props: 响应 modelValue、alpha、format 更新', async () => {
		const wrapper = mount(ColorPickerView, {
			props: {
				modelValue: '#FF0000'
			}
		});

		await wrapper.setProps({
			alpha: true,
			format: 'hsl'
		});
		await flush();

		let events = wrapper.emitted('change')!;
		let latest = events[events.length - 1];
		expect(latest[0]).toBe('hsla(0, 100%, 50%, 1)');

		await wrapper.setProps({
			modelValue: '#00FF00'
		});
		await flush();

		events = wrapper.emitted('change')!;
		latest = events[events.length - 1];
		expect(latest[0]).toBe('hsla(120, 100%, 50%, 1)');

		wrapper.unmount();
	});

	it('Color: 解析多种输入格式', () => {
		const color = new Color({
			enableAlpha: true,
			format: 'rgb',
			value: '#45AA9477'
		});

		expect(color.states.output).toBe('rgba(69, 170, 148, 0.46)');
		expect(color.states.format).toBe('rgb');
		expect(color.states.enableAlpha).toBe(true);

		color.setColor('hsl(181, 100%, 37%)');
		expect(color.get('hue')).toBe(181);
		expect(color.get('alpha')).toBe(100);
		expect(color.states.hue).toBe(181);
		expect(color.states.alpha).toBe(100);

		color.states.enableAlpha = false;
		color.states.format = 'hex';
		expect(color.states.enableAlpha).toBe(false);
		expect(color.states.format).toBe('hex');
		color.setColor('');
		expect(color.states.output).toBe('#FF0000');

		color.setColor('#0F0');
		expect(color.states.output).toBe('#00FF00');

		color.setColor('#GGG');
		expect(color.states.output).toBe('#00FF00');

		color.states.format = 'rgb';
		color.setColor('rgb(0, 0, 255)');
		expect(color.states.output).toBe('rgb(0, 0, 255)');
		expect(color.get('hue')).toBe(240);

		color.setColor('rgb(10, 10, 10)');
		expect(color.get('saturation')).toBe(0);

		color.states.enableAlpha = true;
		color.states.format = 'hsl';
		color.setColor('hsla(120, 40%, 50%, 0.25)');
		expect(color.states.output).toBe('hsla(120, 40%, 50%, 0.25)');

		color.states.format = 'hsv';
		color.setColor('hsva(120, 40%, 94%, 0.5)');
		expect(color.states.output).toBe('hsva(120, 40%, 94%, 0.5)');

		const hslColor = new Color({
			format: 'hsl',
			value: 'rgb(255, 0, 0)'
		});
		expect(hslColor.states.output).toBe('hsl(0, 100%, 50%)');

		color.states.selected = true;
		expect(color.states.selected).toBe(true);

		color.states.selected = false;
		expect(color.states.selected).toBe(false);

		color.states.format = 'rgb';
		color.set({ saturation: 40, value: 94 });
		expect(color.get('saturation')).toBe(40);
		expect(color.get('value')).toBe(94);

		(color as any).set('saturation', '50%');
		expect(color.states.output).toBe('rgba(120, 240, 120, 0.5)');

		(color as any).set('value', '1.0');
		expect(color.states.output).toBe('rgba(128, 255, 128, 0.5)');

		(color as any).set('value', 'invalid');
		expect(color.states.output).toBe('rgba(0, 0, 0, 0.5)');
	});
});

describe('useDraggable', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('element 为空时不绑定事件', async () => {
		const start = ref(0);
		const Component = defineComponent({
			setup() {
				useDraggable(() => null, {
					start: () => start.value++
				});

				return () => <div class="empty-draggable" />;
			}
		});
		const wrapper = mount(Component, { attachTo: document.body });

		await flush();
		mouseDown(wrapper.element, { clientX: 0, clientY: 0 });

		expect(start.value).toBe(0);

		wrapper.unmount();
	});

	it('支持直接元素和非 cancelable touch 事件', async () => {
		const target = document.createElement('div');
		const points: number[] = [];
		document.body.appendChild(target);

		const Component = defineComponent({
			setup() {
				useDraggable(target, {
					start: e => points.push(e.clientX),
					drag: e => points.push(e.clientX),
					end: e => points.push(e.clientX)
				});

				return () => <div class="direct-draggable" />;
			}
		});
		const wrapper = mount(Component, { attachTo: document.body });

		await flush();

		touch(target, 'touchstart', 11, 0, false);
		touch(document, 'touchmove', 12, 0, false);
		touch(document, 'touchend', 13, 0, false);
		await flush();

		expect(points).toEqual([11, 12, 13]);

		wrapper.unmount();
	});
});
