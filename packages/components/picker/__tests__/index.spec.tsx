// @vitest-environment jsdom

import { MPicker, MPickerPopup, MPickerView, Picker, PickerPopup, PickerView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { MPopup } from '../../popup/index.m';
import { toCurrentValue, toModelValue } from '../../select/utils';
import { PickerCol } from '../mobile/picker-col';
import { PickerCore } from '../mobile/picker-core';
import { props as pickerProps } from '../mobile/picker-props';
import { props as pickerViewProps } from '../mobile/picker-view-props';
import {
	getRowLabel,
	getSelectedData,
	isColumnGroup,
	makeColumnData,
	normalizeRow
} from '../mobile/utils';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const dragCol = async (el: Element, from: number, to: number) => {
	el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, screenY: from }));
	el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, screenY: to }));
	el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, screenY: to }));
	await flush();
};

const touchCol = async (el: Element, from: number, to: number) => {
	el.dispatchEvent(new TouchEvent('touchstart', {
		bubbles: true,
		cancelable: true,
		touches: [{ screenY: from } as Touch]
	}));
	el.dispatchEvent(new TouchEvent('touchmove', {
		bubbles: true,
		cancelable: true,
		touches: [{ screenY: to } as Touch]
	}));
	el.dispatchEvent(new TouchEvent('touchend', {
		bubbles: true,
		cancelable: true,
		changedTouches: [{ screenY: to } as Touch]
	}));
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
				cols={3}
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
			<Picker modelValue={['zhejiang', 'hangzhou', 'xihu']} data={regionData} cols={3}>
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
				cols={3}
				onChange={onChange}
				onPickerChange={onPickerChange}
			/>
		));
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
				cols={2}
				onChange={onChange}
			/>
		));
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

	it('supports string modelValue with separator', async () => {
		const value = ref<any>('2026|spring');
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<PickerView
				v-model={value.value}
				data={seasonData}
				cascader={false}
				cols={2}
				separator="|"
				onChange={onChange}
			/>
		));
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
				cols={2}
				renderLabel={renderLabel}
			/>
		), {
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
			<PickerView data={data.value} cascader={false} cols={1} />
		));
		await flush();

		expect(wrapper.findAll('.vcm-picker-col__item')).toHaveLength(0);

		data.value = [[{ value: 'a', label: 'A' }]];
		await flush();

		expect(wrapper.find('.vcm-picker-col__item').text()).toBe('A');

		wrapper.unmount();
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

	it('handles empty data and clamps to first item', async () => {
		const emptyChange = vi.fn();
		const emptyWrapper = mount(() => <PickerCol onChange={emptyChange} />);
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
		));
		await flush();

		await dragCol(wrapper.element, 0, 40);
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'a' }));

		wrapper.unmount();
	});

	it('uses speed calculation for medium-duration drags', async () => {
		vi.useFakeTimers();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<PickerCol
				value="a"
				data={[
					{ value: 'a', label: 'A' },
					{ value: 'b', label: 'B' },
					{ value: 'c', label: 'C' }
				]}
				onChange={onChange}
			/>
		));
		await nextTick();

		wrapper.element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, screenY: 0 }));
		vi.advanceTimersByTime(100);
		wrapper.element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, screenY: -10 }));
		await nextTick();

		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'b' }));

		wrapper.unmount();
	});
});

describe('PickerPopup', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('supports visible alias and emits cancel/update events', async () => {
		const onCancel = vi.fn();
		const onVisibleChange = vi.fn();
		const onUpdateVisible = vi.fn();
		const wrapper = mount(() => (
			<PickerPopup
				visible
				title="<b class='title-inner'>标题</b>"
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
				cols: 3
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
				cols: 3
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
				cols={3}
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

	it('Picker reads and writes string modelValue', async () => {
		const value = ref<any>('zhejiang,hangzhou,xihu');
		const onOk = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Picker
				v-model={value.value}
				data={regionData}
				cols={3}
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
			<Picker data={regionData} cols={3} onCancel={onCancel} />
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
			<Picker data={data.value} cols={3} loadData={loadData} />
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
			cols: 3,
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
			cols: 3,
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
