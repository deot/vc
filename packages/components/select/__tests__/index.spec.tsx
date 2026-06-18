// @vitest-environment jsdom

import { Select } from '@deot/vc-components';
import { Option } from '../option';
import { OptionGroup } from '../option-group';
import { SelectAll } from '../select-all';
import {
	escapeString,
	flattenData,
	getLabel,
	toCurrentValue,
	toModelValue
} from '../utils';
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

const cityList = [
	{ value: '1', label: 'New York' },
	{ value: '2', label: 'London' },
	{ value: '3', label: 'Sydney' },
	{ value: '4', label: 'Ottawa' },
	{ value: '5', label: 'Paris' },
	{ value: '6', label: 'Canberra' }
];

const groupedData = [
	{
		value: 'Hot Cities',
		children: [
			{ value: '1', label: 'New York' },
			{ value: '2', label: 'London' }
		]
	},
	{
		value: 'Other Cities',
		children: [
			{ value: '4', label: 'Ottawa' },
			{ value: '5', label: 'Paris' }
		]
	}
];

const getOptions = () => document.querySelectorAll('.vc-select-option');
const getOptionGroups = () => document.querySelectorAll('.vc-select-option-group');

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof Select).toBe('object');
	});

	it('create', () => {
		const wrapper = mount(() => (<Select />));
		expect(wrapper.classes()).toContain('vc-select');
		wrapper.unmount();
	});

	it('default placeholder', () => {
		const wrapper = mount(() => (<Select />));
		expect(wrapper.find('input').attributes('placeholder')).toBe('请选择');
		wrapper.unmount();
	});

	it('disabled adds is-disabled', () => {
		const wrapper = mount(() => (<Select disabled />));
		expect(wrapper.classes()).toContain('is-disabled');
		wrapper.unmount();
	});

	it('label prop renders prepend label', () => {
		const wrapper = mount(() => (<Select label="城市:" />));
		expect(wrapper.find('.vc-select__label').exists()).toBe(true);
		wrapper.unmount();
	});

	it('extra prop is shown when no value selected', () => {
		const wrapper = mount(() => (<Select extra="未选择" />));
		const input = wrapper.find('input').element as HTMLInputElement;
		expect(input.value).toBe('未选择');
		wrapper.unmount();
	});
});

describe('utils', () => {
	it('escapeString escapes regex special chars', () => {
		expect(escapeString('a.b')).toBe('a\\.b');
		expect(escapeString('a*b+c?d')).toBe('a\\*b\\+c\\?d');
		expect(escapeString('a^b$c')).toBe('a\\^b\\$c');
		expect(escapeString('a\\b')).toBe('a\\\\b');
		expect(escapeString('plain')).toBe('plain');
	});

	it('getLabel returns label by value', () => {
		expect(getLabel(cityList as any, '1')).toBe('New York');
		expect(getLabel(cityList as any, '999')).toBe('');
		expect(getLabel(cityList as any, '')).toBe('');
		expect(getLabel(cityList as any, undefined as any)).toBe('');
	});

	it('flattenData flattens with parent & cascader', () => {
		const flat = flattenData(groupedData as any, { parent: true, cascader: true });
		expect(flat.length).toBe(2 + 2 + 2);
		const values = (flat as any[]).map(i => i.value);
		expect(values).toContain('Hot Cities');
		expect(values).toContain('1');
	});

	it('flattenData flattens leaves only when no parent', () => {
		const flat = flattenData(groupedData as any, {});
		expect(flat.length).toBe(4);
	});

	it('toCurrentValue handles string', () => {
		expect(toCurrentValue('1,2', { numerable: false, separator: ',' } as any)).toEqual(['1', '2']);
		expect(toCurrentValue('1,2', { numerable: true, separator: ',' } as any)).toEqual([1, 2]);
		expect(toCurrentValue('', { numerable: false, separator: ',' } as any)).toEqual([]);
	});

	it('toCurrentValue handles array & primitive', () => {
		expect(toCurrentValue(['1', '2'], { numerable: false, separator: ',' } as any)).toEqual(['1', '2']);
		expect(toCurrentValue(1 as any, { numerable: false, separator: ',' } as any)).toEqual([1]);
		expect(toCurrentValue(undefined, { numerable: false, separator: ',' } as any)).toEqual([]);
		expect(toCurrentValue(null as any, { numerable: false, separator: ',' } as any)).toEqual([]);
	});

	it('toModelValue: array input returns array', () => {
		const r = toModelValue(['1', '2'], { modelValue: ['1', '2'], max: 5, separator: ',', numerable: false, nullValue: undefined } as any);
		expect(r).toEqual(['1', '2']);
	});

	it('toModelValue: string input single returns first item', () => {
		const r = toModelValue(['1'], { modelValue: '', max: 1, separator: ',', numerable: false, nullValue: undefined } as any);
		expect(r).toBe('1');
	});

	it('toModelValue: string input multi returns joined', () => {
		const r = toModelValue(['1', '2'], { modelValue: '', max: 5, separator: ',', numerable: false, nullValue: undefined } as any);
		expect(r).toBe('1,2');
	});

	it('toModelValue: numerable string keeps stringified value', () => {
		const r = toModelValue([1, 2], { modelValue: '', max: 5, separator: ',', numerable: true, nullValue: undefined } as any);
		expect(r).toBe('1,2');
	});
});

