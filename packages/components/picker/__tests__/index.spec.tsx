// @vitest-environment jsdom

import { MPicker, MPickerPopup, MPickerView, Picker, PickerPopup, PickerView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';
import { vi } from 'vitest';
import * as drag from '../../../hooks/__tests__/fixtures/drag';
import { enUS, zhCN } from '@deot/vc-locale';
import { VcInstance } from '../../vc';
import { MPopup } from '../../popup/index.m';
import { toCurrentValue, toModelValue } from '../../select/utils';
import { PickerCol } from '../mobile/picker-col';
import { PickerCore } from '../mobile/picker-core';
import { props as pickerProps } from '../mobile/picker-props';
import { props as pickerViewProps } from '../mobile/picker-view-props';
import {
	findEnabledIndex,
	getRowLabel,
	getSelectedData,
	isColumnGroup,
	makeColumnData,
	normalizeRow,
	resolveRow
} from '../mobile/utils';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

// 列按屏幕纵坐标取位移
const fireMouse = (
	el: EventTarget,
	type: 'mousedown' | 'mousemove' | 'mouseup',
	screenY: number,
	init: MouseEventInit = {}
) => {
	drag.fireMouse(el, type, { screenY, ...init });
};

const dragCol = async (el: Element, from: number, to: number) => {
	fireMouse(el, 'mousedown', from);
	fireMouse(el, 'mousemove', to);
	fireMouse(el, 'mouseup', to);
	await flush();
};

const fireTouch = (el: Element, type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel', screenY: number) => {
	drag.fireTouch(el, type, { screenY });
};

const touchCol = async (el: Element, from: number, to: number) => {
	fireTouch(el, 'touchstart', from);
	fireTouch(el, 'touchmove', to);
	fireTouch(el, 'touchend', to);
	await flush();
};

const regionData = [
	{
		value: 'zhejiang',
		label: 'Zhejiang',
		children: [
			{
				value: 'hangzhou',
				label: 'Hangzhou',
				children: [
					{ value: 'xihu', label: 'West Lake' },
					{ value: 'binjiang', label: 'Bin Jiang' }
				]
			},
			{
				value: 'ningbo',
				label: 'Ningbo',
				children: [
					{ value: 'jiangbei', label: 'Jiang Bei' }
				]
			}
		]
	},
	{
		value: 'jiangsu',
		label: 'Jiangsu',
		children: [
			{
				value: 'nanjing',
				label: 'Nanjing',
				children: [
					{ value: 'zhonghuamen', label: 'Zhong Hua Men' }
				]
			}
		]
	}
];

const seasonData = [
	[
		{ value: '2025', label: '2025' },
		{ value: '2026', label: '2026' }
	],
	[
		{ value: 'spring', label: '春' },
		{ value: 'summer', label: '夏' }
	]
];

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('exports picker components and mobile aliases', () => {
		expect(typeof Picker).toBe('object');
		expect(typeof PickerView).toBe('object');
		expect(typeof PickerPopup).toBe('object');
		expect(MPicker).toBe(Picker);
		expect(MPickerView).toBe(PickerView);
		expect(MPickerPopup).toBe(PickerPopup);
		expect(MPicker.View).toBe(PickerView);
		expect(MPicker.Popup).toBe(PickerPopup);
		expect(typeof MPicker.open).toBe('function');
	});

	it('renders trigger with default list item and formatted label', async () => {
		const wrapper = mount(() => (
			<Picker
				modelValue={['zhejiang', 'hangzhou', 'xihu']}
				data={regionData}
				columns={3}
				label="地区"
			/>
		));
		await flush();

		expect(wrapper.classes()).toContain('vcm-picker');
		expect(wrapper.find('.vcm-list-item').exists()).toBe(true);
		expect(wrapper.text()).toContain('地区');
		expect(wrapper.text()).toContain('Zhejiang,Hangzhou,West Lake');

		wrapper.unmount();
	});

	it('renders default slot with label scope', async () => {
		const wrapper = mount(() => (
			<Picker modelValue={['zhejiang', 'hangzhou', 'xihu']} data={regionData} columns={3}>
				{{
					default: ({ label }: any) => <span class="slot-label">{label}</span>
				}}
			</Picker>
		));
		await flush();

		expect(wrapper.find('.slot-label').text()).toBe('Zhejiang,Hangzhou,West Lake');

		wrapper.unmount();
	});

	it('covers picker defaults and utility branches', () => {
		expect((pickerProps.modelValue.default as any)()).toEqual([]);
		expect((pickerProps.data.default as any)()).toEqual([]);
		expect((pickerViewProps.modelValue.default as any)()).toEqual([]);
		expect((pickerViewProps.data.default as any)()).toEqual([]);
		expect((pickerProps.formatter.default as any)(null)).toBeNull();
		expect((pickerProps.formatter.default as any)(['A', 'B'])).toBe('A,B');

		expect(isColumnGroup()).toBe(false);
		expect(normalizeRow('raw')).toEqual({ label: 'raw', value: 'raw' });
		expect(getRowLabel({ value: 'fallback' })).toBe('fallback');
		expect(makeColumnData()).toEqual([]);
		expect(makeColumnData([{ value: 'p', children: [{ value: 'c' }] }])[0].hasChildren).toBe(true);
		expect(getSelectedData(['missing'], regionData).label).toEqual([]);
		expect(getSelectedData(['missing'], seasonData).label).toEqual([]);
		expect(getSelectedData(['2025', 'missing', 'extra'], seasonData).label).toEqual(['2025']);
		expect(toCurrentValue('1|2', { numerable: true, separator: '|' })).toEqual([1, 2]);
		expect(toCurrentValue('a|b', { numerable: false, separator: '|' })).toEqual(['a', 'b']);
		expect(toCurrentValue('', { numerable: false, separator: ',' })).toEqual([]);
		expect(toCurrentValue(1, { numerable: false, separator: ',' })).toEqual([1]);
		expect(toModelValue(['a', 'b'], {
			modelValue: '',
			separator: '|',
			numerable: false,
			nullValue: undefined,
			max: 2
		} as any)).toBe('a|b');
		expect(toModelValue(['a'], {
			modelValue: [],
			separator: ',',
			numerable: false,
			nullValue: undefined,
			max: 1
		} as any)).toEqual(['a']);
		expect(toModelValue([], {
			modelValue: '',
			separator: ',',
			numerable: false,
			nullValue: '',
			max: 2
		} as any)).toBe('');
		// numerable 的字符串模型同样按 separator 拼接；为空时返回 nullValue
		expect(toModelValue([1, 2], {
			modelValue: '1|1',
			separator: '|',
			numerable: true,
			nullValue: undefined,
			max: 2
		} as any)).toBe('1|2');
		expect(toModelValue([], {
			modelValue: '',
			separator: '|',
			numerable: false,
			nullValue: null,
			max: 2
		} as any)).toBe(null);
	});
});

