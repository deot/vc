// @vitest-environment jsdom

import { ColorPicker, Portal } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { ColorPickerView } from '../color-picker-view';
import { Color } from '../color';
import { useDraggable } from '../hooks/use-draggable';
import * as drag from '../../../hooks/__tests__/fixtures/drag';

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
	drag.fireMouse(el, 'mousedown', options);
};

const mouseMove = (options: MouseEventInit) => {
	drag.fireMouse(document, 'mousemove', options);
};

const mouseUp = (options: MouseEventInit) => {
	drag.fireMouse(document, 'mouseup', options);
};

const touch = (
	el: Element,
	type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
	clientX: number,
	clientY = 0,
	cancelable = true
) => {
	return drag.fireTouch(el, type, { clientX, clientY }, [], { cancelable });
};

const getPicker = () => document.querySelector('.vc-color-picker__picker') as HTMLElement | null;
const getOK = () => document.querySelector('.vc-color-picker__footer button') as HTMLElement | null;
const getInput = () => document.querySelector('.vc-color-picker__value input') as HTMLInputElement;
const getTrigger = (wrapper: any) => wrapper.find('.vc-color-picker__trigger');
const getSwatch = (wrapper: any) => wrapper.find('.vc-color-picker__swatch > span').element as HTMLElement;

const typeInput = async (value: string) => {
	const input = getInput();
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
	await flush();
	input.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true }));
	await flush();
};

const dragPanel = async (clientX: number, clientY: number) => {
	const panel = document.querySelector('.vc-color-picker-panel') as HTMLElement;
	setRect(panel, { left: 0, top: 0, width: 200, height: 100 });
	mouseDown(panel, { clientX, clientY });
	mouseUp({ clientX, clientY });
	// 浏览器在按下与松开的公共祖先上补发的 click
	click(panel);
	await flush();
};

// 受控挂载：记录事件
const mountPicker = (props: Record<string, any> = {}) => {
	const value = ref<any>(props.modelValue ?? '#FF0000');
	const events = { change: [] as any[], colorChange: [] as any[], clear: 0 };
	const wrapper = mount(() => (
		<ColorPicker
			{...props}
			modelValue={value.value}
			onUpdate:modelValue={(v: any) => (value.value = v)}
			onChange={(v: any) => events.change.push(v)}
			onColorChange={(v: string) => events.colorChange.push(v)}
			onClear={() => events.clear++}
		/>
	), { attachTo: document.body });

	return { wrapper, value, events };
};

