// @vitest-environment jsdom

import { vi } from 'vitest';
import { Rate } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

// 默认使用 character 渲染, 避免默认 star 图标反复注册 IconManager 监听导致跨用例污染
const CHAR = '★';

// 星星宽 16、间距 8：第 i 颗（从 0 起）占 [24i, 24i + 16]
const SIZE = 16;
const GAP = 8;
const left = (index: number) => index * (SIZE + GAP);

const layout = (wrapper: VueWrapper<any>) => {
	wrapper.findAll('.vc-rate__star').forEach((star, index) => {
		(star.element as HTMLElement).getBoundingClientRect = () => ({
			left: left(index),
			right: left(index) + SIZE,
			width: SIZE,
			top: 0,
			bottom: SIZE,
			height: SIZE,
			x: left(index),
			y: 0,
			toJSON: () => ({})
		});
	});
};

const stars = (wrapper: VueWrapper<any>) => wrapper.find('.vc-rate__stars');
const selected = (wrapper: VueWrapper<any>) => wrapper.findAll('.vc-rate__star.is-select').length;
const halves = (wrapper: VueWrapper<any>) => wrapper.findAll('.vc-rate__star.is-half').length;

// 鼠标按下在星星区域，松开在 document 上（useDrag 的跟踪方式）
const press = async (wrapper: VueWrapper<any>, x: number, upX = x) => {
	layout(wrapper);
	await stars(wrapper).trigger('mousedown', { button: 0, buttons: 1, clientX: x });
	if (upX !== x) {
		document.dispatchEvent(new MouseEvent('mousemove', { buttons: 1, clientX: upX }));
	}
	document.dispatchEvent(new MouseEvent('mouseup', { button: 0, clientX: upX }));
	await nextTick();
};

const touch = (type: string, x: number) => {
	const point = { identifier: 1, clientX: x, clientY: 0 };
	const event = new Event(type, { bubbles: true, cancelable: true }) as any;
	event.touches = type === 'touchend' ? [] : [point];
	event.changedTouches = [point];
	return event as TouchEvent;
};