describe('PickerView', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders cascader columns and syncs dependent defaults after column change', async () => {
		const value = ref<any[]>(['zhejiang', 'hangzhou', 'xihu']);
		const onChange = vi.fn();
		const onPickerChange = vi.fn();
		const wrapper = mount(() => (
			<PickerView
				v-model={value.value}
				data={regionData}
				columns={3}
				onChange={onChange}
				onPickerChange={onPickerChange}
			/>
		), { attachTo: document.body });
		await flush();

		const cols = wrapper.findAll('.vcm-picker-col');
		expect(cols).toHaveLength(3);
		expect(wrapper.text()).toContain('West Lake');

		await dragCol(cols[0].element, 0, -40);

		expect(value.value).toEqual(['jiangsu', 'nanjing', 'zhonghuamen']);
		expect(onPickerChange).toHaveBeenCalledWith('jiangsu', 0, expect.objectContaining({ label: 'Jiangsu' }));
		expect(onChange).toHaveBeenLastCalledWith(
			['jiangsu', 'nanjing', 'zhonghuamen'],
			['Jiangsu', 'Nanjing', 'Zhong Hua Men'],
			expect.any(Array)
		);

		wrapper.unmount();
	});

	it('supports non-cascader multi-column data', async () => {
		const value = ref<any[]>(['2026', 'spring']);
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<PickerView
				v-model={value.value}
				data={seasonData}
				cascader={false}
				columns={2}
				onChange={onChange}
			/>
		), { attachTo: document.body });
		await flush();

		const cols = wrapper.findAll('.vcm-picker-col');
		expect(cols).toHaveLength(2);
		await dragCol(cols[1].element, 0, -40);

		expect(value.value).toEqual(['2026', 'summer']);
		expect(onChange).toHaveBeenLastCalledWith(
			['2026', 'summer'],
			['2026', '夏'],
			expect.any(Array)
		);

		wrapper.unmount();
	});

	it('value 按 === 比较：数字选项配字符串值时需开启 numerable', async () => {
		const data = [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }];
		expect(getSelectedData(['2'], data).label).toEqual([]);
		expect(getSelectedData([2], data).label).toEqual(['Two']);

		const value = ref<any>(['2']);
		const wrapper = mount(() => (
			<PickerView v-model={value.value} data={data} cascader={false} columns={1} numerable />
		), { attachTo: document.body });
		await flush();
		const col = wrapper.findComponent(PickerCol);
		expect(col.props('value')).toBe(2);

		wrapper.unmount();
	});

	it('supports string modelValue with separator', async () => {
		const value = ref<any>('2026|spring');
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<PickerView
				v-model={value.value}
				data={seasonData}
				cascader={false}
				columns={2}
				separator="|"
				onChange={onChange}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.text()).toContain('2026');
		expect(wrapper.text()).toContain('春');

		await dragCol(wrapper.findAll('.vcm-picker-col')[1].element, 0, -40);

		expect(value.value).toBe('2026|summer');
		expect(onChange).toHaveBeenLastCalledWith(
			'2026|summer',
			['2026', '夏'],
			expect.any(Array)
		);

		wrapper.unmount();
	});

	it('renders custom item labels and dispatches form change', async () => {
		const formChange = vi.fn();
		const renderLabel = vi.fn(({ label }: any) => h('span', { class: 'render-label' }, `#${label}`));
		const wrapper = mount(() => (
			<PickerView
				data={seasonData}
				cascader={false}
				columns={2}
				renderLabel={renderLabel}
			/>
		), {
			attachTo: document.body,
			global: {
				provide: {
					'vc-form-item': { change: formChange }
				}
			}
		});
		await flush();

		expect(wrapper.find('.render-label').text()).toBe('#2025');
		await dragCol(wrapper.findAll('.vcm-picker-col')[0].element, 0, -40);

		expect(formChange).toHaveBeenCalledWith(['2026', 'spring']);

		wrapper.unmount();
	});

	it('updates columns when data changes and handles empty columns', async () => {
		const data = ref<any[]>([[]]);
		const wrapper = mount(() => (
			<PickerView data={data.value} cascader={false} columns={1} />
		));
		await flush();

		expect(wrapper.findAll('.vcm-picker-col__item')).toHaveLength(0);

		data.value = [[{ value: 'a', label: 'A' }]];
		await flush();

		expect(wrapper.find('.vcm-picker-col__item').text()).toBe('A');

		wrapper.unmount();
	});

	it('遮罩与选中框整个面板只有一份', async () => {
		const wrapper = mount(() => <PickerView data={regionData} columns={3} />);
		await flush();

		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(3);
		expect(wrapper.findAll('.vcm-picker-view__mask')).toHaveLength(1);
		expect(wrapper.findAll('.vcm-picker-view__indicator')).toHaveLength(1);
		wrapper.unmount();
	});

	it('hideEmptyColumns：级联时不渲染没有数据的列，值也不补该列', async () => {
		const data = [
			{ value: 'a', label: 'A', children: [{ value: 'a1', label: 'A1' }] },
			{ value: 'b', label: 'B', children: [{ value: 'b1', label: 'B1', children: [{ value: 'b11', label: 'B11' }] }] }
		];
		const value = ref<any[]>(['a']);
		const wrapper = mount(() => (
			<PickerView v-model={value.value} data={data} columns={3} hideEmptyColumns />
		));
		await flush();
		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(2);

		await wrapper.findAll('.vcm-picker-col')[0].findAll('.vcm-picker-col__item')[1].trigger('click');
		await flush();
		expect(value.value).toEqual(['b', 'b1', 'b11']);
		expect(wrapper.findAll('.vcm-picker-col')).toHaveLength(3);

		// 默认（或非级联时）保留空列
		const plain = mount(() => <PickerView modelValue={['a']} data={data} columns={3} />);
		await flush();
		expect(plain.findAll('.vcm-picker-col')).toHaveLength(3);

		wrapper.unmount();
		plain.unmount();
	});
});