describe('Select interaction', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('toggle dropdown visible on click', async () => {
		const wrapper = mount(() => (<Select data={cityList} />), { attachTo: document.body });
		await nextTick();

		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();

		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.vc-popover-wrapper')).not.toBeNull();
		expect(getOptions().length).toBe(cityList.length);

		wrapper.unmount();
	});

	it('renders default value label in input', async () => {
		const value = ref<any>('1');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input').element as HTMLInputElement;
		expect(input.value).toBe('New York');

		wrapper.unmount();
	});

	it('selecting a single option emits change & update:modelValue and closes', async () => {
		const onChange = vi.fn();
		const value = ref<any>('');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} onChange={onChange} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const opt = getOptions()[2] as HTMLElement;
		opt.click();
		await flush();

		expect(value.value).toBe('3');
		expect(onChange).toHaveBeenCalled();
		const popoverWrapper = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(popoverWrapper.style.display).toBe('none');

		wrapper.unmount();
	});

	it('clicking already selected option closes the popover', async () => {
		const value = ref<any>('1');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const popoverWrapper = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(popoverWrapper.style.display).not.toBe('none');

		const opt = getOptions()[0] as HTMLElement;
		opt.click();
		await flush();

		expect(popoverWrapper.style.display).toBe('none');
		expect(value.value).toBe('1');

		wrapper.unmount();
	});

	it('disabled option is not clickable', async () => {
		const onChange = vi.fn();
		const value = ref<any>('');
		const data = cityList.map((i, index) => ({ ...i, disabled: index === 1 }));
		const wrapper = mount(() => (
			<Select v-model={value.value} data={data} onChange={onChange} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const opt = getOptions()[1] as HTMLElement;
		opt.click();
		await flush();

		expect(value.value).toBe('');
		expect(onChange).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('disabled select does not open popover', async () => {
		const wrapper = mount(() => (
			<Select disabled data={cityList} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();

		wrapper.unmount();
	});

	it('clearable: hover & click clear icon empties value', async () => {
		const onClear = vi.fn();
		const value = ref<any>('1');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} clearable onClear={onClear} />
		), { attachTo: document.body });
		await nextTick();

		fireMouse(wrapper.element, 'mouseenter');
		await nextTick();

		const icon = wrapper.find('.vc-select__icon');
		expect(icon.exists()).toBe(true);
		await icon.trigger('click');
		await flush();

		expect(value.value).toBe(undefined);
		expect(onClear).toHaveBeenCalled();
		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');

		wrapper.unmount();
	});

	it('clearable does nothing when not hovered', async () => {
		const onClear = vi.fn();
		const value = ref<any>('1');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} clearable onClear={onClear} />
		), { attachTo: document.body });
		await nextTick();

		const icon = wrapper.find('.vc-select__icon');
		await icon.trigger('click');
		await flush();

		expect(value.value).toBe('1');
		expect(onClear).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('mouseleave hides clear icon', async () => {
		const value = ref<any>('1');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} clearable />
		), { attachTo: document.body });
		await nextTick();

		fireMouse(wrapper.element, 'mouseenter');
		await nextTick();
		expect(wrapper.find('.vc-select__icon').classes()).not.toContain('is-arrow');

		fireMouse(wrapper.element, 'mouseleave');
		await nextTick();
		expect(wrapper.find('.vc-select__icon').classes()).toContain('is-arrow');

		wrapper.unmount();
	});

	it('emits ready / close / visible-change', async () => {
		const onReady = vi.fn();
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<Select
				data={cityList}
				onReady={onReady}
				onVisibleChange={onVisibleChange}
			/>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(onReady).toHaveBeenCalled();
		expect(onVisibleChange).toHaveBeenCalledWith(true);

		await wrapper.trigger('click');
		await flush();
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);

		wrapper.unmount();
	});

	it('async modelValue updates input label', async () => {
		const value = ref<any>('');
		const data = ref<any[]>([]);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={data.value} />
		), { attachTo: document.body });
		await nextTick();

		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');

		data.value = cityList;
		value.value = '1';
		await flush();

		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('New York');

		wrapper.unmount();
	});
});

