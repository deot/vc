// @vitest-environment jsdom

import { Select, MSelect, VcInstance, Popover } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { Option } from '../option';
import { OptionGroup } from '../option-group';
import { SelectAll } from '../select-all';
import {
	createSearchRegex,
	escapeString,
	fitTags,
	flattenData,
	getLabel,
	toCurrentValue,
	toModelValue
} from '../utils';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi, onTestFinished } from 'vitest';

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

describe('Select locale', () => {
	it('updates placeholder and select-all actions when locale changes', async () => {
		const locale = VcInstance.options.locale;
		VcInstance.configure({ locale: zhCN });
		const wrapper = mount(Select, {
			props: { data: cityList, max: 5, searchable: true },
			attachTo: document.body
		});
		try {
			expect(MSelect).toBe(Select);
			expect(wrapper.find('input').attributes('placeholder')).toBe('请选择');
			await wrapper.trigger('click');
			await flush();
			const search = document.querySelector('.vc-select__search input') as HTMLInputElement;
			search.value = 'New';
			search.dispatchEvent(new Event('input', { bubbles: true }));
			await flush();
			expect(document.querySelector('.vc-select-all')!.textContent).toBe('全选');
			VcInstance.configure({ locale: enUS });
			await nextTick();
			expect(wrapper.find('input').attributes('placeholder')).toBe('Please select');
			expect(document.querySelector('.vc-select-all')!.textContent).toBe('Select all');
			(document.querySelector('.vc-select-all') as HTMLElement).click();
			await flush();
			expect(document.querySelector('.vc-select-all')!.textContent).toBe('Deselect all');
			VcInstance.configure({ locale: zhCN });
			await nextTick();
			expect(document.querySelector('.vc-select-all')!.textContent).toBe('取消全选');
		} finally {
			wrapper.unmount();
			VcInstance.configure({ locale });
		}
	});

	it('preserves custom and empty placeholders', async () => {
		const placeholder = ref('选择城市');
		const locale = VcInstance.options.locale;
		const wrapper = mount(() => <Select {...{ placeholder: placeholder.value }} />);
		try {
			VcInstance.configure({ locale: enUS });
			await nextTick();
			expect(wrapper.find('input').attributes('placeholder')).toBe('选择城市');
			placeholder.value = '';
			await nextTick();
			expect(wrapper.find('input').attributes('placeholder')).toBe('');
		} finally {
			wrapper.unmount();
			VcInstance.configure({ locale });
		}
	});
});

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
		expect(escapeString('(a)[b]{c}|d')).toBe('\\(a\\)\\[b\\]\\{c\\}\\|d');
	});

	it('createSearchRegex matches any word and never throws', () => {
		const regex = createSearchRegex(' a  b,c ');
		expect(regex.test('xbx')).toBe(true);
		expect(regex.test('xyz')).toBe(false);
		expect(createSearchRegex('a,').test('xyz')).toBe(false);
		expect(createSearchRegex('').test('anything')).toBe(true);
		expect(() => createSearchRegex('(')).not.toThrow();
		expect(() => createSearchRegex('[')).not.toThrow();
		expect(createSearchRegex('(1)').test('a(1)b')).toBe(true);
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

	it('fitTags: all tags fit without collapse tag', () => {
		expect(fitTags({ widths: [50, 50], width: 200, lines: 1, plusWidth: 30, total: 2 })).toEqual({ count: 2 });
	});

	it('fitTags: candidates limited by maxTags keep room for collapse tag', () => {
		expect(fitTags({ widths: [50, 50], width: 200, lines: 1, plusWidth: 30, total: 5 })).toEqual({ count: 2 });
	});

	it('fitTags: drops tags until collapse tag fits on the last row', () => {
		expect(fitTags({ widths: [80, 60, 60, 60], width: 200, lines: 1, plusWidth: 50, total: 6 })).toEqual({ count: 2 });
	});

	it('fitTags: shrinks the only tag on the last row', () => {
		expect(fitTags({ widths: [300, 60], width: 100, lines: 1, plusWidth: 50, total: 2 })).toEqual({ count: 1, shrink: 50 });
		expect(fitTags({ widths: [80, 60], width: 100, lines: 1, plusWidth: 50, total: 2 })).toEqual({ count: 1, shrink: 50 });
	});

	it('fitTags: keeps only the collapse tag when the shrunk tag would be narrower than it', () => {
		expect(fitTags({ widths: [80, 60], width: 80, lines: 1, plusWidth: 50, total: 2 })).toEqual({ count: 0 });
		// 多行：去掉最后一行的 tag，折叠 tag 独占最后一行
		expect(fitTags({ widths: [60, 200], width: 80, lines: 2, plusWidth: 50, total: 3 })).toEqual({ count: 1 });
	});

	it('fitTags: packs multiple lines', () => {
		expect(fitTags({ widths: [80, 60, 60, 60, 50, 80], width: 150, lines: 2, plusWidth: 50, total: 6 })).toEqual({ count: 3 });
	});

	it('fitTags: collapse tag may wrap to a spare line', () => {
		expect(fitTags({ widths: [100], width: 120, lines: 2, plusWidth: 50, total: 5 })).toEqual({ count: 1 });
	});

	it('fitTags: falls back to all candidates without layout', () => {
		expect(fitTags({ widths: [50, 50], width: 0, lines: 1, plusWidth: 30, total: 5 })).toEqual({ count: 2 });
		expect(fitTags({ widths: [50, 50], width: 200, lines: 0, plusWidth: 30, total: 5 })).toEqual({ count: 2 });
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

	it('portal=false 时下拉挂到组件根节点内，点击下拉内部不会关闭', async () => {
		const wrapper = mount(() => (<Select data={cityList} portal={false} />), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();

		const popup = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(wrapper.element.contains(popup)).toBe(true);

		// 下拉在根节点内，点击会冒泡到触发区
		popup.querySelector<HTMLElement>('.vc-popover-wrapper__container')!.click();
		await flush();
		expect(popup.style.display).not.toBe('none');

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

	it('multiple: clicking tag toggles popover', async () => {
		const value = ref<any[]>(['1', '4']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.find('.vc-tag').trigger('click');
		await flush();

		const popover = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(popover).not.toBeNull();
		expect(popover.style.display).not.toBe('none');

		await wrapper.find('.vc-tag').trigger('click');
		await flush();

		expect(popover.style.display).toBe('none');

		wrapper.unmount();
	});

	it('multiple: clicking tag close does not open popover', async () => {
		const value = ref<any[]>(['1', '4']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.find('.vc-tag__close').trigger('click');
		await flush();

		expect(value.value).toEqual(['4']);
		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();

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

describe('Select maxTagLines', () => {
	// jsdom 无布局：容器宽度可控，tag 按文字长度 * 10 计宽，margin / padding 为 0
	const containerWidth = ref(200);
	let spy: any;

	const getTags = (wrapper: any) => wrapper.findAll('.vc-select-tags > .vc-tag');
	const getTexts = (wrapper: any) => getTags(wrapper).map((i: any) => i.text());

	beforeEach(() => {
		containerWidth.value = 200;
		spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
			const { classList } = this;
			const width = classList.contains('vc-select-tags')
				? containerWidth.value
				: classList.contains('vc-tag')
					? (this.textContent || '').length * 10
					: classList.contains('vc-select-tags__list') ? 300 : 0;
			const height = classList.contains('vc-select-tags__list') ? 60 : 0;
			return { width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
		});
	});

	afterEach(() => {
		spy.mockRestore();
		document.body.innerHTML = '';
	});

	it('single line by default: shows tags that fit plus collapse tag', async () => {
		const value = ref<any[]>(['1', '2', '3', '4', '5', '6']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} maxTags={4} />
		), { attachTo: document.body });
		await flush();

		// New York(80) + London(60) + '+6...'(50) <= 200
		expect(getTexts(wrapper)).toEqual(['New York', 'London', '+4...']);
		expect(wrapper.find('.vc-select-tags').classes()).toContain('is-nowrap');
		// 测量层仅在待测量时渲染
		expect(wrapper.find('.vc-select-tags__measure').exists()).toBe(false);

		wrapper.unmount();
	});

	it('shrinks the first tag when even one tag does not fit', async () => {
		const value = ref<any[]>(['x', '1']);
		const data = [{ value: 'x', label: 'x'.repeat(30) }, ...cityList];
		containerWidth.value = 100;
		const wrapper = mount(() => (
			<Select v-model={value.value} data={data} max={99} />
		), { attachTo: document.body });
		await flush();

		const tags = getTags(wrapper);
		expect(tags.length).toBe(2);
		expect((tags[0].element as HTMLElement).style.maxWidth).toBe('50px');
		expect(tags[1].text()).toBe('+1...');

		wrapper.unmount();
	});

	it('refits on container resize', async () => {
		const value = ref<any[]>(['1', '2', '3', '4', '5', '6']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} />
		), { attachTo: document.body });
		await flush();
		expect(getTags(wrapper).length).toBe(3);

		containerWidth.value = 1000;
		const el = wrapper.find('.vc-select-tags').element as any;
		el.__rz__.ro.trigger(el);
		await flush();

		expect(getTexts(wrapper)).toEqual(['New York', 'London', 'Sydney', 'Ottawa', 'Paris', 'Canberra']);

		wrapper.unmount();
	});

	it('maxTagLines = 2 packs two lines', async () => {
		const value = ref<any[]>(['1', '2', '3', '4', '5', '6']);
		containerWidth.value = 150;
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} maxTagLines={2} />
		), { attachTo: document.body });
		await flush();

		expect(getTexts(wrapper)).toEqual(['New York', 'London', 'Sydney', '+3...']);
		expect(wrapper.find('.vc-select-tags').classes()).not.toContain('is-nowrap');

		wrapper.unmount();
	});

	it('maxTagLines = 0 keeps slicing by maxTags without measuring', async () => {
		const value = ref<any[]>(['1', '2', '3', '4', '5', '6']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} maxTags={4} maxTagLines={0} />
		), { attachTo: document.body });
		await flush();

		expect(getTexts(wrapper)).toEqual(['New York', 'London', 'Sydney', 'Ottawa', '+2...']);
		expect(wrapper.find('.vc-select-tags__measure').exists()).toBe(false);

		wrapper.unmount();
	});

	it('maxTags = 0 means no limit', async () => {
		const value = ref<any[]>(['1', '2', '3']);
		containerWidth.value = 1000;
		const wrapper = mount(() => (
			<div>
				<Select v-model={value.value} data={cityList} max={99} maxTags={0} />
				<Select v-model={value.value} data={cityList} max={99} maxTags={0} maxTagLines={0} />
			</div>
		), { attachTo: document.body });
		await flush();

		expect(getTexts(wrapper)).toEqual(['New York', 'London', 'Sydney', 'New York', 'London', 'Sydney']);

		wrapper.unmount();
	});

	it('hover a truncated tag opens popover with full label', async () => {
		const leaf = { destroy: vi.fn(), wrapper: { isActive: true } };
		const open = vi.spyOn(Popover, 'open').mockImplementation(() => leaf as any);
		onTestFinished(() => open.mockRestore());
		const value = ref<any[]>(['1', '2']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} />
		), { attachTo: document.body });
		await flush();

		const tag = getTags(wrapper)[0];
		const span = tag.find('.vc-tag__wrapper > span').element;
		const defineValue = (prop: string, v: number) => Object.defineProperty(span, prop, { configurable: true, value: v });

		// 未截断
		defineValue('scrollWidth', 80);
		defineValue('clientWidth', 80);
		await tag.trigger('mouseenter');
		expect(open).not.toHaveBeenCalled();

		// 截断：content 为函数，按文本渲染
		defineValue('scrollWidth', 120);
		await tag.trigger('mouseenter');
		expect(open).toHaveBeenCalledTimes(1);
		const options = open.mock.calls[0][0] as any;
		expect(options.triggerEl).toBe(tag.element);
		expect(options.content()).toBe('New York');

		// 弹层仍在显示时再次移入同一 tag：不重建
		await tag.trigger('mouseenter');
		expect(open).toHaveBeenCalledTimes(1);

		// 触发的 tag 被移除（外部修改值）：关闭弹层
		value.value = ['2'];
		await flush();
		expect(leaf.destroy).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('hover collapse tag lists hidden tags, removable in the list', async () => {
		const value = ref<any[]>(['1', '2', '3', '4', '5']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} />
		), { attachTo: document.body });
		await flush();
		expect(getTexts(wrapper)).toEqual(['New York', 'London', '+3...']);

		const getList = () => Array.from(
			document.querySelectorAll('.vc-select-tags__popover .vc-select-tags__list .vc-tag')
		).map(i => i.textContent);

		const collapse = getTags(wrapper)[2].element;
		await getTags(wrapper)[2].trigger('mouseenter');
		await flush();
		expect(getList()).toEqual(['Sydney', 'Ottawa', 'Paris']);
		const list = document.querySelector('.vc-select-tags__popover .vc-select-tags__list') as HTMLElement;
		expect(list.style.minHeight).toBe('');

		// 列表内移除：列表与折叠 tag 同步更新
		(document.querySelector('.vc-select-tags__popover .vc-tag__close') as HTMLElement).click();
		await flush();
		expect(value.value).toEqual(['1', '2', '4', '5']);
		expect(getTexts(wrapper)).toEqual(['New York', 'London', '+2...']);
		expect(getList()).toEqual(['Ottawa', 'Paris']);
		// 折叠 tag 不被重建（否则弹层的 triggerEl 失效，重新定位时错位而关闭）
		expect(getTags(wrapper)[2].element).toBe(collapse);
		// 锁定列表尺寸，避免弹层收缩移位后脱离鼠标
		expect(list.style.minWidth).toBe('300px');
		expect(list.style.minHeight).toBe('60px');

		// 全部可显示后关闭列表
		(document.querySelector('.vc-select-tags__popover .vc-tag__close') as HTMLElement).click();
		await flush();
		await sleep(50);
		expect(getTexts(wrapper)).toEqual(['New York', 'London', 'Paris']);
		expect(document.querySelector('.vc-select-tags__popover')).toBeNull();

		wrapper.unmount();
	});

	it('removing a tag in the collapse list keeps the dropdown open', async () => {
		const value = ref<any[]>(['1', '2', '3', '4', '5']);
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} onVisibleChange={onVisibleChange} />
		), { attachTo: document.body });
		await flush();

		await wrapper.trigger('click');
		await flush();
		const dropdown = document.querySelector('.vc-select__content')!.closest('.vc-popover-wrapper') as HTMLElement;
		expect(dropdown.style.display).not.toBe('none');

		// 列表弹层挂在 body 下，其触发节点（折叠 tag）在 Select 内：点击视为点在 Select 内
		await getTags(wrapper)[2].trigger('mouseenter');
		await flush();
		(document.querySelector('.vc-select-tags__popover .vc-tag__close') as HTMLElement).click();
		await flush();
		await sleep(200);

		expect(value.value).toEqual(['1', '2', '4', '5']);
		expect(onVisibleChange).not.toHaveBeenCalledWith(false);
		expect(dropdown.style.display).not.toBe('none');

		wrapper.unmount();
	});

	it('disabled: collapse list is read-only', async () => {
		const value = ref<any[]>(['1', '2', '3', '4', '5']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} disabled />
		), { attachTo: document.body });
		await flush();

		const tags = getTags(wrapper);
		await tags[tags.length - 1].trigger('mouseenter');
		await flush();
		expect(document.querySelectorAll('.vc-select-tags__popover .vc-tag').length).toBeGreaterThan(0);
		expect(document.querySelector('.vc-select-tags__popover .vc-tag__close')).toBeNull();

		wrapper.unmount();
	});

	it('refits after closing a tag', async () => {
		const value = ref<any[]>(['1', '2', '3', '4']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={99} />
		), { attachTo: document.body });
		await flush();
		expect(getTexts(wrapper)).toEqual(['New York', 'London', '+2...']);

		await getTags(wrapper)[0].find('.vc-tag__close').trigger('click');
		await flush();

		expect(value.value).toEqual(['2', '3', '4']);
		// London(60) + Sydney(60) + Ottawa(60) = 180 <= 200
		expect(getTexts(wrapper)).toEqual(['London', 'Sydney', 'Ottawa']);

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