describe('PickerCol', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
	});

	it('supports function labels and touch events', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<PickerCol
				value="a"
				data={[
					{ value: 'a', label: () => h('span', { class: 'fn-label' }, 'A') },
					{ value: 'b', label: 'B' },
					{ value: 'c', label: 'C' }
				]}
				onChange={onChange}
			/>
		));
		await flush();

		expect(wrapper.find('.fn-label').text()).toBe('A');
		await touchCol(wrapper.element, 0, -40);

		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'b' }));

		wrapper.unmount();
	});

	it('uses the rendered row height when selecting after a drag', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<PickerCol
				value="a"
				data={['a', 'b', 'c', 'd'].map(value => ({ value }))}
				onChange={onChange}
			/>
		), { attachTo: document.body });
		vi.spyOn(wrapper.find('.vcm-picker-col__item').element, 'getBoundingClientRect')
			.mockReturnValue({ height: 68 } as DOMRect);

		await dragCol(wrapper.element, 0, -68);
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'b' }));
		wrapper.unmount();
	});

	it('handles empty data and clamps to first item', async () => {
		const emptyChange = vi.fn();
		const emptyWrapper = mount(() => <PickerCol onChange={emptyChange} />, { attachTo: document.body });
		await dragCol(emptyWrapper.element, 0, -40);
		expect(emptyChange).not.toHaveBeenCalled();
		emptyWrapper.unmount();

		const onChange = vi.fn();
		const wrapper = mount(() => (
			<PickerCol
				value="b"
				data={[
					{ value: 'a', label: 'A' },
					{ value: 'b', label: 'B' },
					{ value: 'c', label: 'C' }
				]}
				onChange={onChange}
			/>
		), { attachTo: document.body });
		await flush();

		await dragCol(wrapper.element, 0, 40);
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'a' }));

		wrapper.unmount();
	});

	describe('松手：慢拖吸附到最近一项，快滑按惯性', () => {
		const letters = 'abcdefghijklmnopqrstuvwxyz'.split('').map(value => ({ value, label: value.toUpperCase() }));
		const swipe = async (wrapper: any, distance: number, ms: number) => {
			fireMouse(wrapper.element, 'mousedown', 0);
			fireMouse(wrapper.element, 'mousemove', -distance);
			vi.advanceTimersByTime(ms);
			fireMouse(wrapper.element, 'mouseup', -distance);
			await nextTick();
		};

		it('慢拖或位移不足 2 行：吸附到最近一项', async () => {
			vi.useFakeTimers();
			const onChange = vi.fn();
			const wrapper = mount(() => <PickerCol value="a" data={letters} onChange={onChange} />, { attachTo: document.body });
			await nextTick();

			// 行高 44：10px 不够半行，不变
			await swipe(wrapper, 10, 100);
			expect(onChange).not.toHaveBeenCalled();

			// 慢拖 70px：最近的是第 2 项
			await swipe(wrapper, 70, 600);
			expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'c' }));
			expect(wrapper.find('.vcm-picker-col__wrapper').attributes('style')).toContain('200ms ease');
			wrapper.unmount();
		});

		it('快滑超过 2 行：按减速度算终点，越界时取末项', async () => {
			vi.useFakeTimers();
			const onChange = vi.fn();
			const wrapper = mount(() => <PickerCol value="a" data={letters} onChange={onChange} />, { attachTo: document.body });
			await nextTick();

			// 100px / 100ms：速度 2px/ms，终点 = 100 + 2 / 0.003 ≈ 767px，第 17 项
			await swipe(wrapper, 100, 100);
			expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'r' }));
			expect(wrapper.find('.vcm-picker-col__wrapper').attributes('style')).toContain('400ms cubic-bezier(.17, .89, .45, 1)');

			vi.advanceTimersByTime(400);
			const short = mount(() => <PickerCol value="a" data={letters.slice(0, 5)} onChange={onChange} />, { attachTo: document.body });
			await nextTick();
			await swipe(short, 100, 100);
			expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'e' }));
			expect(short.find('.vcm-picker-col__wrapper').attributes('style')).toContain('cubic-bezier(.25, .46, .45, .94)');

			wrapper.unmount();
			short.unmount();
		});

		it('越界阻尼：超出首项的部分只走 1/4', async () => {
			const wrapper = mount(() => <PickerCol value="a" data={letters} />, { attachTo: document.body });
			await nextTick();

			fireMouse(wrapper.element, 'mousedown', 0);
			fireMouse(wrapper.element, 'mousemove', 40);
			await flush();
			// 向下拖 40px：位置 -40 → -10
			expect(wrapper.find('.vcm-picker-col__wrapper').attributes('style')).toContain('* 0 + 10px');
			fireMouse(wrapper.element, 'mouseup', 40);
			wrapper.unmount();
		});
	});

	// value 跟随 change，与 PickerView 中一致
	const mountControlled = (values: string[], initial: string) => {
		const value = ref(initial);
		const onChange = vi.fn((row: any) => (value.value = row.value));
		const wrapper = mount(() => (
			<PickerCol value={value.value} data={values.map(v => ({ value: v }))} onChange={onChange} />
		), { attachTo: document.body });
		return { wrapper, onChange, value };
	};

	it('点击选项：滚到该项；拖动后松开不算点击；点当前项不触发', async () => {
		const { wrapper, onChange } = mountControlled(['a', 'b', 'c'], 'a');
		await flush();
		const items = wrapper.findAll('.vcm-picker-col__item');
		expect(items[0].classes()).toContain('is-selected');

		await items[0].trigger('click');
		expect(onChange).not.toHaveBeenCalled();

		await items[2].trigger('click');
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'c' }));
		expect(wrapper.findAll('.vcm-picker-col__item')[2].classes()).toContain('is-selected');

		// 拖动：松开时吸附（10px 不足半行，仍为 c），随后的 click 不算点击
		await sleep(250);
		onChange.mockClear();
		fireMouse(wrapper.element, 'mousedown', 0);
		fireMouse(wrapper.element, 'mousemove', -10);
		fireMouse(wrapper.element, 'mouseup', -10);
		await wrapper.findAll('.vcm-picker-col__item')[1].trigger('click');
		expect(onChange).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('触摸：纵向拖动阻止默认行为，横向不处理也不阻止', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<PickerCol value="a" data={['a', 'b', 'c'].map(value => ({ value }))} onChange={onChange} />
		), { attachTo: document.body });
		await flush();
		const col = wrapper.element;

		drag.fireTouch(col, 'touchstart', { screenX: 0, screenY: 0 });
		const horizontal = drag.fireTouch(col, 'touchmove', { screenX: -60, screenY: -10 });
		drag.fireTouch(col, 'touchend', { screenX: -60, screenY: -10 });
		await flush();
		expect(horizontal.defaultPrevented).toBe(false);
		expect(onChange).not.toHaveBeenCalled();

		const start = drag.fireTouch(col, 'touchstart', { screenX: 0, screenY: 0 });
		const vertical = drag.fireTouch(col, 'touchmove', { screenX: -10, screenY: -44 });
		drag.fireTouch(col, 'touchend', { screenX: -10, screenY: -44 });
		await flush();
		// touchstart 不阻止：轻点仍会触发 click
		expect(start.defaultPrevented).toBe(false);
		expect(vertical.defaultPrevented).toBe(true);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'b' }));
		wrapper.unmount();
	});

	it('滚动中按住：停在当前画面位置，这次轻点不算点击', async () => {
		vi.useFakeTimers();
		const { wrapper, onChange } = mountControlled(['a', 'b', 'c', 'd', 'e'], 'a');
		await nextTick();

		await wrapper.findAll('.vcm-picker-col__item')[4].trigger('click');
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'e' }));

		// 动画进行到第 1 项附近：计算样式的位移为 -50px
		const el = wrapper.find('.vcm-picker-col__wrapper').element as HTMLElement;
		const getComputedStyle = window.getComputedStyle;
		const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((target: Element, pseudo?: string | null) => {
			const style = getComputedStyle(target, pseudo);
			if (target !== el) return style;
			const matrix = 'matrix(1, 0, 0, 1, 0, -50)';
			return new Proxy(style, { get: (t, k) => (k === 'transform' || k === 'webkitTransform' ? matrix : Reflect.get(t, k)) });
		});

		onChange.mockClear();
		fireMouse(wrapper.element, 'mousedown', 0);
		await nextTick();
		// 停在原处：选中项 e 在 176px，画面在 50px，相对位移 -126px，不再过渡
		expect(el.getAttribute('style')).toContain('* -4 + 126px');
		expect(el.getAttribute('style')).toContain('transition: none');
		fireMouse(wrapper.element, 'mouseup', 0);
		await nextTick();
		await wrapper.findAll('.vcm-picker-col__item')[1].trigger('click');
		// 松开后吸附到最近的第 1 项；轻点不算点击
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'b' }));

		spy.mockRestore();
		wrapper.unmount();
	});

	it('滚轮：一格一项，触控板的小增量累积后滚一项，到首项 / 末项后不阻止', async () => {
		const { wrapper, onChange } = mountControlled(['a', 'b', 'c'], 'b');
		await flush();
		const wheel = (deltaY: number) => {
			const e = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true });
			wrapper.element.dispatchEvent(e);
			return e;
		};

		expect(wheel(100).defaultPrevented).toBe(true);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'c' }));
		await flush();

		// 已在末项（动画中的目标）：不再阻止，页面照常滚动
		expect(wheel(100).defaultPrevented).toBe(false);

		onChange.mockClear();
		wheel(-20);
		wheel(-20);
		expect(onChange).not.toHaveBeenCalled();
		wheel(-20);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'b' }));
		wrapper.unmount();
	});

	describe('drag interrupted or leaving the column', () => {
		const mountCol = async () => {
			const onChange = vi.fn();
			const wrapper = mount(() => (
				<PickerCol
					value="a"
					data={['a', 'b', 'c', 'd'].map(value => ({ value }))}
					onChange={onChange}
				/>
			), { attachTo: document.body });
			await flush();
			return {
				wrapper,
				onChange,
				col: wrapper.element,
				// 列的位移：calc(var(--vcm-picker-item-height) * -index ∓ |offset|px)
				style: () => wrapper.find('.vcm-picker-col__wrapper').element.getAttribute('style') || ''
			};
		};

		it('releasing outside the column still ends the drag and selects', async () => {
			const { wrapper, onChange, col, style } = await mountCol();

			fireMouse(col, 'mousedown', 0);
			fireMouse(col, 'mousemove', -40);
			// 指针已离开该列：松开发生在列外
			fireMouse(document.body, 'mouseup', -40);
			await flush();
			expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'b' }));

			// 手势结束后，不按键的移动不再拖动
			fireMouse(col, 'mousemove', -100, { buttons: 0 });
			await flush();
			expect(style()).toContain('- 0px');
			wrapper.unmount();
		});

		it('keeps following the pointer outside the column', async () => {
			const { wrapper, onChange, col, style } = await mountCol();

			fireMouse(col, 'mousedown', 0);
			fireMouse(document.body, 'mousemove', -40);
			await flush();
			expect(style()).toContain('- 40px');

			fireMouse(document.body, 'mouseup', -40);
			await flush();
			expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'b' }));
			wrapper.unmount();
		});

		it('cancels the drag when the primary button is no longer pressed without a mouseup', async () => {
			const { wrapper, onChange, col, style } = await mountCol();

			fireMouse(col, 'mousedown', 0);
			fireMouse(col, 'mousemove', -40);
			await flush();
			expect(style()).toContain('- 40px');

			// 右键菜单、原生拖拽等吞掉了 mouseup：下一次移动时主键已松开
			fireMouse(col, 'mousemove', -60, { buttons: 0 });
			await flush();
			// 取消：回弹，不选中
			expect(onChange).not.toHaveBeenCalled();
			expect(style()).toContain('- 0px');

			// 已解绑：之后按着主键移动也不再拖动
			fireMouse(col, 'mousemove', -80);
			await flush();
			expect(style()).toContain('- 0px');
			wrapper.unmount();
		});

		it('ignores non-primary buttons', async () => {
			const { wrapper, onChange, col, style } = await mountCol();

			fireMouse(col, 'mousedown', 0, { button: 2, buttons: 2 });
			fireMouse(col, 'mousemove', -40, { buttons: 2 });
			await flush();
			// 未进入拖动
			expect(style()).toContain('- 0px');

			fireMouse(col, 'mouseup', -40, { button: 2 });
			await flush();
			expect(onChange).not.toHaveBeenCalled();
			wrapper.unmount();
		});

		it('touchcancel snaps back without selecting', async () => {
			const { wrapper, onChange, col, style } = await mountCol();

			fireTouch(col, 'touchstart', 0);
			fireTouch(col, 'touchmove', -40);
			await flush();
			expect(style()).toContain('- 40px');

			// 系统手势等打断了触摸：不会再有 touchend
			fireTouch(col, 'touchcancel', -40);
			await flush();
			expect(onChange).not.toHaveBeenCalled();
			expect(style()).toContain('- 0px');

			// 取消后的移动不再拖动
			fireTouch(col, 'touchmove', -80);
			await flush();
			expect(style()).toContain('- 0px');
			wrapper.unmount();
		});
	});
});