describe('Select multiple', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('multiple selects multiple values, popover stays open', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		(getOptions()[0] as HTMLElement).click();
		await flush();
		(getOptions()[2] as HTMLElement).click();
		await flush();

		expect(value.value).toEqual(['1', '3']);

		const popoverWrapper = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(popoverWrapper.style.display).not.toBe('none');

		wrapper.unmount();
	});

	it('multiple unselects on second click', async () => {
		const value = ref<any[]>(['1']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		(getOptions()[0] as HTMLElement).click();
		await flush();

		expect(value.value).toEqual([]);

		wrapper.unmount();
	});

	it('multiple renders tags & remove via close button', async () => {
		const value = ref<any[]>(['1', '4']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} />
		), { attachTo: document.body });
		await nextTick();

		const tags = wrapper.findAll('.vc-tag');
		expect(tags.length).toBe(2);

		const close = tags[0].find('.vc-tag__close');
		expect(close.exists()).toBe(true);
		await close.trigger('click');
		await flush();

		expect(value.value).toEqual(['4']);

		wrapper.unmount();
	});

	it('multiple maxTags collapses extra tags', async () => {
		const value = ref<any[]>(['1', '2', '3']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} maxTags={1} />
		), { attachTo: document.body });
		await nextTick();

		const tags = wrapper.findAll('.vc-tag');
		expect(tags.length).toBe(2);
		expect(tags[1].text()).toContain('+2');

		wrapper.unmount();
	});

	it('multiple-string mode (string with separator) reads/writes string', async () => {
		const onChange = vi.fn();
		const value = ref<any>('');
		const wrapper = mount(() => (
			<Select
				v-model={value.value}
				data={cityList}
				max={2}
				onChange={onChange}
			/>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		(getOptions()[0] as HTMLElement).click();
		await flush();
		(getOptions()[2] as HTMLElement).click();
		await flush();

		expect(typeof value.value).toBe('string');
		expect(value.value).toBe('1,3');
		expect(onChange).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('multiple clearable empties tags', async () => {
		const value = ref<any[]>(['1', '2']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} clearable />
		), { attachTo: document.body });
		await nextTick();

		fireMouse(wrapper.element, 'mouseenter');
		await nextTick();

		const icon = wrapper.find('.vc-select__icon');
		await icon.trigger('click');
		await flush();

		expect(value.value).toEqual([]);
		expect(wrapper.findAll('.vc-tag').length).toBe(0);

		wrapper.unmount();
	});
});

