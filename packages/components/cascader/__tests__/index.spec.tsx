// @vitest-environment jsdom

import { Cascader, MCascader } from '@deot/vc-components';
import { CascaderView } from '../cascader-view';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const fireMouse = (
	el: Element,
	type: 'mouseenter' | 'mouseleave' | 'mousedown' | 'mouseup' | 'click'
) => {
	el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
};

const getCols = () => document.querySelectorAll('.vc-cascader-column');
const getCells = (i: number) => getCols()[i]?.querySelectorAll('.vc-cascader-column__item') || ([] as any);

const options = [
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
				label: 'NingBo',
				children: [
					{ value: 'jiangbei', label: 'Jiang Bei' },
					{ value: 'jiangdong', label: 'Jiang Dong' }
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

const flatOptions = [
	{ value: 'beijing', label: '北京' },
	{ value: 'suzhou', label: '苏州' }
];

const selectedValue = ['zhejiang', 'hangzhou', 'xihu'];

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof Cascader).toBe('object');
		expect(MCascader).toBe(Cascader);
	});

	it('create', async () => {
		const wrapper = mount(() => (<Cascader />));
		await nextTick();

		expect(wrapper.classes()).toContain('vc-cascader');
		expect(wrapper.find('input').attributes('placeholder')).toBe('请选择');

		wrapper.unmount();
	});
});

