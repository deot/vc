// @vitest-environment jsdom

import { MColorPicker, MColorPickerView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

// 在 HSV 与 HEX 之间往返不失真的颜色
const COLORS = ['#FF0000', '#00FF00', '#0000FF'];

const getPopup = () => document.querySelector('.vcm-color-picker-popup') as HTMLElement | null;
const getBlocks = () => Array.from(document.querySelectorAll<HTMLElement>('.vcm-color-picker-popup .vc-color-picker-predefine__block'));
const getClear = () => document.querySelector('.vcm-color-picker-popup .vcm-color-picker-view__clear') as HTMLElement | null;
const getLeft = () => document.querySelector('.vcm-picker-popup__item.is-left') as HTMLElement | null;
const getRight = () => document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement | null;
const getFooterButtons = () => Array.from(document.querySelectorAll<HTMLElement>('.vcm-picker-popup__footer .vcm-picker-popup__button'));

const clickBlock = async (index: number) => {
	getBlocks()[index].click();
	await flush();
};

describe('MColorPickerView', () => {
	it('桌面端结构 + 标记类 vcm-color-picker-view；顶部取值行，色相条为 MSlider；根节点给出滑块填充色', async () => {
		const wrapper = mount(() => <MColorPickerView modelValue="#5495F6" alpha format="hex" colors />);
		await flush();

		const root = wrapper.find('.vc-color-picker-view');
		expect(root.classes()).toContain('vcm-color-picker-view');
		expect(wrapper.find('.vcm-color-picker-view__value').exists()).toBe(true);
		expect((wrapper.find('.vcm-color-picker-view__input input').element as HTMLInputElement).value).toBe('#5495F6FF');
		expect(wrapper.find('.vc-color-picker-view__hue').classes()).toContain('vcm-slider');
		expect(wrapper.find('.vc-color-picker-view__alpha').classes()).toContain('vcm-slider');

		const style = (root.element as HTMLElement).style;
		expect(style.getPropertyValue('--vc-color-picker-solid-color')).toBe('rgb(84, 149, 246)');
		expect(style.getPropertyValue('--vc-color-picker-hue-color')).toMatch(/^hsl\(216/);
		// jsdom 把 rgba(…, 1) 规范为 rgb(…)
		expect(style.getPropertyValue('--vc-color-picker-current-color')).toMatch(/^rgba?\(84, 149, 246(, 1)?\)$/);
		wrapper.unmount();
	});

	it('输入色值：失焦时按输出格式解析并提交，无法解析时恢复', async () => {
		const value = ref('#5495F6');
		const wrapper = mount(() => <MColorPickerView v-model={value.value} />);
		await flush();

		const input = wrapper.find('.vcm-color-picker-view__input input');
		await input.setValue('f00');
		await input.trigger('blur');
		await flush();
		expect(value.value).toBe('#FF0000');

		await input.setValue('not a color');
		await input.trigger('blur');
		await flush();
		expect(value.value).toBe('#FF0000');
		expect((input.element as HTMLInputElement).value).toBe('#FF0000');
		wrapper.unmount();
	});

	it('editable=false 时为纯文字', async () => {
		const wrapper = mount(() => <MColorPickerView modelValue="#5495F6" editable={false} />);
		await flush();
		expect(wrapper.find('.vcm-color-picker-view__input').exists()).toBe(false);
		expect(wrapper.find('.vcm-color-picker-view__text').text()).toBe('#5495F6');
		wrapper.unmount();
	});

	it('清空：先发出 clear 再提交 nullValue；空值时取值行为空、预设色不标记选中，再选同一颜色也提交', async () => {
		const value = ref<string | null>('#00FF00');
		const onClear = vi.fn();
		const wrapper = mount(() => (
			<MColorPickerView v-model={value.value} colors={COLORS} nullValue={null} onClear={onClear} />
		));
		await flush();
		expect(wrapper.find('.vc-color-picker-predefine__block.is-selected').exists()).toBe(true);

		await wrapper.find('.vcm-color-picker-view__clear').trigger('click');
		await flush();
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(value.value).toBe(null);
		expect(wrapper.find('.vcm-color-picker-view__clear').exists()).toBe(false);
		expect(wrapper.find('.vc-color-picker__swatch').classes()).toContain('is-empty');
		expect(wrapper.find('.vc-color-picker-predefine__block.is-selected').exists()).toBe(false);

		// 色板保持上次的颜色：输入同一颜色，输出不变也要提交
		const input = wrapper.find('.vcm-color-picker-view__input input');
		await input.setValue('#00FF00');
		await input.trigger('blur');
		await flush();
		expect(value.value).toBe('#00FF00');

		// 点选与色板当前相同的预设色，也提交
		await wrapper.find('.vcm-color-picker-view__clear').trigger('click');
		await flush();
		expect(value.value).toBe(null);
		await wrapper.findAll('.vc-color-picker-predefine__block')[1].trigger('click');
		await flush();
		expect(value.value).toBe('#00FF00');
		wrapper.unmount();
	});

	it('clearable=false 时不显示「清空」', async () => {
		const wrapper = mount(() => <MColorPickerView modelValue="#5495F6" clearable={false} />);
		await flush();
		expect(wrapper.find('.vcm-color-picker-view__clear').exists()).toBe(false);
		wrapper.unmount();
	});
});

describe('MColorPicker', () => {
	afterEach(async () => {
		document.body.innerHTML = '';
		await flush();
	});

	it('触发行：色块 + 色值；未选择时为占位文字；formatter 生成文字', async () => {
		const value = ref('');
		const wrapper = mount(() => (
			<MColorPicker v-model={value.value} label="颜色" formatter={(v: string) => v.toLowerCase()} />
		));
		await flush();
		expect(wrapper.find('.vcm-color-picker__extra').exists()).toBe(false);
		expect(wrapper.text()).toContain('请选择');

		value.value = '#5495F6';
		await flush();
		expect(wrapper.find('.vcm-color-picker__extra .vc-color-picker__swatch span').attributes('style')).toContain('background-color');
		expect(wrapper.find('.vcm-color-picker__text').text()).toBe('#5495f6');
		wrapper.unmount();
	});

	it('默认插槽的参数与桌面端相同：{ value, color }', async () => {
		const wrapper = mount(() => (
			<MColorPicker modelValue="#5495F6">
				{{ default: ({ value, color }: any) => <span class="custom">{`${value}|${color}`}</span> }}
			</MColorPicker>
		));
		await flush();
		expect(wrapper.find('.custom').text()).toBe('#5495F6|rgb(84, 149, 246)');
		wrapper.unmount();
	});

	it('默认由「确定」提交：顶部为「取消 / 确定」', async () => {
		const value = ref('#5495F6');
		const wrapper = mount(() => <MColorPicker v-model={value.value} colors={COLORS} />);
		await flush();
		await wrapper.find('.vcm-color-picker').trigger('click');
		await flush();
		expect(getLeft()).toBeTruthy();
		expect(getRight()).toBeTruthy();

		await clickBlock(1);
		expect(value.value).toBe('#5495F6');
		getRight()!.click();
		await flush();
		expect(value.value).toBe('#00FF00');
		wrapper.unmount();
	});

	it('confirm=false：输入（拖动同理）即提交且弹层保持打开；点预设色提交并关闭，只提交一次', async () => {
		const value = ref('');
		const onChange = vi.fn();
		const onColorChange = vi.fn();
		const onOk = vi.fn();
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<MColorPicker
				v-model={value.value}
				colors={COLORS}
				confirm={false}
				onChange={onChange}
				onColorChange={onColorChange}
				onOk={onOk}
				onVisibleChange={onVisibleChange}
			/>
		));
		await flush();

		await wrapper.find('.vcm-color-picker').trigger('click');
		await flush();
		expect(getPopup()).toBeTruthy();
		expect(getLeft()).toBeNull();

		const input = document.querySelector('.vcm-color-picker-popup .vcm-color-picker-view__input input') as HTMLInputElement;
		input.value = '#00F';
		input.dispatchEvent(new Event('input'));
		input.dispatchEvent(new Event('blur'));
		await flush();
		expect(value.value).toBe('#0000FF');
		expect(onOk).not.toHaveBeenCalled();
		expect(onVisibleChange).not.toHaveBeenCalledWith(false);

		await clickBlock(1);
		expect(value.value).toBe('#00FF00');
		expect(onChange).toHaveBeenCalledTimes(2);
		expect(onColorChange).toHaveBeenCalledTimes(2);
		expect(onOk).toHaveBeenCalledWith('#00FF00');
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);
		wrapper.unmount();
	});

	it('confirm=false：点的预设色就是当前颜色时直接关闭，不重复提交', async () => {
		const value = ref('#00FF00');
		const onChange = vi.fn();
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<MColorPicker v-model={value.value} colors={COLORS} confirm={false} onChange={onChange} onVisibleChange={onVisibleChange} />
		));
		await flush();
		await wrapper.find('.vcm-color-picker').trigger('click');
		await flush();

		await clickBlock(1);
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);
		expect(value.value).toBe('#00FF00');
		wrapper.unmount();
	});

	it('confirm=false 时清空：提交 nullValue，弹层保持打开，接着点预设色提交并关闭', async () => {
		const value = ref<string | null>('#5495F6');
		const onClear = vi.fn();
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<MColorPicker
				v-model={value.value}
				nullValue={null}
				colors={COLORS}
				confirm={false}
				onClear={onClear}
				onVisibleChange={onVisibleChange}
			/>
		));
		await flush();
		await wrapper.find('.vcm-color-picker').trigger('click');
		await flush();

		getClear()!.click();
		await flush();
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(value.value).toBe(null);
		expect(onVisibleChange).not.toHaveBeenCalledWith(false);

		await clickBlock(2);
		expect(value.value).toBe('#0000FF');
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);
		wrapper.unmount();
	});

	it('confirm=true：确定才提交，取消丢弃', async () => {
		const value = ref('#5495F6');
		const wrapper = mount(() => <MColorPicker v-model={value.value} colors={COLORS} confirm />);
		await flush();

		await wrapper.find('.vcm-color-picker').trigger('click');
		await flush();
		await clickBlock(1);
		expect(value.value).toBe('#5495F6');
		getLeft()!.click();
		await flush();
		expect(value.value).toBe('#5495F6');

		await sleep(400);
		await wrapper.find('.vcm-color-picker').trigger('click');
		await flush();
		await clickBlock(2);
		getRight()!.click();
		await flush();
		expect(value.value).toBe('#0000FF');
		wrapper.unmount();
	});

	it('disabled 时不打开', async () => {
		const wrapper = mount(() => <MColorPicker modelValue="#5495F6" disabled />);
		await flush();
		await wrapper.find('.vcm-color-picker').trigger('click');
		await flush();
		expect(getPopup()).toBeNull();
		expect(wrapper.find('.vcm-color-picker').classes()).toContain('is-disabled');
		wrapper.unmount();
	});
});