describe('Select grouped & search', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders option groups', async () => {
		const wrapper = mount(() => (
			<Select data={groupedData} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(getOptionGroups().length).toBe(2);
		expect(getOptions().length).toBe(4);
		const titles = document.querySelectorAll('.vc-select-option-group__title');
		expect(titles[0].textContent).toBe('Hot Cities');

		wrapper.unmount();
	});

	it('searchable: filters options by input text', async () => {
		const wrapper = mount(() => (
			<Select data={cityList} searchable />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const search = document.querySelector('.vc-select__search input') as HTMLInputElement;
		expect(search).not.toBeNull();

		search.value = 'New';
		search.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();

		const visible = Array.from(getOptions()).map(o => o.textContent);
		expect(visible.length).toBe(1);
		expect(visible[0]).toContain('New York');

		wrapper.unmount();
	});

	it('filterable=false option always renders', async () => {
		const data = [
			{ value: '1', label: 'New York' },
			{ value: 'always', label: 'Always Visible', filterable: false }
		];
		const wrapper = mount(() => (
			<Select data={data} searchable />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const search = document.querySelector('.vc-select__search input') as HTMLInputElement;
		search.value = 'zzz_no_match';
		search.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();

		const visible = Array.from(getOptions()).map(o => o.textContent);
		expect(visible.length).toBe(1);
		expect(visible[0]).toContain('Always Visible');

		wrapper.unmount();
	});

	it('searchable + multiple shows SelectAll', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} searchable />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.vc-select-all')).toBeNull();

		const search = document.querySelector('.vc-select__search input') as HTMLInputElement;
		search.value = 'a';
		search.dispatchEvent(new Event('input', { bubbles: true }));
		await flush();

		const selectAll = document.querySelector('.vc-select-all') as HTMLElement;
		expect(selectAll).not.toBeNull();
		expect(selectAll.textContent).toBe('全选');

		selectAll.click();
		await flush();
		expect(value.value.length).toBeGreaterThan(0);
		expect(document.querySelector('.vc-select-all')!.textContent).toBe('取消全选');

		(document.querySelector('.vc-select-all') as HTMLElement).click();
		await flush();
		expect(value.value).toEqual([]);

		wrapper.unmount();
	});

	it('loadData triggers loading spin', async () => {
		const loadData = vi.fn(() => new Promise<void>(resolve => setTimeout(resolve, 350)));
		const wrapper = mount(() => (
			<Select data={cityList} searchable loadData={loadData} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const search = document.querySelector('.vc-select__search input') as HTMLInputElement;
		search.value = 'foo';
		search.dispatchEvent(new Event('input', { bubbles: true }));

		// debounce 250ms，Promise 需长于 debounce 才能在触发后仍看到 loading
		await sleep(280);
		await flush();
		expect(loadData).toHaveBeenCalled();

		expect(document.querySelector('.vc-select__loading')).not.toBeNull();
		await sleep(400);
		await flush();
		expect(document.querySelector('.vc-select__loading')).toBeNull();

		wrapper.unmount();
	});

	it('loadData throws if it does not return a Promise', async () => {
		vi.useFakeTimers();
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const loadData = vi.fn(() => undefined as any);
		const wrapper = mount(() => (
			<Select data={cityList} searchable loadData={loadData} />
		), { attachTo: document.body });
		try {
			await nextTick();

			await wrapper.trigger('click');
			await nextTick();

			const search = document.querySelector('.vc-select__search input') as HTMLInputElement;
			search.value = 'foo';
			search.dispatchEvent(new Event('input', { bubbles: true }));

			expect(() => {
				vi.advanceTimersByTime(300);
			}).toThrow(/loadData/);

			expect(loadData).toHaveBeenCalled();
		} finally {
			errSpy.mockRestore();
			vi.useRealTimers();
			wrapper.unmount();
		}
	});
});

describe('Select expose & misc', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('exposes toggle to control popover visibility', async () => {
		const wrapper = mount(Select, { props: { data: cityList }, attachTo: document.body });
		await nextTick();

		const vm = wrapper.vm as any;
		expect(vm.isActive).toBe(false);

		vm.toggle();
		await flush();
		expect(vm.isActive).toBe(true);

		vm.toggle(false);
		await flush();
		expect(vm.isActive).toBe(false);

		vm.toggle(true);
		await flush();
		expect(vm.isActive).toBe(true);

		wrapper.unmount();
	});

	it('renderOption uses custom renderer', async () => {
		const renderOption = vi.fn(({ row }: any) => {
			return (<div class="custom-opt">{ `[${row.label}]` }</div>) as any;
		});
		const wrapper = mount(() => (
			<Select data={cityList} renderOption={renderOption} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const opts = document.querySelectorAll('.custom-opt');
		expect(opts.length).toBe(cityList.length);
		expect(opts[0].textContent).toBe('[New York]');

		wrapper.unmount();
	});

	it('renderOptionGroup uses custom renderer', async () => {
		const renderOptionGroup = vi.fn(({ row }: any) => {
			return (<div class="custom-group">{ `<${row.value}>` }</div>) as any;
		});
		const wrapper = mount(() => (
			<Select data={groupedData} renderOptionGroup={renderOptionGroup} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const groups = document.querySelectorAll('.custom-group');
		expect(groups.length).toBe(2);
		expect(groups[0].textContent).toBe('<Hot Cities>');

		wrapper.unmount();
	});

	it('renderLabel uses custom renderer', async () => {
		const renderLabel = vi.fn(({ row }: any) => {
			return (<div class="custom-label">{ `(${row.label})` }</div>) as any;
		});
		const wrapper = mount(() => (
			<Select data={cityList} renderLabel={renderLabel} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const labels = document.querySelectorAll('.custom-label');
		expect(labels.length).toBe(cityList.length);
		expect(labels[0].textContent).toBe('(New York)');

		wrapper.unmount();
	});

	it('label slot uses custom renderer', async () => {
		const label = vi.fn(({ row }: any) => {
			return (<div class="slot-label">{ `*${row.label}*` }</div>) as any;
		});
		const wrapper = mount(() => (
			<Select data={cityList}>
				{{ label }}
			</Select>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const labels = document.querySelectorAll('.slot-label');
		expect(labels.length).toBe(cityList.length);
		expect(labels[0].textContent).toBe('*New York*');
		expect(label).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('label slot renders custom group title', async () => {
		const wrapper = mount(() => (
			<Select data={groupedData}>
				{{
					label: ({ row, store }: any) => (
						store?.group
							? (<div class="slot-group-label">{ `G:${row.value}` }</div>)
							: (<span class="slot-opt-label">{ row.label }</span>)
					)
				}}
			</Select>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const groupLabels = document.querySelectorAll('.slot-group-label');
		expect(groupLabels.length).toBe(2);
		expect(groupLabels[0].textContent).toBe('G:Hot Cities');

		const optLabels = document.querySelectorAll('.slot-opt-label');
		expect(optLabels.length).toBe(4);
		expect(optLabels[0].textContent).toBe('New York');

		wrapper.unmount();
	});

	it('default option group title uses option-group__title', async () => {
		const wrapper = mount(() => (
			<Select data={groupedData} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(document.querySelectorAll('.vc-select-option-group__title').length).toBe(2);
		wrapper.unmount();
	});

	it('numerable string array round-trip', async () => {
		const value = ref<any>('1,2');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} numerable />
		), { attachTo: document.body });
		await nextTick();

		const tags = wrapper.findAll('.vc-tag');
		expect(tags.length).toBe(2);

		wrapper.unmount();
	});
});

describe('Option / OptionGroup / SelectAll components', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('Option requires being inside Select; renders inside Select', async () => {
		const wrapper = mount(() => (
			<Select data={cityList} />
		), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();

		const first = document.querySelector('.vc-select-option');
		expect(first).not.toBeNull();
		expect(first?.textContent).toContain('New York');

		wrapper.unmount();
	});

	it('Option is exported', () => {
		expect(typeof Option).toBe('object');
		expect(typeof OptionGroup).toBe('object');
		expect(typeof SelectAll).toBe('object');
	});

	it('SelectAll renders nothing when no selectable options', () => {
		const wrapper = mount(SelectAll, { props: { data: [] } });
		expect(wrapper.html()).toBe('');
		wrapper.unmount();
	});
});