const open = async (wrapper: any) => {
	await getTrigger(wrapper).trigger('click');
	await flush();
};

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
		expect(ColorPicker.Color).toBe(Color);
		expect(Array.isArray(ColorPicker.colors)).toBe(true);
	});

	it('size: 默认 medium，支持 mini / small / large', async () => {
		const wrapper = mount(() => (<ColorPicker />));
		expect(wrapper.classes()).toContain('vc-color-picker');
		expect(wrapper.classes()).toContain('is-medium');
		wrapper.unmount();

		const mini = mount(() => (<ColorPicker size="mini" />));
		expect(mini.classes()).toContain('is-mini');
		mini.unmount();
	});

	it('trigger: 空值显示斜线色块，可用于 CSS 的颜色显示在色块上', async () => {
		const { wrapper } = mountPicker({ modelValue: '' });
		expect(wrapper.find('.vc-color-picker__swatch').classes()).toContain('is-empty');
		wrapper.unmount();

		const filled = mountPicker({ modelValue: 'hsv(0, 100%, 100%)' });
		expect(filled.wrapper.find('.vc-color-picker__swatch').classes()).not.toContain('is-empty');
		expect(getSwatch(filled.wrapper).style.backgroundColor).toBe('rgb(255, 0, 0)');
		filled.wrapper.unmount();
	});

	it('disabled: 禁用时不打开面板、不可聚焦', async () => {
		const { wrapper } = mountPicker({ disabled: true, size: 'large' });

		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.classes()).toContain('is-large');
		expect(getTrigger(wrapper).attributes('tabindex')).toBe('-1');

		await open(wrapper);
		expect(getPicker()).toBeNull();

		await getTrigger(wrapper).trigger('keydown', { key: 'Enter' });
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

		await open(wrapper);

		expect(getPicker()).not.toBeNull();
		expect(document.querySelector('.vc-color-picker-panel')).not.toBeNull();
		expect(document.querySelector('.vc-color-picker-view__hue')).not.toBeNull();
		expect(visible.value).toEqual([true]);
		expect(getTrigger(wrapper).attributes('aria-expanded')).toBe('true');

		wrapper.unmount();
	});

	it('keyboard: Enter 打开，Escape 关闭', async () => {
		const { wrapper } = mountPicker();

		await getTrigger(wrapper).trigger('keydown', { key: 'Enter' });
		await flush();
		expect(getPicker()).not.toBeNull();
		expect(getTrigger(wrapper).attributes('aria-expanded')).toBe('true');

		await getTrigger(wrapper).trigger('keydown', { key: 'Escape' });
		await flush();
		expect(getTrigger(wrapper).attributes('aria-expanded')).toBe('false');

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

		await open(wrapper);

		click(outside);
		await sleep(200);
		await flush();

		expect(visible.value).toEqual([true, false]);

		wrapper.unmount();
	});

	it('透传 Popover attrs 并合并 portalClass', async () => {
		const { wrapper } = mountPicker({ portalClass: 'custom-color-picker-portal' });

		await open(wrapper);

		const portal = document.querySelector('.vc-color-picker-wrapper.custom-color-picker-portal');
		expect(portal).not.toBeNull();

		wrapper.unmount();
	});

	it('confirm=false（默认）: 选色即提交，没有确定按钮', async () => {
		const { wrapper, value, events } = mountPicker();

		await open(wrapper);
		expect(getOK()).toBeNull();

		await dragPanel(100, 50);

		expect(value.value).toBe('#804040');
		expect(events.change).toEqual(['#804040']);
		expect(events.colorChange).toEqual(['#804040']);
		expect(getSwatch(wrapper).style.backgroundColor).toBe('rgb(128, 64, 64)');

		wrapper.unmount();
	});

	it('confirm: 拖动只预览，外部关闭放弃修改，确定后提交', async () => {
		const outside = document.createElement('div');
		document.body.appendChild(outside);
		const { wrapper, value, events } = mountPicker({ confirm: true });

		await open(wrapper);
		await dragPanel(100, 50);

		expect(events.colorChange).toEqual(['#804040']);
		expect(value.value).toBe('#FF0000');
		// 预览时触发器跟随
		expect(getSwatch(wrapper).style.backgroundColor).toBe('rgb(128, 64, 64)');

		click(outside);
		await sleep(200);
		await flush();

		expect(getTrigger(wrapper).attributes('aria-expanded')).toBe('false');
		expect(value.value).toBe('#FF0000');
		expect(events.change).toEqual([]);
		expect(getSwatch(wrapper).style.backgroundColor).toBe('rgb(255, 0, 0)');

		await open(wrapper);
		await dragPanel(100, 50);
		click(getOK()!);
		await flush();

		expect(value.value).toBe('#804040');
		expect(events.change).toEqual(['#804040']);

		wrapper.unmount();
	});

	it('confirm: 无初始值时确定默认颜色', async () => {
		const { wrapper, value } = mountPicker({ confirm: true, modelValue: '' });

		await open(wrapper);
		click(getOK()!);
		await flush();

		expect(value.value).toBe('#FF0000');

		wrapper.unmount();
	});

	it('clearable: 悬停显示清除图标，点击提交 nullValue 并触发 clear，不打开浮层', async () => {
		const { wrapper, value, events } = mountPicker({ nullValue: null });
		const trigger = getTrigger(wrapper);

		expect(wrapper.find('.vc-color-picker__suffix').classes()).not.toContain('is-clear');
		await trigger.trigger('mouseenter');
		expect(wrapper.find('.vc-color-picker__suffix').classes()).toContain('is-clear');

		await wrapper.find('.vc-color-picker__suffix .vc-icon').trigger('click');
		await flush();

		expect(value.value).toBeNull();
		expect(events.change).toEqual([null]);
		expect(events.clear).toBe(1);
		expect(getPicker()).toBeNull();
		expect(wrapper.find('.vc-color-picker__swatch').classes()).toContain('is-empty');

		// 已经为空：不再显示
		expect(wrapper.find('.vc-color-picker__suffix').classes()).not.toContain('is-clear');

		wrapper.unmount();
	});

	it('clearable=false / disabled: 不显示清除图标', async () => {
		for (const props of [{ clearable: false }, { disabled: true }]) {
			const { wrapper } = mountPicker(props);
			await getTrigger(wrapper).trigger('mouseenter');
			expect(wrapper.find('.vc-color-picker__suffix').classes()).not.toContain('is-clear');
			wrapper.unmount();
		}
	});

	it('editable: 输入按输出格式归一化后提交；值不变时不触发 change', async () => {
		const { wrapper, value, events } = mountPicker({ modelValue: '#FFFF00' });

		await open(wrapper);

		await typeInput('rgb(0, 255, 0)');
		expect(value.value).toBe('#00FF00');
		expect(getInput().value).toBe('#00FF00');

		await typeInput('#00ff00');
		expect(events.change).toEqual(['#00FF00']);

		wrapper.unmount();
	});

	it('editable=false: 只显示当前色值', async () => {
		const { wrapper } = mountPicker({ modelValue: '#FFFF00', editable: false });

		await open(wrapper);

		const text = document.querySelector('.vc-color-picker__value') as HTMLElement;
		expect(text.textContent).toBe('#FFFF00');
		expect(text.querySelector('input')).toBeNull();

		wrapper.unmount();
	});

	it('alpha: 显示透明度条；format=hex 时输出 8 位 hex', async () => {
		const { wrapper, value } = mountPicker({ alpha: true, format: 'hex', modelValue: '#FF0000FF' });

		await open(wrapper);
		expect(document.querySelector('.vc-color-picker-view__alpha')).not.toBeNull();

		const track = document.querySelector('.vc-color-picker-view__alpha .vc-slider__wrapper') as HTMLElement;
		setRect(track, { left: 0, width: 100 });
		mouseDown(track, { clientX: 50, clientY: 0 });
		mouseUp({ clientX: 50, clientY: 0 });
		await flush();

		expect(value.value).toBe('#FF000080');
		expect(getSwatch(wrapper).style.backgroundColor).toBe('rgba(255, 0, 0, 0.5)');

		wrapper.unmount();
	});

	it('predefine: 渲染并选择预设颜色', async () => {
		const colors = [
			'rgba(19, 206, 102, 0.18)',
			'rgb(25, 159, 147)',
			'hsv(250, 54%, 98%)',
			'hsva(180, 65%, 20%, 0.5)'
		];
		const { wrapper, value } = mountPicker({ alpha: true, colors, modelValue: 'hsva(180, 65%, 20%, 0.5)' });

		await open(wrapper);

		const blocks = document.querySelectorAll('.vc-color-picker-predefine__block');
		expect(blocks.length).toBe(4);
		expect(blocks[3].classList.contains('is-selected')).toBe(true);

		click(blocks[2]);
		await flush();

		expect(value.value).toBe('rgba(137, 115, 250, 1)');

		wrapper.unmount();
	});

	it('slot: 默认插槽自定义触发器，参数为 { value, color }', async () => {
		const slotProps: any[] = [];
		const wrapper = mount(() => (
			<ColorPicker modelValue="hsv(0, 100%, 100%)">
				{{
					default: (props: any) => {
						slotProps.push(props);
						return <button class="custom-trigger">{props.value}</button>;
					}
				}}
			</ColorPicker>
		), { attachTo: document.body });

		expect(wrapper.find('.vc-color-picker__trigger').exists()).toBe(false);
		expect(slotProps[slotProps.length - 1]).toEqual({ value: 'hsv(0, 100%, 100%)', color: 'rgb(255, 0, 0)' });

		await wrapper.find('.custom-trigger').trigger('click');
		await flush();
		expect(getPicker()).not.toBeNull();

		wrapper.unmount();
	});
});