describe('MColorPicker.open', () => {
	it('confirm=true：onOk 收到确定的颜色；没有选色就确定时为默认色', async () => {
		const onOk = vi.fn();
		const leaf = MColorPicker.open({ value: '#5495F6', colors: COLORS, confirm: true, onOk });
		await flush();
		await clickBlock(1);
		expect(onOk).not.toHaveBeenCalled();
		getRight()!.click();
		await flush();
		expect(onOk).toHaveBeenCalledWith('#00FF00');
		leaf.destroy();

		const onOk2 = vi.fn();
		const leaf2 = MColorPicker.open({ confirm: true, onOk: onOk2 });
		await flush();
		getRight()!.click();
		await flush();
		expect(onOk2).toHaveBeenCalledWith('#FF0000');
		leaf2.destroy();
	});

	it('confirm=\'bottom\'：底部为清空 / 确定，取值行不显示清空；清空后确定提交 nullValue', async () => {
		const onOk = vi.fn();
		const leaf = MColorPicker.open({ modelValue: '#5495F6', confirm: 'bottom', nullValue: 'none', onOk });
		await flush();
		expect(getClear()).toBeNull();
		expect(getPopup()!.classList).toContain('is-bottom');

		const [clear, ok] = getFooterButtons();
		clear.click();
		await flush();
		expect(onOk).not.toHaveBeenCalled();
		ok.click();
		await flush();
		expect(onOk).toHaveBeenCalledWith('none');
		leaf.destroy();
	});

	it('confirm=false：点预设色时 onOk 收到颜色（未选择时点与色板相同的颜色也算）', async () => {
		const onOk = vi.fn();
		const leaf = MColorPicker.open({ value: '', colors: COLORS, confirm: false, onOk });
		await flush();
		await clickBlock(0);
		expect(onOk).toHaveBeenCalledTimes(1);
		expect(onOk).toHaveBeenCalledWith('#FF0000');
		leaf.destroy();
	});
});