describe('Picker locale', () => {
	afterEach(() => {
		VcInstance.configure({ locale: zhCN });
		document.body.innerHTML = '';
	});

	it('updates the placeholder and an open portal when locale changes', async () => {
		const wrapper = mount(Picker, { attachTo: document.body, props: { data: regionData, columns: 3 } });
		expect(wrapper.text()).toContain('请选择');
		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.is-left')?.textContent).toBe('取消');
		expect(document.querySelector('.is-right')?.textContent).toBe('确定');

		VcInstance.configure({ locale: enUS });
		await flush();
		expect(wrapper.text()).toContain('Please select');
		expect(document.querySelector('.is-left')?.textContent).toBe('Cancel');
		expect(document.querySelector('.is-right')?.textContent).toBe('OK');
		wrapper.unmount();
	});

	it('preserves custom and empty text overrides on the trigger and popup', async () => {
		VcInstance.configure({ locale: enUS });
		const wrapper = mount(Picker, {
			attachTo: document.body,
			props: { extra: '自定义提示', cancelText: '', okText: '提交', data: regionData }
		});
		expect(wrapper.text()).toContain('自定义提示');
		await wrapper.setProps({ extra: '' });
		expect(wrapper.text()).not.toContain('Please select');
		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.is-left')).toBeNull();
		expect(document.querySelector('.is-right')?.textContent).toBe('提交');
		wrapper.unmount();

		const popup = mount(PickerPopup, {
			attachTo: document.body,
			props: { cancelText: '返回', okText: '' }
		});
		await flush();
		expect(popup.find('.is-left').text()).toBe('返回');
		expect(popup.find('.is-right').exists()).toBe(false);
		popup.unmount();
	});

	it('localizes method-created popups reactively', async () => {
		const leaf = MPicker.open();
		await flush();
		expect(document.querySelector('.is-right')?.textContent).toBe('确定');
		VcInstance.configure({ locale: enUS });
		await flush();
		expect(document.querySelector('.is-left')?.textContent).toBe('Cancel');
		expect(document.querySelector('.is-right')?.textContent).toBe('OK');
		leaf.destroy();
	});
});