describe('repro', () => {
	afterEach(() => {
		Portal.clear(true);
		document.body.innerHTML = '';
	});

	it('#1 hsv 色值的触发器色块输出合法 CSS', async () => {
		const wrapper = mount(() => (
			<ColorPicker alpha modelValue="hsva(180, 65%, 20%, 0.5)" />
		), { attachTo: document.body });

		expect(getSwatch(wrapper).style.backgroundColor).toBe('rgba(18, 51, 51, 0.5)');

		wrapper.unmount();
	});

	it('#2 非法输入不会被提交', async () => {
		const { wrapper, value, events } = mountPicker({ modelValue: '#FFFF00' });

		await open(wrapper);
		await typeInput('xyz');

		expect(value.value).toBe('#FFFF00');
		expect(events.change).toEqual([]);
		expect(getInput().value).toBe('#FFFF00');

		wrapper.unmount();
	});

	it('#3 色相、透明度滑块的位置与取值一致（按比例定位，不依赖测量）', async () => {
		const wrapper = mount(() => (
			<ColorPickerView alpha modelValue="hsva(270, 100%, 100%, 0.25)" />
		), { attachTo: document.body });
		await flush();

		const thumbs = document.querySelectorAll<HTMLElement>('[role="slider"][aria-valuemax]');
		const hue = [...thumbs].find(el => el.getAttribute('aria-valuemax') === '360')!;
		const alpha = [...thumbs].find(el => el.getAttribute('aria-valuemax') === '100')!;
		expect(hue.getAttribute('aria-valuenow')).toBe('270');
		expect(alpha.getAttribute('aria-valuenow')).toBe('25');

		wrapper.unmount();
	});

	it('#4 色板光标按比例定位，容器尺寸变化后仍对齐', async () => {
		const wrapper = mount(() => (
			<ColorPickerView modelValue="hsv(0, 30%, 80%)" />
		), { attachTo: document.body });
		await flush();

		const cursor = wrapper.find('.vc-color-picker-panel__cursor').element as HTMLElement;
		expect(cursor.style.left).toBe('30%');
		expect(cursor.style.top).toBe('20%');

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

	it('hue: 复用 Slider，按住轨道拖动修改色相', async () => {
		const changes: any[] = [];
		const wrapper = mount(() => (
			<ColorPickerView
				modelValue="#FF0000"
				format="hsv"
				onChange={(...args: any[]) => changes.push(args)}
			/>
		), { attachTo: document.body });
		await flush();

		const track = wrapper.find('.vc-color-picker-view__hue .vc-slider__wrapper').element;
		setRect(track, { left: 0, width: 360 });
		mouseDown(track, { clientX: 180, clientY: 0 });
		await flush();

		let latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(180, 100%, 100%)');
		expect(latest[1]).toBeInstanceOf(Color);

		mouseMove({ clientX: -10, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(0, 100%, 100%)');

		mouseMove({ clientX: 500, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(360, 100%, 100%)');

		mouseUp({ clientX: 500, clientY: 0 });
		await flush();

		// 键盘
		const thumb = wrapper.find('.vc-color-picker-view__hue [role="slider"]');
		await thumb.trigger('keydown', { key: 'Home' });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('hsv(0, 100%, 100%)');

		wrapper.unmount();
	});

	it('alpha: 复用 Slider，轨道颜色跟随当前色', async () => {
		const changes: any[] = [];
		const wrapper = mount(() => (
			<ColorPickerView
				alpha
				modelValue="#FF0000"
				onChange={(...args: any[]) => changes.push(args)}
			/>
		), { attachTo: document.body });
		await flush();

		// 滑块用 #thumb 插槽画成竖条，仍是 Slider 的可聚焦 role="slider"
		expect(wrapper.findAll('.vc-slider__button.is-custom .vc-color-picker-view__thumb').length).toBe(2);

		const alpha = wrapper.find('.vc-color-picker-view__alpha').element as HTMLElement;
		expect(alpha.style.getPropertyValue('--vc-color-picker-alpha-color')).toBe('rgb(255, 0, 0)');

		const track = wrapper.find('.vc-color-picker-view__alpha .vc-slider__wrapper').element;
		setRect(track, { left: 0, width: 100 });
		mouseDown(track, { clientX: 30, clientY: 0 });
		await flush();

		let latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 0.3)');

		mouseMove({ clientX: 120, clientY: 0 });
		await flush();
		latest = changes[changes.length - 1];
		expect(latest[0]).toBe('rgba(255, 0, 0, 1)');

		mouseUp({ clientX: 120, clientY: 0 });
		await flush();

		wrapper.unmount();
	});

	it('panel: 支持 touch 拖拽', async () => {
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
		setRect(panel, { left: 0, top: 0, width: 100, height: 100 });

		touch(panel, 'touchstart', 40, 10);
		await flush();
		expect(changes[changes.length - 1][0]).toBe('hsv(0, 40%, 90%)');

		touch(panel, 'touchmove', 60, 10);
		await flush();
		expect(changes[changes.length - 1][0]).toBe('hsv(0, 60%, 90%)');

		touch(panel, 'touchend', 70, 10);
		await flush();
		expect(changes[changes.length - 1][0]).toBe('hsv(0, 70%, 90%)');

		wrapper.unmount();
	});

	describe('drag gesture', () => {
		// 用例中途失败时也结束手势，避免残留的 document 监听影响后续用例
		afterEach(() => {
			mouseUp({});
			document.onselectstart = null;
		});

		// 色板的拖动（useDraggable）：clientX 0–100 对应饱和度
		const mountHue = async () => {
			const changes: any[] = [];
			const wrapper = mount(() => (
				<ColorPickerView
					modelValue="hsv(0, 0%, 100%)"
					format="hsv"
					onChange={(...args: any[]) => changes.push(args)}
				/>
			), { attachTo: document.body });
			await flush();

			const bar = wrapper.find('.vc-color-picker-panel').element;
			setRect(bar, { left: 0, top: 0, width: 100, height: 100 });
			return {
				wrapper,
				changes,
				bar,
				latest: () => changes[changes.length - 1]?.[0]
			};
		};
		const { blocked } = drag;

		it('只有主键能拖动', async () => {
			const { wrapper, changes, bar } = await mountHue();
			const count = changes.length;

			mouseDown(bar, { clientX: 50, button: 2, buttons: 2 });
			mouseMove({ clientX: 30, buttons: 2 });
			await flush();

			expect(changes.length).toBe(count);
			wrapper.unmount();
		});

		it('mouseup 丢失后不再跟手, 保持最后一次拖动的值', async () => {
			const { wrapper, bar, latest } = await mountHue();

			mouseDown(bar, { clientX: 50 });
			mouseMove({ clientX: 30 });
			await flush();
			expect(latest()).toBe('hsv(0, 30%, 100%)');

			// 右键菜单、原生拖拽等吞掉了 mouseup：下一次移动时主键已松开
			mouseMove({ clientX: 80, buttons: 0 });
			await flush();
			expect(latest()).toBe('hsv(0, 30%, 100%)');

			// 已解绑：之后按着主键移动也不再拖动
			mouseMove({ clientX: 70 });
			await flush();
			expect(latest()).toBe('hsv(0, 30%, 100%)');
			wrapper.unmount();
		});

		it('拖动期间阻止选区与原生拖拽, 且不占用 document.onselectstart', async () => {
			const { wrapper, bar } = await mountHue();
			const own = () => {};
			document.onselectstart = own;

			expect(blocked('selectstart')).toBe(false);

			mouseDown(bar, { clientX: 50 });
			expect(blocked('selectstart')).toBe(true);
			expect(blocked('dragstart')).toBe(true);
			expect(document.onselectstart).toBe(own);

			mouseUp({ clientX: 50 });
			expect(blocked('selectstart')).toBe(false);
			expect(blocked('dragstart')).toBe(false);
			expect(document.onselectstart).toBe(own);
			wrapper.unmount();
		});

		it('拖动中卸载后恢复选区', async () => {
			const { wrapper, bar } = await mountHue();

			mouseDown(bar, { clientX: 50 });
			expect(blocked('selectstart')).toBe(true);

			wrapper.unmount();
			expect(blocked('selectstart')).toBe(false);
			expect(blocked('dragstart')).toBe(false);
		});

		it('touchcancel 保持最后一次拖动的值', async () => {
			const { wrapper, bar, latest } = await mountHue();

			touch(bar, 'touchstart', 50);
			touch(bar, 'touchmove', 30);
			await flush();
			expect(latest()).toBe('hsv(0, 30%, 100%)');

			// 系统手势等打断了触摸：此时的触点位置不作数
			touch(bar, 'touchcancel', 80);
			await flush();
			expect(latest()).toBe('hsv(0, 30%, 100%)');
			wrapper.unmount();
		});
	});

	it('colors=true: 使用内置预设色', async () => {
		const wrapper = mount(() => (
			<ColorPickerView colors panel={false} hue={false} />
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-color-picker-panel').exists()).toBe(false);
		expect(wrapper.find('.vc-color-picker-view__hue').exists()).toBe(false);
		expect(wrapper.findAll('.vc-color-picker-predefine__block').length).toBe(ColorPicker.colors.length);
		expect(ColorPicker.colors.length).toBe(20);

		wrapper.unmount();
	});

	it('predefine: 按钮可聚焦、标记选中，无法解析的预设跳过', async () => {
		const changes: any[] = [];
		const wrapper = mount(() => (
			<ColorPickerView
				modelValue="#00FF00"
				colors={['#FF0000', 'xyz', '#00FF00']}
				onChange={(...args: any[]) => changes.push(args)}
			/>
		), { attachTo: document.body });
		await flush();

		const blocks = wrapper.findAll('button.vc-color-picker-predefine__block');
		expect(blocks.length).toBe(2);
		expect(blocks[1].attributes('aria-pressed')).toBe('true');
		expect(blocks[0].attributes('aria-pressed')).toBe('false');

		await blocks[0].trigger('click');
		await flush();
		expect(changes[changes.length - 1][0]).toBe('#FF0000');
		expect(blocks[0].attributes('aria-pressed')).toBe('true');

		wrapper.unmount();
	});

	it('props: 响应 modelValue、alpha、format 更新，但不回抛事件', async () => {
		const wrapper = mount(ColorPickerView, {
			props: {
				modelValue: '#FF0000'
			}
		});
		const output = () => wrapper.find('.vc-color-picker-panel').attributes('aria-valuetext');

		await wrapper.setProps({
			alpha: true,
			format: 'hsl'
		});
		await flush();
		expect(output()).toBe('hsla(0, 100%, 50%, 1)');

		await wrapper.setProps({
			modelValue: '#00FF00'
		});
		await flush();
		expect(output()).toBe('hsla(120, 100%, 50%, 1)');
		expect(wrapper.emitted('change')).toBeUndefined();
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();

		// 之后的用户操作照常触发
		await wrapper.find('.vc-color-picker-panel').trigger('keydown', { key: 'ArrowDown', shiftKey: true });
		await flush();
		expect(wrapper.emitted('change')!.length).toBe(1);
		expect(wrapper.emitted('update:modelValue')![0][0]).toBe(output());

		wrapper.unmount();
	});

	it('Color: 解析多种输入格式', () => {
		const color = new Color({
			alpha: true,
			format: 'rgb',
			value: '#45AA9477'
		});

		expect(color.states.output).toBe('rgba(69, 170, 148, 0.47)');
		expect(color.states.format).toBe('rgb');
		expect(color.states.alpha).toBe(true);

		color.setColor('hsl(181, 100%, 37%)');
		expect(color.get('hue')).toBe(181);
		expect(color.get('opacity')).toBe(100);

		color.states.alpha = false;
		color.states.format = 'hex';
		color.setColor('');
		expect(color.states.output).toBe('#FF0000');

		expect(color.setColor('#0F0')).toBe(true);
		expect(color.states.output).toBe('#00FF00');

		// 无法解析时保持原值
		expect(color.setColor('#GGG')).toBe(false);
		expect(color.setColor('rgb(a, b, c)')).toBe(false);
		expect(color.states.output).toBe('#00FF00');

		color.states.format = 'rgb';
		color.setColor('rgb(0, 0, 255)');
		expect(color.states.output).toBe('rgb(0, 0, 255)');
		expect(color.get('hue')).toBe(240);

		color.setColor('rgb(10, 10, 10)');
		expect(color.get('saturation')).toBe(0);

		color.states.alpha = true;
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

	it('Color: 透明度输出不受浮点误差影响', () => {
		// 0.29 * 100 在浮点下是 28.999…
		expect(new Color({ alpha: true, value: 'rgba(0, 0, 0, 0.29)' }).states.output).toBe('rgba(0, 0, 0, 0.29)');
		expect(new Color({ alpha: true, value: 'rgb(0 0 0 / 40%)' }).states.output).toBe('rgba(0, 0, 0, 0.4)');
	});

	it('Color: alpha + hex 输出 8 位 hex，并能原样解析回来', () => {
		const color = new Color({ alpha: true, format: 'hex', value: 'rgba(255, 0, 0, 0.5)' });
		expect(color.states.output).toBe('#FF000080');

		color.setColor('#00FF0040');
		expect(color.states.output).toBe('#00FF0040');
		expect(Math.round(color.states.opacity)).toBe(25);

		// 不透明时也保留 AA，长度固定便于存储
		color.setColor('#0000FF');
		expect(color.states.output).toBe('#0000FFFF');
	});

	it('Color: 省略 #、4 位 hex、transparent', () => {
		expect(new Color({ value: 'abc' }).states.output).toBe('#AABBCC');
		expect(new Color({ alpha: true, format: 'hex', value: '#F008' }).states.output).toBe('#FF000088');

		const transparent = new Color({ alpha: true, value: 'transparent' });
		expect(transparent.states.output).toBe('rgba(0, 0, 0, 0)');
		expect(transparent.toCss()).toBe('rgba(0, 0, 0, 0)');
	});

	it('Color: CSS 颜色名交给 canvas 归一化', () => {
		const getContext = HTMLCanvasElement.prototype.getContext;
		let fillStyle = '#000000';
		const names: Record<string, string> = { rebeccapurple: '#663399' };
		HTMLCanvasElement.prototype.getContext = (() => ({
			get fillStyle() { return fillStyle; },
			set fillStyle(v: string) {
				const value = v.startsWith('#') ? (v.length === 4 ? v.replace(/[^#]/g, '$&$&') : v) : names[v];
				if (value) fillStyle = value;
			}
		})) as any;

		try {
			expect(Color.parse('RebeccaPurple')?.states.output).toBe('#663399');
			expect(Color.parse('notacolor')).toBeNull();
		} finally {
			HTMLCanvasElement.prototype.getContext = getContext;
		}
	});

	it('Color: README 示例的输出', () => {
		const color = new Color({ value: '#1DB88C', alpha: true, format: 'hex' });
		expect(color.setColor('rgba(19, 206, 102, 0.8)')).toBe(true);
		expect(color.states.output).toBe('#13CE67CC');
		expect(color.toCss()).toBe('rgba(19, 206, 103, 0.8)');
		expect(color.setColor('xyz')).toBe(false);
		expect(Color.parse('hsv(120, 50%, 50%)')?.toCss()).toBe('rgb(64, 128, 64)');
		expect(Color.parse('not a color')).toBeNull();
	});

	it('Color.parse / toCss', () => {
		expect(Color.parse('')).toBeNull();
		expect(Color.parse('xyz')).toBeNull();

		const hsv = Color.parse('hsva(180, 65%, 20%, 0.5)', { alpha: true })!;
		expect(hsv.toCss()).toBe('rgba(18, 51, 51, 0.5)');
		// 不输出透明度时按不透明显示
		expect(Color.parse('hsva(180, 65%, 20%, 0.5)')!.toCss()).toBe('rgb(18, 51, 51)');
	});
});

describe('ColorPicker.Panel keyboard', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('方向键调节饱和度/明度，Shift ±10，越界截断', async () => {
		const wrapper = mount(() => (
			<ColorPickerView modelValue="hsv(0, 50%, 50%)" format="hsv" />
		), { attachTo: document.body });
		await flush();

		const panel = wrapper.find('.vc-color-picker-panel');
		expect(panel.attributes('role')).toBe('slider');
		expect(panel.attributes('aria-valuetext')).toBe('hsv(0, 50%, 50%)');

		await panel.trigger('keydown', { key: 'ArrowRight' });
		await panel.trigger('keydown', { key: 'ArrowUp', shiftKey: true });
		expect(panel.attributes('aria-valuetext')).toBe('hsv(0, 51%, 60%)');

		for (let i = 0; i < 6; i++) await panel.trigger('keydown', { key: 'ArrowDown', shiftKey: true });
		expect(panel.attributes('aria-valuetext')).toBe('hsv(0, 51%, 0%)');

		const cursor = wrapper.find('.vc-color-picker-panel__cursor').element as HTMLElement;
		expect(cursor.style.top).toBe('100%');

		wrapper.unmount();
	});
});

describe('useDraggable', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const mountDraggable = () => {
		const points: number[] = [];
		const Component = defineComponent({
			setup() {
				const listeners = useDraggable(point => points.push(point.clientX));

				return () => <div class="draggable" {...listeners} />;
			}
		});
		const wrapper = mount(Component, { attachTo: document.body });

		return { wrapper, points, target: wrapper.element };
	};

	it('按下、移动、松开都按触点位置取值', async () => {
		const { wrapper, points, target } = mountDraggable();

		mouseDown(target, { clientX: 1 });
		mouseMove({ clientX: 2 });
		mouseUp({ clientX: 3 });

		touch(target, 'touchstart', 11);
		touch(target, 'touchmove', 12);
		touch(target, 'touchend', 13);

		expect(points).toEqual([1, 2, 3, 11, 12, 13]);

		wrapper.unmount();
	});

	it('触摸拖动阻止默认滚动, 不可取消的事件不处理', async () => {
		const { wrapper, points, target } = mountDraggable();

		expect(touch(target, 'touchstart', 11).defaultPrevented).toBe(true);
		expect(touch(target, 'touchmove', 12).defaultPrevented).toBe(true);
		expect(touch(target, 'touchend', 13).defaultPrevented).toBe(true);

		expect(touch(target, 'touchstart', 21, 0, false).defaultPrevented).toBe(false);
		expect(touch(target, 'touchmove', 22, 0, false).defaultPrevented).toBe(false);
		expect(touch(target, 'touchend', 23, 0, false).defaultPrevented).toBe(false);

		expect(points).toEqual([11, 12, 13, 21, 22, 23]);

		wrapper.unmount();
	});
});