const mountRate = (props: Record<string, any> = {}) => {
	const onChange = vi.fn();
	const onUpdate = vi.fn();
	const wrapper = mount(Rate, {
		props: { 'character': CHAR, onChange, 'onUpdate:modelValue': onUpdate, ...props },
		attachTo: document.body
	});
	return { wrapper, onChange, onUpdate };
};

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Rate).toBe('object');
	});

	it('create: 结构与无障碍属性', () => {
		const { wrapper } = mountRate({ modelValue: 2, count: 4 });

		expect(wrapper.element.tagName).toBe('DIV');
		expect(wrapper.classes()).toEqual(['vc-rate']);
		expect(wrapper.attributes()).toMatchObject({
			'role': 'slider',
			'tabindex': '0',
			'aria-valuemin': '0',
			'aria-valuemax': '4',
			'aria-valuenow': '2',
			'aria-disabled': 'false',
			'aria-readonly': 'false'
		});
		wrapper.unmount();
	});

	it('count: 渲染对应数量的星星', () => {
		const { wrapper } = mountRate({ count: 7 });

		expect(wrapper.findAll('.vc-rate__star').length).toBe(7);
		wrapper.unmount();
	});

	it('modelValue: 高亮已选中的星星', () => {
		const { wrapper } = mountRate({ modelValue: 3 });

		expect(selected(wrapper)).toBe(3);
		wrapper.unmount();
	});

	it('half: 半星只在该星上渲染覆盖层', () => {
		const { wrapper } = mountRate({ modelValue: 3.5, half: true });

		expect(selected(wrapper)).toBe(3);
		expect(halves(wrapper)).toBe(1);
		expect(wrapper.findAll('.vc-rate__star')[3].find('.vc-rate__icon.is-overlay').exists()).toBe(true);
		expect(wrapper.findAll('.vc-rate__icon.is-overlay').length).toBe(1);
		wrapper.unmount();
	});

	it('half 关闭时：不渲染覆盖层，小数分值不显示半星', () => {
		const { wrapper } = mountRate({ modelValue: 3.5 });

		expect(selected(wrapper)).toBe(3);
		expect(wrapper.find('.vc-rate__icon.is-overlay').exists()).toBe(false);
		expect(wrapper.findAll('.vc-rate__icon').length).toBe(5);
		wrapper.unmount();
	});

	it('character: 使用自定义字符替代图标', () => {
		const { wrapper } = mountRate({ character: '好', count: 3 });

		const spans = wrapper.findAll('.vc-rate__icon span');
		expect(spans.length).toBe(3);
		expect(spans[0].text()).toBe('好');
		wrapper.unmount();
	});

	it('character 插槽：按序号渲染，优先于属性', () => {
		const wrapper = mount(() => (
			<Rate character="好" count={3} v-slots={{ character: ({ index }: any) => (<i class="face">{index}</i>) }} />
		));

		expect(wrapper.findAll('.face').map(v => v.text())).toEqual(['0', '1', '2']);
		expect(wrapper.text()).not.toContain('好');
	});

	it('默认使用 Icon 图标', () => {
		const wrapper = mount(() => (<Rate count={2} icon="star" />));

		expect(wrapper.find('.vc-rate__icon .vc-icon').exists()).toBe(true);
	});

	it('color: 写在根节点的 --vc-rate-color 上，运行时可更新', async () => {
		const { wrapper } = mountRate({ modelValue: 1.5, half: true, color: 'red' });

		expect(wrapper.attributes('style')).toContain('--vc-rate-color: red');
		await wrapper.setProps({ color: 'blue' });
		expect(wrapper.attributes('style')).toContain('--vc-rate-color: blue');
		expect(wrapper.find('.vc-rate__star').attributes('style') || '').not.toContain('color');

		await wrapper.setProps({ color: undefined });
		expect(wrapper.attributes('style')).toBeUndefined();
		wrapper.unmount();
	});

	it('iconStyle: 作用于每颗星', () => {
		const { wrapper } = mountRate({ iconStyle: { fontSize: '24px' } });

		expect(wrapper.find('.vc-rate__star').attributes('style')).toContain('font-size: 24px');
		wrapper.unmount();
	});

	it('tooltip: 渲染提示文本，并作为 aria-valuetext', () => {
		const { wrapper } = mountRate({ modelValue: 2, tooltip: ['极差', '差', '一般', '好', '极好'] });

		expect(wrapper.find('.vc-rate__tips').text()).toBe('差');
		expect(wrapper.attributes('aria-valuetext')).toBe('差');
		wrapper.unmount();
	});

	it('tooltip: 空数组不渲染提示区域', () => {
		const { wrapper } = mountRate({ modelValue: 2 });

		expect(wrapper.find('.vc-rate__tips').exists()).toBe(false);
		expect(wrapper.attributes('aria-valuetext')).toBeUndefined();
		wrapper.unmount();
	});

	it('tooltip: 通过 tip 插槽自定义提示', () => {
		const wrapper = mount(() => (
			<Rate character={CHAR} modelValue={3} tooltip={['a']} v-slots={{ tip: ({ value }: any) => (<span class="my-tip">{value}</span>) }} />
		));

		expect(wrapper.find('.my-tip').text()).toBe('3');
	});

	it('hover: 预览星级与提示文字，移出还原', async () => {
		const { wrapper } = mountRate({ modelValue: 1, tooltip: ['1', '2', '3', '4', '5'] });
		layout(wrapper);

		await stars(wrapper).trigger('mousemove', { clientX: left(3) + 4 });
		expect(selected(wrapper)).toBe(4);
		expect(wrapper.find('.vc-rate__tips').text()).toBe('4');
		// 无障碍值仍是已选分值
		expect(wrapper.attributes('aria-valuenow')).toBe('1');

		await stars(wrapper).trigger('mouseleave');
		expect(selected(wrapper)).toBe(1);
		expect(wrapper.find('.vc-rate__tips').text()).toBe('1');
		wrapper.unmount();
	});

	it('hover: 间距按中线分给两边的星星', async () => {
		const { wrapper } = mountRate();
		layout(wrapper);

		// 第 0、1 颗之间的间距是 [16, 24]，中线 20
		await stars(wrapper).trigger('mousemove', { clientX: 19 });
		expect(selected(wrapper)).toBe(1);
		await stars(wrapper).trigger('mousemove', { clientX: 21 });
		expect(selected(wrapper)).toBe(2);
		wrapper.unmount();
	});

	it('click: 点按星星更新值并触发事件', async () => {
		const { wrapper, onChange, onUpdate } = mountRate();

		await press(wrapper, left(2) + 8);

		expect(onUpdate).toHaveBeenCalledWith(3);
		expect(onChange).toHaveBeenCalledWith(3);
		wrapper.unmount();
	});

	it('click: modelValue 为字符串时触发字符串类型', async () => {
		const { wrapper, onChange } = mountRate({ modelValue: '0' });

		await press(wrapper, left(2) + 8);

		expect(onChange).toHaveBeenCalledWith('3');
		wrapper.unmount();
	});

	it('click: 点按当前分值且未开启 clearable 时不触发事件', async () => {
		const { wrapper, onChange } = mountRate({ modelValue: 3 });

		await press(wrapper, left(2) + 8);

		expect(onChange).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('click: 未绑定 v-model 时内部分值也会更新', async () => {
		const { wrapper } = mountRate();

		await press(wrapper, left(1) + 8);

		expect(selected(wrapper)).toBe(2);
		wrapper.unmount();
	});

	it('clearable: 点按当前分值清零', async () => {
		const { wrapper, onChange } = mountRate({ clearable: true, modelValue: 3 });

		await press(wrapper, left(2) + 8);

		expect(onChange).toHaveBeenCalledWith(0);
		wrapper.unmount();
	});

	it.each([
		[0, left(2) + 4, 2.5],
		[0, left(2) + 12, 3],
		[3, left(2) + 4, 2.5],
		[2, left(2) + 12, 3]
	])('half: 当前 %s，点在 x=%s 得到 %s', async (modelValue, x, expected) => {
		const { wrapper, onChange } = mountRate({ half: true, modelValue });

		await press(wrapper, x);

		expect(onChange).toHaveBeenCalledWith(expected);
		wrapper.unmount();
	});

	it.each([
		[3.5, left(3) + 4],
		[3, left(2) + 12]
	])('half + clearable: 当前 %s，点在同一分值上清零', async (modelValue, x) => {
		const { wrapper, onChange } = mountRate({ half: true, clearable: true, modelValue });

		await press(wrapper, x);

		expect(onChange).toHaveBeenCalledWith(0);
		wrapper.unmount();
	});

	it('drag: 按下滑动时预览，松开生效；滑过当前分值不清零', async () => {
		const { wrapper, onChange } = mountRate({ clearable: true, modelValue: 4 });
		layout(wrapper);

		await stars(wrapper).trigger('mousedown', { button: 0, buttons: 1, clientX: left(0) + 8 });
		document.dispatchEvent(new MouseEvent('mousemove', { buttons: 1, clientX: left(3) + 8 }));
		await nextTick();
		expect(selected(wrapper)).toBe(4);
		expect(onChange).not.toHaveBeenCalled();

		document.dispatchEvent(new MouseEvent('mouseup', { button: 0, clientX: left(3) + 8 }));
		await nextTick();
		// 结果与当前分值相同：既不清零也不触发
		expect(onChange).not.toHaveBeenCalled();
		expect(selected(wrapper)).toBe(4);
		wrapper.unmount();
	});

	it('drag: 滑到第一颗星左侧为 0，最后一颗右侧为满分', async () => {
		const { wrapper, onChange } = mountRate({ modelValue: 3 });

		await press(wrapper, left(2) + 8, -20);
		expect(onChange).toHaveBeenLastCalledWith(0);

		await press(wrapper, left(0) + 8, 500);
		expect(onChange).toHaveBeenLastCalledWith(5);
		wrapper.unmount();
	});

	it('touch: 点按与滑动，松开时阻止补发的鼠标事件', async () => {
		const { wrapper, onChange } = mountRate({ half: true });
		layout(wrapper);
		const el = stars(wrapper).element;

		el.dispatchEvent(touch('touchstart', left(1) + 4));
		el.dispatchEvent(touch('touchmove', left(3) + 12));
		await nextTick();
		expect(selected(wrapper)).toBe(4);

		const end = touch('touchend', left(3) + 12);
		el.dispatchEvent(end);
		await nextTick();
		expect(end.defaultPrevented).toBe(true);
		expect(onChange).toHaveBeenCalledWith(4);
		wrapper.unmount();
	});

	it('touch: touchcancel 放弃本次操作', async () => {
		const { wrapper, onChange } = mountRate({ modelValue: 1 });
		layout(wrapper);
		const el = stars(wrapper).element;

		el.dispatchEvent(touch('touchstart', left(3) + 8));
		await nextTick();
		expect(selected(wrapper)).toBe(4);

		el.dispatchEvent(touch('touchcancel', left(3) + 8));
		await nextTick();
		expect(selected(wrapper)).toBe(1);
		expect(onChange).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it.each([
		['ArrowRight', false, 2, 3],
		['ArrowUp', false, 2, 3],
		['ArrowLeft', false, 2, 1],
		['ArrowDown', false, 2, 1],
		['ArrowRight', true, 2, 2.5],
		['ArrowLeft', true, 2, 1.5],
		['Home', false, 3, 0],
		['End', false, 3, 5],
		['ArrowRight', false, 5, 5],
		['ArrowLeft', false, 0, 0],
		['ArrowRight', false, 2.5, 4]
	])('keyboard: %s（half=%s）%s → %s', async (key, half, modelValue, expected) => {
		const { wrapper, onChange } = mountRate({ half, modelValue });

		await wrapper.trigger('keydown', { key });

		if (expected === modelValue) {
			expect(onChange).not.toHaveBeenCalled();
		} else {
			expect(onChange).toHaveBeenCalledWith(expected);
		}
		wrapper.unmount();
	});

	it('keyboard: 其它按键不处理', async () => {
		const { wrapper, onChange } = mountRate({ modelValue: 2 });

		await wrapper.trigger('keydown', { key: 'Enter' });

		expect(onChange).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it.each(['disabled', 'readonly'])('%s: 不可聚焦，点按、滑动、悬停、按键都不生效', async (prop) => {
		const { wrapper, onChange } = mountRate({ [prop]: true, modelValue: 1 });

		expect(wrapper.classes()).toContain(`is-${prop}`);
		expect(wrapper.attributes('tabindex')).toBe('-1');
		expect(wrapper.attributes(`aria-${prop}`)).toBe('true');

		await press(wrapper, left(3) + 8);
		await stars(wrapper).trigger('mousemove', { clientX: left(3) + 8 });
		await wrapper.trigger('keydown', { key: 'ArrowRight' });

		expect(onChange).not.toHaveBeenCalled();
		expect(selected(wrapper)).toBe(1);
		wrapper.unmount();
	});

	it('v-model: 外部赋值同步显示且不触发 change', async () => {
		const value = ref<number>(1);
		const onChange = vi.fn();
		const wrapper = mount(() => (<Rate character={CHAR} v-model={value.value} onChange={onChange} />));

		value.value = 4;
		await nextTick();

		expect(selected(wrapper)).toBe(4);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('form: 选择后通知所在表单项校验', async () => {
		const change = vi.fn();
		const wrapper = mount(Rate, {
			props: { character: CHAR },
			global: { provide: { 'vc-form-item': { change } } },
			attachTo: document.body
		});

		await press(wrapper, left(1) + 8);

		expect(change).toHaveBeenCalledWith(2);
		wrapper.unmount();
	});
});