describe('PickerPopup', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('cancelDisabled / okDisabled gray out the buttons and ignore taps', async () => {
		const onOk = vi.fn();
		const onCancel = vi.fn();
		const popup = mount(PickerPopup, {
			attachTo: document.body,
			props: { okDisabled: true, cancelDisabled: true, onOk, onCancel }
		});
		await flush();
		const ok = popup.find('.is-right');
		expect(ok.classes()).toContain('is-disabled');
		await ok.trigger('click');
		expect(onOk).not.toHaveBeenCalled();
		const cancel = popup.find('.is-left');
		expect(cancel.classes()).toContain('is-disabled');
		await cancel.trigger('click');
		expect(onCancel).not.toHaveBeenCalled();

		await popup.setProps({ okDisabled: false });
		expect(popup.find('.is-right').classes()).not.toContain('is-disabled');
		await popup.find('.is-right').trigger('click');
		expect(onOk).toHaveBeenCalledTimes(1);
		popup.unmount();
	});

	it('confirm=false: no buttons, shows the title and close button in the MPopup header', async () => {
		const popup = mount(PickerPopup, {
			attachTo: document.body,
			props: { confirm: false, title: '标题' }
		});
		await flush();
		expect(popup.find('.vcm-picker-popup__header').exists()).toBe(false);
		expect(document.querySelector('.vcm-popup__title')?.textContent).toBe('标题');
		expect(document.querySelector('.vcm-popup__content')?.classList).toContain('vcm-picker-popup__content');
		expect(document.querySelector('.vcm-popup__footer')).toBeNull();
		popup.unmount();
	});

	it('confirm=\'bottom\': a large OK button in the footer emits ok and closes; okDisabled disables it', async () => {
		const onOk = vi.fn();
		const popup = mount(PickerPopup, {
			attachTo: document.body,
			props: { confirm: 'bottom', title: '标题', okDisabled: true, onOk }
		});
		await flush();
		expect(popup.find('.vcm-picker-popup__header').exists()).toBe(false);
		expect(document.querySelector('.vcm-popup__title')?.textContent).toBe('标题');
		const button = () => document.querySelector<HTMLElement>('.vcm-popup__footer .vcm-picker-popup__button')!;
		expect(button().textContent).toBe('确定');
		button().click();
		await flush();
		expect(onOk).not.toHaveBeenCalled();

		await popup.setProps({ okDisabled: false });
		button().click();
		await flush();
		expect(onOk).toHaveBeenCalledTimes(1);
		expect(popup.emitted('update:modelValue')?.at(-1)).toEqual([false]);
		popup.unmount();
	});

	it('passes the footer slot through to MPopup with its slot props', async () => {
		const footer = vi.fn((props: any) => h('button', { class: 'footer-button', onClick: props.close }, '确定'));
		const popup = mount(PickerPopup, {
			attachTo: document.body,
			props: { confirm: 'bottom', title: '标题' },
			slots: {
				default: () => h('div', { class: 'body' }, '内容'),
				footer
			}
		});
		await flush();
		expect(document.querySelector('.vcm-popup__footer .footer-button')?.textContent).toBe('确定');
		expect(document.querySelector('.vcm-popup__content .body')).not.toBeNull();
		expect(typeof footer.mock.calls[0][0].close).toBe('function');
		popup.unmount();
	});

	it('supports visible alias and emits cancel/update events', async () => {
		const onCancel = vi.fn();
		const onVisibleChange = vi.fn();
		const onUpdateVisible = vi.fn();
		const wrapper = mount(() => (
			<PickerPopup
				visible
				title={{ type: 'html', value: '<b class=\'title-inner\'>标题</b>' }}
				onCancel={onCancel}
				onVisibleChange={onVisibleChange}
				onUpdate:visible={onUpdateVisible}
			>
				<div class="popup-body">content</div>
			</PickerPopup>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.title-inner').text()).toBe('标题');
		expect(wrapper.find('.popup-body').exists()).toBe(true);

		await wrapper.find('.is-left').trigger('click');
		await flush();

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onVisibleChange).toHaveBeenCalledWith(false);
		expect(onUpdateVisible).toHaveBeenCalledWith(false);

		wrapper.unmount();
	});

	it('emits ok when toolbar confirm is clicked', async () => {
		const onOk = vi.fn();
		const wrapper = mount(() => (
			<PickerPopup modelValue onOk={onOk}>
				<div />
			</PickerPopup>
		), { attachTo: document.body });
		await flush();

		await wrapper.find('.is-right').trigger('click');
		await flush();

		expect(onOk).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('emits close when inner popup closes and can hide toolbar buttons', async () => {
		const onClose = vi.fn();
		const wrapper = mount(() => (
			<PickerPopup modelValue cancelText="" okText="" onClose={onClose}>
				<div />
			</PickerPopup>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.is-left').exists()).toBe(false);
		expect(wrapper.find('.is-right').exists()).toBe(false);

		wrapper.findComponent(MPopup).vm.$emit('close');
		await flush();

		expect(onClose).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});
});

describe('PickerCore', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('watches visible and emits cancel/close without callback props', async () => {
		const wrapper = mount(PickerCore, {
			attachTo: document.body,
			props: {
				visible: false,
				data: regionData,
				modelValue: ['zhejiang', 'hangzhou', 'xihu'],
				columns: 3
			}
		});
		await flush();

		await wrapper.setProps({ visible: true });
		await flush();
		expect(wrapper.emitted('visible-change')?.at(-1)).toEqual([true]);

		await wrapper.find('.is-left').trigger('click');
		await flush();

		expect(wrapper.emitted('cancel')).toHaveLength(1);

		wrapper.findComponent(PickerPopup).vm.$emit('close');
		await flush();

		expect(wrapper.emitted('close')).toHaveLength(1);
		expect(wrapper.emitted('portal-fulfilled')).toHaveLength(1);

		wrapper.unmount();
	});

	it('emits ok/change when no onOk callback prop is provided', async () => {
		const wrapper = mount(PickerCore, {
			attachTo: document.body,
			props: {
				data: regionData,
				modelValue: ['zhejiang', 'hangzhou', 'xihu'],
				columns: 3
			}
		});
		await flush();

		await wrapper.find('.is-right').trigger('click');
		await flush();

		expect(wrapper.emitted('ok')?.[0]).toEqual([
			['zhejiang', 'hangzhou', 'xihu'],
			['Zhejiang', 'Hangzhou', 'West Lake'],
			expect.any(Array)
		]);
		expect(wrapper.emitted('change')).toHaveLength(1);

		wrapper.unmount();
	});

	it('confirm=false: commits on every wheel stop and keeps the popup open', async () => {
		const wrapper = mount(PickerCore, {
			attachTo: document.body,
			props: {
				data: regionData,
				modelValue: ['zhejiang', 'hangzhou', 'xihu'],
				columns: 3,
				confirm: false
			}
		});
		await flush();
		expect(wrapper.find('.vcm-picker-popup__header').exists()).toBe(false);

		await wrapper.findAll('.vcm-picker-col')[2].findAll('.vcm-picker-col__item')[1].trigger('click');
		await flush();
		expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['zhejiang', 'hangzhou', 'binjiang']);
		expect(wrapper.emitted('change')).toHaveLength(1);
		expect(wrapper.emitted('ok')).toBeUndefined();
		expect(wrapper.emitted('update:visible')?.at(-1)).not.toEqual([false]);

		wrapper.unmount();
	});
});

describe('Picker integration', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('opens popup from trigger and commits selected value on ok', async () => {
		const value = ref<any[]>(['zhejiang', 'hangzhou', 'xihu']);
		const onOk = vi.fn();
		const onChange = vi.fn();
		const onPickerChange = vi.fn();
		const wrapper = mount(() => (
			<Picker
				v-model={value.value}
				data={regionData}
				columns={3}
				onOk={onOk}
				onChange={onChange}
				onPickerChange={onPickerChange}
			/>
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.vcm-picker-popup')).not.toBeNull();
		const firstCol = document.querySelectorAll('.vcm-picker-col')[0];
		await dragCol(firstCol, 0, -40);
		expect(onPickerChange).toHaveBeenCalledWith('jiangsu', 0, expect.objectContaining({ label: 'Jiangsu' }));

		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();

		expect(value.value).toEqual(['jiangsu', 'nanjing', 'zhonghuamen']);
		expect(onOk).toHaveBeenCalledWith(
			['jiangsu', 'nanjing', 'zhonghuamen'],
			['Jiangsu', 'Nanjing', 'Zhong Hua Men'],
			expect.any(Array)
		);
		expect(onChange).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('confirm=false: the trigger value follows each wheel stop without ok', async () => {
		const value = ref<any[]>(['zhejiang', 'hangzhou', 'xihu']);
		const onOk = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Picker v-model={value.value} data={regionData} columns={3} confirm={false} onOk={onOk} onChange={onChange} />
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vcm-picker-popup__header')).toBeNull();

		await dragCol(document.querySelectorAll('.vcm-picker-col')[0], 0, -40);
		expect(value.value).toEqual(['jiangsu', 'nanjing', 'zhonghuamen']);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onOk).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('Picker reads and writes string modelValue', async () => {
		const value = ref<any>('zhejiang,hangzhou,xihu');
		const onOk = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Picker
				v-model={value.value}
				data={regionData}
				columns={3}
				onOk={onOk}
				onChange={onChange}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.text()).toContain('Zhejiang,Hangzhou,West Lake');

		await wrapper.trigger('click');
		await flush();
		await dragCol(document.querySelectorAll('.vcm-picker-col')[0], 0, -40);
		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();

		expect(value.value).toBe('jiangsu,nanjing,zhonghuamen');
		expect(onOk).toHaveBeenCalledWith(
			'jiangsu,nanjing,zhonghuamen',
			['Jiangsu', 'Nanjing', 'Zhong Hua Men'],
			expect.any(Array)
		);
		expect(onChange).toHaveBeenCalledWith(
			'jiangsu,nanjing,zhonghuamen',
			['Jiangsu', 'Nanjing', 'Zhong Hua Men'],
			expect.any(Array)
		);

		wrapper.unmount();
	});

	it('emits cancel from trigger popup', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(() => (
			<Picker data={regionData} columns={3} onCancel={onCancel} />
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();
		(document.querySelector('.vcm-picker-popup__item.is-left') as HTMLElement).click();
		await flush();

		expect(onCancel).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('loads data before opening when source is empty', async () => {
		const data = ref<any[]>([]);
		const loadData = vi.fn(async () => {
			data.value = regionData;
		});
		const wrapper = mount(() => (
			<Picker data={data.value} columns={3} loadData={loadData} />
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();

		expect(loadData).toHaveBeenCalledTimes(1);
		expect(document.querySelectorAll('.vcm-picker-col')).toHaveLength(3);

		wrapper.unmount();
	});

	it('MPicker.open creates a portal popup and calls onOk', async () => {
		const onOk = vi.fn();
		const leaf = MPicker.open({
			data: regionData,
			value: ['zhejiang', 'hangzhou', 'xihu'],
			columns: 3,
			onOk
		});
		await flush();

		expect(document.querySelector('.vcm-picker-popup')).not.toBeNull();
		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();

		expect(onOk).toHaveBeenCalledWith(
			['zhejiang', 'hangzhou', 'xihu'],
			['Zhejiang', 'Hangzhou', 'West Lake'],
			expect.any(Array)
		);

		leaf.destroy();
	});

	it('MPicker.open keeps string value shape', async () => {
		const onOk = vi.fn();
		const leaf = MPicker.open({
			data: regionData,
			value: 'zhejiang/hangzhou/xihu',
			separator: '/',
			columns: 3,
			onOk
		});
		await flush();

		(document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement).click();
		await flush();

		expect(onOk).toHaveBeenCalledWith(
			'zhejiang/hangzhou/xihu',
			['Zhejiang', 'Hangzhou', 'West Lake'],
			expect.any(Array)
		);

		leaf.destroy();
	});

	it('MPicker.open supports empty options', async () => {
		const leaf = MPicker.open();
		await flush();

		expect(document.querySelector('.vcm-picker-popup')).not.toBeNull();

		leaf.destroy();
	});
});

describe('PickerPopup title', () => {
	it('标题位始终保留，支持渲染函数与 { type, value }', async () => {
		const wrapper = mount(PickerPopup, { props: { modelValue: true, title: '' } });
		await nextTick();
		expect(wrapper.find('.vcm-picker-popup__item.is-title').exists()).toBe(true);

		await wrapper.setProps({ title: () => h('i', { class: 'render-title' }, 'title') });
		expect(wrapper.find('.is-title .render-title').exists()).toBe(true);

		await wrapper.setProps({ title: { type: 'text', value: '<b class="inner">text</b>' } });
		expect(wrapper.find('.is-title .inner').exists()).toBe(false);
		expect(wrapper.find('.is-title').text()).toBe('<b class="inner">text</b>');
		wrapper.unmount();
	});
});

describe('PickerCol renderLabel', () => {
	it('收到 { label, row, index }，根节点上没有透传属性', () => {
		const renderLabel = vi.fn(({ label }: any) => h('i', { class: 'render-label' }, label));
		const wrapper = mount(PickerCol, {
			props: { data: [{ value: 1, label: 'A' }, { value: 2, label: 'B' }], value: 1, renderLabel }
		});

		expect(renderLabel).toHaveBeenCalledTimes(2);
		expect(Object.keys((renderLabel.mock.calls[0] as any)[0]).sort()).toEqual(['index', 'label', 'row']);
		expect(wrapper.find('.render-label').attributes()).toEqual({ class: 'render-label' });
		wrapper.unmount();
	});

	it('整列重渲染时，数据不变则渲染函数不重新执行', async () => {
		const renderLabel = vi.fn(({ label }: any) => h('i', { class: 'render-label' }, label));
		const rowLabel = vi.fn(() => h('i', { class: 'row-label' }, 'B'));
		const wrapper = mount(PickerCol, {
			props: { data: [{ value: 1, label: 'A' }, { value: 2, label: 'B' }], value: 1, renderLabel }
		});
		expect(renderLabel).toHaveBeenCalledTimes(2);

		// 选中项变化会让整列重新渲染
		await wrapper.setProps({ value: 2 });
		expect(renderLabel).toHaveBeenCalledTimes(2);

		// 数据项的 label 本身是函数时，同样只在数据变化后执行
		await wrapper.setProps({ renderLabel: void 0, data: [{ value: 1, label: 'A' }, { value: 2, label: rowLabel }] });
		expect(wrapper.find('.row-label').exists()).toBe(true);
		expect(rowLabel).toHaveBeenCalledTimes(1);
		await wrapper.setProps({ value: 1 });
		expect(rowLabel).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});
});

describe('禁用行', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	// a b c d e f：b、d、e 禁用
	const rows = ['a', 'b', 'c', 'd', 'e', 'f'].map(value => ({ value, disabled: ['b', 'd', 'e'].includes(value) }));
	const mountCol = (initial: string) => {
		const value = ref(initial);
		const onChange = vi.fn((row: any) => (value.value = row.value));
		const wrapper = mount(() => (
			<PickerCol value={value.value} data={rows} onChange={onChange} />
		), { attachTo: document.body });
		return { wrapper, onChange, value };
	};

	it('findEnabledIndex / resolveRow：向两侧找最近的可选行，距离相同时先找指定方向', () => {
		expect(findEnabledIndex(rows, 1)).toBe(2);
		expect(findEnabledIndex(rows, 1, -1)).toBe(0);
		expect(findEnabledIndex(rows, 3)).toBe(2);
		expect(findEnabledIndex(rows, 4)).toBe(5);
		expect(findEnabledIndex(rows, 99)).toBe(5);
		expect(findEnabledIndex(rows.map(row => ({ ...row, disabled: true })), 2)).toBe(-1);
		expect(findEnabledIndex([], 0)).toBe(-1);

		expect(resolveRow(rows, 'b')!.value).toBe('c');
		expect(resolveRow(rows, 'x')!.value).toBe('a');
		const allDisabled = rows.map(row => ({ ...row, disabled: true }));
		expect(resolveRow(allDisabled, 'c')!.value).toBe('c');
		expect(resolveRow(allDisabled, 'x')!.value).toBe('a');
	});

	it('禁用行带 is-disabled；点按禁用行不响应', async () => {
		const { wrapper, onChange } = mountCol('a');
		await flush();
		const items = wrapper.findAll('.vcm-picker-col__item');
		expect(items[1].classes()).toContain('is-disabled');
		expect(items[0].classes()).not.toContain('is-disabled');

		await items[1].trigger('click');
		expect(onChange).not.toHaveBeenCalled();

		await items[2].trigger('click');
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'c' }));
		wrapper.unmount();
	});

	it('拖动停在禁用行：回弹到最近的可选行，距离相同时取移动方向一侧', async () => {
		// 从 a 拖 1 行停在 b（禁用）：a、c 距离相同，取移动方向（向下一行）的 c
		const first = mountCol('a');
		await flush();
		await dragCol(first.wrapper.element, 0, -44);
		expect(first.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'c' }));
		first.wrapper.unmount();

		// 从 f 拖 1 行停在 e（禁用）：最近的可选行是 f（原位），值不变
		const second = mountCol('f');
		await flush();
		await dragCol(second.wrapper.element, 0, 44);
		expect(second.onChange).not.toHaveBeenCalled();
		second.wrapper.unmount();

		// 从 f 拖 2 行停在 d（禁用）：c、f 中 c 更近
		const third = mountCol('f');
		await flush();
		await dragCol(third.wrapper.element, 0, 88);
		expect(third.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'c' }));
		third.wrapper.unmount();
	});

	it('滚轮跳过禁用行；该方向上没有可选行时不阻止', async () => {
		const { wrapper, onChange } = mountCol('c');
		await flush();
		const wheel = (deltaY: number) => {
			const e = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true });
			wrapper.element.dispatchEvent(e);
			return e;
		};

		expect(wheel(100).defaultPrevented).toBe(true);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'f' }));
		await flush();

		expect(wheel(100).defaultPrevented).toBe(false);
		await sleep(200);

		expect(wheel(-100).defaultPrevented).toBe(true);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'c' }));
		wrapper.unmount();
	});

	it('PickerView：初始值为禁用值时显示最近的可选行，值不在数据里时取第一个可选行；联动的下级同样适用', async () => {
		const plain = mount(() => (
			<PickerView modelValue={['b']} data={rows} cascader={false} />
		), { attachTo: document.body });
		await flush();
		expect(plain.find('.vcm-picker-col__item.is-selected').text()).toBe('c');
		plain.unmount();

		const data = [
			{ value: 'x', disabled: true, children: [{ value: 'x1' }] },
			{
				value: 'y',
				children: [
					{ value: 'y1', disabled: true },
					{ value: 'y2' }
				]
			}
		];
		const value = ref<any[]>([]);
		const cascader = mount(() => (
			<PickerView v-model={value.value} data={data} columns={2} />
		), { attachTo: document.body });
		await flush();
		const selected = cascader.findAll('.vcm-picker-col__item.is-selected').map(item => item.text());
		expect(selected).toEqual(['y', 'y2']);
		cascader.unmount();
	});
});