describe('Cascader interaction', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('toggle dropdown visible', async () => {
		const wrapper = mount(() => (<Cascader data={options} />), { attachTo: document.body });
		await nextTick();

		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();

		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.vc-popover-wrapper')).not.toBeNull();

		wrapper.unmount();
	});

	it('expand: render only one column when single-level data', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={flatOptions} clearable />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(getCols().length).toBe(1);
		expect(getCells(0).length).toBe(2);

		wrapper.unmount();
	});

	it('with default value', async () => {
		const value = ref([...selectedValue]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input').element as HTMLInputElement;
		expect(input.value).toBe('Zhejiang / Hangzhou / West Lake');

		await wrapper.trigger('click');
		await flush();

		expect(getCols().length).toBe(3);

		wrapper.unmount();
	});

	it('empty data when dataSource is empty', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const content = document.querySelector('.vc-cascader__content');
		expect(content).not.toBeNull();
		expect(content?.children.length).toBe(0);

		wrapper.unmount();
	});

	it('async set selected value: input label updates reactively', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input').element as HTMLInputElement;
		expect(input.value).toBe('');

		value.value = [...selectedValue];
		await flush();

		expect(input.value).toBe('Zhejiang / Hangzhou / West Lake');

		wrapper.unmount();
	});

	it('cell mouseenter highlights and click syncs value', async () => {
		const value = ref<any[]>([...selectedValue]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const lastCol = getCells(2);
		expect(lastCol.length).toBe(2);

		const target = lastCol[1] as HTMLElement;
		fireMouse(target, 'mouseenter');
		await flush();
		expect(getCells(2)[1].className).toContain('is-select');

		(target as HTMLElement).click();
		await flush();
		expect(value.value[2]).toBe('binjiang');

		wrapper.unmount();
	});

	it('emits change & update:modelValue when selecting a leaf', async () => {
		const onChange = vi.fn();
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} onChange={onChange} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const cellInCol0 = getCells(0)[0] as HTMLElement; // zhejiang
		fireMouse(cellInCol0, 'mouseenter');
		await flush();
		cellInCol0.click();
		await flush();

		const cellInCol1 = getCells(1)[0] as HTMLElement; // hangzhou
		fireMouse(cellInCol1, 'mouseenter');
		await flush();
		cellInCol1.click();
		await flush();

		const cellInCol2 = getCells(2)[0] as HTMLElement; // xihu (leaf)
		fireMouse(cellInCol2, 'mouseenter');
		await flush();
		cellInCol2.click();
		await flush();

		expect(onChange).toHaveBeenCalled();
		expect(value.value).toEqual(['zhejiang', 'hangzhou', 'xihu']);

		wrapper.unmount();
	});

	it('changeOnSelect emits on every cell click', async () => {
		const onChange = vi.fn();
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} change-on-select onChange={onChange} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const cell = getCells(0)[0] as HTMLElement; // zhejiang (parent)
		fireMouse(cell, 'mouseenter');
		await flush();
		cell.click();
		await flush();

		expect(onChange).toHaveBeenCalled();
		const last = onChange.mock.calls[onChange.mock.calls.length - 1];
		expect(last[0]).toEqual(['zhejiang']);

		wrapper.unmount();
	});

	it('format prop customizes the displayed label', async () => {
		const value = ref([...selectedValue]);
		const wrapper = mount(() => (
			<Cascader
				v-model={value.value}
				data={options}
				formatter={(v: string[]) => v.join('-')}
			/>
		), { attachTo: document.body });
		await nextTick();

		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Zhejiang-Hangzhou-West Lake');

		wrapper.unmount();
	});

	it('extra prop is shown when no value selected', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} extra="未选择" />
		), { attachTo: document.body });
		await nextTick();

		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('未选择');

		wrapper.unmount();
	});

	it('disabled: cannot open and clear icon does nothing', async () => {
		const value = ref<any[]>(['beijing']);
		const wrapper = mount(() => (
			<Cascader
				v-model={value.value}
				data={flatOptions}
				disabled
				clearable
			/>
		), { attachTo: document.body });
		await nextTick();

		expect(wrapper.find('.vc-input').classes()).toContain('is-disabled');

		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();

		const icon = wrapper.find('.vc-cascader__icon');
		expect(icon.exists()).toBe(true);
		await icon.trigger('click');
		await flush();
		expect(value.value.length).toBe(1);

		wrapper.unmount();
	});

	it('clearable: hover & click clear icon empties value', async () => {
		const value = ref([...selectedValue]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} clearable />
		), { attachTo: document.body });
		await nextTick();

		fireMouse(wrapper.element, 'mouseenter');
		await nextTick();

		const icon = wrapper.find('.vc-cascader__icon');
		expect(icon.exists()).toBe(true);
		await icon.trigger('click');
		await flush();

		expect(value.value.length).toBe(0);
		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');

		wrapper.unmount();
	});

	it('async load data', async () => {
		const loadData = vi.fn(() => {
			return new Promise<any[]>((resolve) => {
				setTimeout(() => {
					resolve([
						{ value: 'gugong', label: '故宫' },
						{ value: 'tiantan', label: '天坛' },
						{ value: 'wangfujing', label: '王府井' }
					]);
				}, 0);
			});
		});
		const value = ref<any[]>([]);
		const data = ref<any[]>([
			{ value: 'beijing', label: '北京', loading: false, children: [] }
		]);
		const wrapper = mount(() => (
			<Cascader
				v-model={value.value}
				data={data.value}
				loadData={loadData}
				clearable
			/>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(getCols().length).toBe(1);
		const cell = getCells(0)[0] as HTMLElement;
		fireMouse(cell, 'mouseenter');

		// 等待 loadData 异步完成
		await sleep(10);
		await flush();

		expect(loadData).toHaveBeenCalled();
		expect(getCols().length).toBe(2);
		expect(getCells(1).length).toBe(3);

		wrapper.unmount();
	});

	it('emits visible-change when popover opens', async () => {
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<Cascader data={options} onVisibleChange={onVisibleChange} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(onVisibleChange).toHaveBeenCalled();
		expect(onVisibleChange.mock.calls[onVisibleChange.mock.calls.length - 1][0]).toBe(true);

		wrapper.unmount();
	});

	it('hides popover after selecting a leaf', async () => {
		const value = ref([...selectedValue]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const popoverWrapper = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(popoverWrapper).not.toBeNull();
		expect(popoverWrapper.style.display).not.toBe('none');

		// 选择一个 leaf 触发 sync(isLast=true) 关闭面板
		const cell = getCells(2)[0] as HTMLElement;
		fireMouse(cell, 'mouseenter');
		await flush();
		cell.click();
		await flush();

		// vShow 设置 display:none
		expect(popoverWrapper.style.display).toBe('none');

		wrapper.unmount();
	});
});

describe('CascaderView', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof CascaderView).toBe('object');
	});

	it('renders root class', () => {
		const wrapper = mount(() => (<CascaderView />));
		expect(wrapper.classes()).toContain('vc-cascader-view');
		wrapper.unmount();
	});

	it('renders default slot', () => {
		const wrapper = mount(() => (
			<CascaderView>
				{{ default: () => <span class="cv-slot">slot</span> }}
			</CascaderView>
		));
		expect(wrapper.find('.cv-slot').exists()).toBe(true);
		expect(wrapper.find('.cv-slot').text()).toBe('slot');
		wrapper.unmount();
	});
});
