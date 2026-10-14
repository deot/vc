// @vitest-environment jsdom

import { Select, MSelect, VcInstance, Popover } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { Option, OptionGroup } from '../select-option';
import { SelectAll, SelectPaths } from '../select-search';
import { fitTags } from '../select-trigger/utils';
import { keepFocus } from '../select-trigger';
import { scrollIntoScroller, useColumnNavigate, getPathsWidth } from '../hooks/use-navigate';
import {
	createSearchRegex,
	flattenData,
	getLabel,
	toCurrentValue,
	toModelValue,
	walkTree
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

// @vue/test-utils 默认把 Transition 换成桩（对 Portal 里的弹层同样生效），弹层的离场回调（Popover 的 close）不会触发
// 依赖关闭动画结束的用例改走真实的过渡
const realTransition = { global: { stubs: { transition: false } } };

// 弹层关闭动画（150ms）结束：搜索词在这之后才重置
const flushLeave = async () => {
	await sleep(250);
	await flush();
};

const fireMouse = (
	el: Element,
	type: 'mouseenter' | 'mouseleave' | 'mousedown' | 'mouseup' | 'click'
) => {
	el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
};

const typeInto = (input: HTMLInputElement, value: string) => {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
};

// 弹层顶部搜索栏（searchable="popover"）里的输入框
const getSearchInput = () => document.querySelector('.vc-select-search input') as HTMLInputElement;

// [说明, searchable 的值, 取搜索输入框]：内联搜索的输入框在触发器内
const searchModes: Array<[string, any, (wrapper: any) => HTMLInputElement]> = [
	['inline', true, wrapper => wrapper.find('input').element],
	['popover', 'popover', getSearchInput]
];

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
			typeInto(wrapper.find('input').element, 'New');
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
	it('walkTree：深度优先，带出各级祖先；返回 false 时不进入子节点', () => {
		const tree = [
			{ value: 'a', children: [{ value: 'a1', children: [{ value: 'a1x' }] }, { value: 'a2' }] },
			{ value: 'b', children: [{ value: 'b1' }] }
		];
		const visited: string[] = [];
		walkTree(tree, (item, ancestors) => {
			visited.push(ancestors.map(i => i.value).join('/'));
			return item.value !== 'a1';
		});
		expect(visited).toEqual(['a', 'a/a1', 'a/a2', 'b', 'b/b1']);
	});

	it('createSearchRegex: 空格分隔的词需同时命中，逗号分隔的各组任一命中', () => {
		const regex = createSearchRegex(' a  b,c ');
		expect(regex.test('xbxax')).toBe(true);
		expect(regex.test('xbx')).toBe(false);
		expect(regex.test('xcx')).toBe(true);
		expect(regex.test('xyz')).toBe(false);
		// 不区分大小写，且不依赖先后顺序
		expect(createSearchRegex('York new').test('New York')).toBe(true);
		expect(createSearchRegex('a,').test('xyz')).toBe(false);
		expect(createSearchRegex('').test('anything')).toBe(true);
		expect(createSearchRegex(' , ').test('anything')).toBe(true);
		expect(() => createSearchRegex('(')).not.toThrow();
		expect(() => createSearchRegex('[')).not.toThrow();
		expect(createSearchRegex('(1)').test('a(1)b')).toBe(true);
		// 正则的特殊字符按字面匹配
		expect(createSearchRegex('a.b').test('axb')).toBe(false);
		expect(createSearchRegex('a.b').test('a.b')).toBe(true);
	});

	it('createSearchRegex: highlight 标出任一关键词，较长的词优先', () => {
		expect(createSearchRegex('').highlight).toBeUndefined();
		const { highlight } = createSearchRegex('2 2-1,(x)');
		expect('三级 2-1-1 (x)'.match(highlight!)).toEqual(['2-1', '(x)']);
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

	it('fitTags: reserve keeps room after the tags on the last row', () => {
		// 全部放得下，且末行还能容纳预留宽度
		expect(fitTags({ widths: [50, 50], width: 200, lines: 1, plusWidth: 30, total: 2, reserve: 64 })).toEqual({ count: 2 });
		// 末行放不下预留宽度：减少数量，为折叠 tag 与预留宽度让位
		expect(fitTags({ widths: [70, 70, 70], width: 250, lines: 1, plusWidth: 40, total: 3, reserve: 64 })).toEqual({ count: 2 });
		expect(fitTags({ widths: [70, 70, 70, 70], width: 290, lines: 1, plusWidth: 40, total: 5, reserve: 64 })).toEqual({ count: 2 });
		// 还有空行时，预留部分可换到下一行
		expect(fitTags({ widths: [70, 70, 70], width: 250, lines: 2, plusWidth: 40, total: 3, reserve: 64 })).toEqual({ count: 3 });
		// 只剩一个时收缩它；收缩后比折叠 tag 还窄时只保留折叠 tag
		expect(fitTags({ widths: [200], width: 200, lines: 1, plusWidth: 40, total: 3, reserve: 64 })).toEqual({ count: 1, shrink: 96 });
		expect(fitTags({ widths: [70], width: 92, lines: 1, plusWidth: 40, total: 5, reserve: 64 })).toEqual({ count: 0 });
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

	it('clearable: click clear icon empties value', async () => {
		const onClear = vi.fn();
		const value = ref<any>('1');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} clearable onClear={onClear} />
		), { attachTo: document.body });
		await nextTick();

		// 清空图标始终在节点中，由样式在悬停时显示
		const icon = wrapper.find('.vc-select-trigger__clear');
		expect(icon.exists()).toBe(true);
		await icon.trigger('click');
		await flush();

		expect(value.value).toBe(undefined);
		expect(onClear).toHaveBeenCalled();
		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');

		wrapper.unmount();
	});

	it('clearable: clicking the arrow icon does not clear', async () => {
		const onClear = vi.fn();
		const value = ref<any>('1');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} clearable onClear={onClear} />
		), { attachTo: document.body });
		await nextTick();

		const icon = wrapper.find('.vc-select-trigger__icon');
		expect(icon.classes()).toContain('is-arrow');
		await icon.trigger('click');
		await flush();

		expect(value.value).toBe('1');
		expect(onClear).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('clear icon renders only when clearable, enabled and has value', async () => {
		const value = ref<any>('1');
		const options = ref<any>({ clearable: true });
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} {...options.value} />
		), { attachTo: document.body });
		await nextTick();
		expect(wrapper.find('.vc-select-trigger__clear').exists()).toBe(true);

		options.value = { clearable: true, disabled: true };
		await nextTick();
		expect(wrapper.find('.vc-select-trigger__clear').exists()).toBe(false);

		options.value = { clearable: false };
		await nextTick();
		expect(wrapper.find('.vc-select-trigger__clear').exists()).toBe(false);

		options.value = { clearable: true };
		value.value = undefined;
		await nextTick();
		expect(wrapper.find('.vc-select-trigger__clear').exists()).toBe(false);

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

		// 截断：按文本渲染
		defineValue('scrollWidth', 120);
		await tag.trigger('mouseenter');
		expect(open).toHaveBeenCalledTimes(1);
		const options = open.mock.calls[0][0] as any;
		expect(options.triggerElement).toBe(tag.element);
		expect(options.content).toBe('New York');

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
		// 折叠 tag 不被重建（否则弹层的 triggerElement 失效，重新定位时错位而关闭）
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
		const dropdown = document.querySelector('.vc-select__options')!.closest('.vc-popover-wrapper') as HTMLElement;
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

	it.each(searchModes)('searchable (%s): filters options by input text', async (_, searchable, getInput) => {
		const wrapper = mount(() => (
			<Select data={cityList} searchable={searchable} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const search = getInput(wrapper);
		expect(search).not.toBeNull();

		typeInto(search, 'New');
		await flush();

		const visible = Array.from(getOptions()).map(o => o.textContent);
		expect(visible.length).toBe(1);
		expect(visible[0]).toContain('New York');
		// 命中的部分高亮
		expect(getOptions()[0].querySelector('.vc-select-highlight')!.textContent).toBe('New');

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

		typeInto(wrapper.find('input').element, 'zzz_no_match');
		await flush();

		const visible = Array.from(getOptions()).map(o => o.textContent);
		expect(visible.length).toBe(1);
		expect(visible[0]).toContain('Always Visible');

		wrapper.unmount();
	});

	it.each(searchModes)('searchable (%s) + multiple shows SelectAll', async (mode, searchable, getInput) => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} searchable={searchable} />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.vc-select-all')).toBeNull();
		// 内联搜索时，没有全选就不渲染搜索栏
		expect(!!document.querySelector('.vc-select-search')).toBe(mode === 'popover');

		typeInto(getInput(wrapper), 'a');
		await flush();
		expect(document.querySelector('.vc-select-search')!.classList.contains('is-plain')).toBe(mode === 'inline');

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
		// 使用假定时器，避免真实计时在高负载下错过 debounce/Promise 的时间窗口
		vi.useFakeTimers();
		const loadData = vi.fn<(keyword: string) => Promise<void>>(() => new Promise(resolve => setTimeout(resolve, 350)));
		const wrapper = mount(() => (
			<Select data={cityList} searchable loadData={loadData} />
		), { attachTo: document.body });
		try {
			await nextTick();

			await wrapper.trigger('click');
			await nextTick();

			typeInto(wrapper.find('input').element, 'foo');

			// debounce 250ms 到期后调用 loadData，其 Promise（350ms）pending 期间触发器的后缀图标显示 loading
			await vi.advanceTimersByTimeAsync(250);
			await nextTick();
			expect(loadData).toHaveBeenCalledTimes(1);
			expect(loadData.mock.calls[0][0]).toBe('foo');
			expect(wrapper.find('.vc-select__append .vc-spin').exists()).toBe(true);
			expect(wrapper.find('.vc-select-trigger__clear').exists()).toBe(false);

			// Promise resolve 后 loading 消失
			await vi.advanceTimersByTimeAsync(350);
			await nextTick();
			expect(wrapper.find('.vc-select__append .vc-spin').exists()).toBe(false);
		} finally {
			vi.useRealTimers();
			wrapper.unmount();
		}
	});

	it('远程搜索：关闭时不调用 loadData，下次打开时按空关键词加载一次', async () => {
		// 搜索词在弹层关闭动画结束后才重置：走真实的过渡（见 realTransition），动画用到 requestAnimationFrame，防抖用到 Date
		vi.useFakeTimers({
			toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'Date']
		});
		const loadData = vi.fn<(keyword: string) => Promise<void>>(() => Promise.resolve());
		const value = ref<any>();
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} searchable loadData={loadData} />
		), { attachTo: document.body, ...realTransition });
		try {
			await nextTick();
			const input = wrapper.find('input');
			const element = input.element as HTMLInputElement;
			const { close } = (wrapper.findComponent(Select).vm as any).$.exposed;
			const getKeywords = () => loadData.mock.calls.map(args => args[0]);

			// 数据还是初始的：打开不加载
			await input.trigger('click');
			await nextTick();
			expect(getKeywords()).toEqual([]);

			typeInto(element, 'Lon');
			await vi.advanceTimersByTimeAsync(250);
			expect(getKeywords()).toEqual(['Lon']);

			// 选中后关闭：搜索词重置，但这不是用户发起的搜索
			(getOptions()[0] as HTMLElement).click();
			await vi.advanceTimersByTimeAsync(500);
			expect(value.value).toBe('2');
			expect(element.value).toBe('');
			expect(getKeywords()).toEqual(['Lon']);

			// 重新打开：当前数据是按 Lon 加载的，立即（不经过防抖）按空关键词加载一次
			await input.trigger('click');
			await nextTick();
			expect(getKeywords()).toEqual(['Lon', '']);

			// 数据已是默认的：再次关闭、打开都不加载
			close();
			await vi.advanceTimersByTimeAsync(500);
			await input.trigger('click');
			await vi.advanceTimersByTimeAsync(500);
			expect(getKeywords()).toEqual(['Lon', '']);

			// 输入后不到 250ms 就关闭：这一次搜索不再发出，数据没变，再打开也不加载
			typeInto(element, 'Par');
			await vi.advanceTimersByTimeAsync(100);
			close();
			await vi.advanceTimersByTimeAsync(500);
			expect(element.value).toBe('');
			await input.trigger('click');
			await vi.advanceTimersByTimeAsync(500);
			expect(getKeywords()).toEqual(['Lon', '']);

			// 关闭时直接输入而打开：只按输入的关键词搜索，不额外按空关键词加载
			close();
			await vi.advanceTimersByTimeAsync(500);
			typeInto(element, 'Syd');
			await vi.advanceTimersByTimeAsync(250);
			expect(getKeywords()).toEqual(['Lon', '', 'Syd']);

			// 用户自己清空关键词，按空关键词搜索；之后关闭、打开不再加载
			typeInto(element, '');
			await vi.advanceTimersByTimeAsync(250);
			close();
			await vi.advanceTimersByTimeAsync(500);
			await input.trigger('click');
			await vi.advanceTimersByTimeAsync(500);
			expect(getKeywords()).toEqual(['Lon', '', 'Syd', '']);
		} finally {
			vi.useRealTimers();
			wrapper.unmount();
		}
	});

	it('远程搜索：还没有数据时，打开即按空关键词加载一次；加载过后不再重复', async () => {
		vi.useFakeTimers();
		const data = ref<any[]>([]);
		const loadData = vi.fn<(keyword: string) => Promise<void>>(async () => {
			data.value = cityList;
		});
		const wrapper = mount(() => (
			<Select data={data.value} searchable loadData={loadData} />
		), { attachTo: document.body });
		try {
			await nextTick();
			const input = wrapper.find('input');
			const { close } = (wrapper.findComponent(Select).vm as any).$.exposed;

			// 不经过防抖，打开后立即调用
			await input.trigger('click');
			await nextTick();
			expect(loadData.mock.calls.map(args => args[0])).toEqual(['']);
			await vi.advanceTimersByTimeAsync(0);
			expect(getOptions().length).toBe(cityList.length);

			close();
			await vi.advanceTimersByTimeAsync(500);
			await input.trigger('click');
			await vi.advanceTimersByTimeAsync(500);
			expect(loadData).toHaveBeenCalledTimes(1);

			// 加载结果为空也算加载过
			data.value = [];
			close();
			await vi.advanceTimersByTimeAsync(500);
			await input.trigger('click');
			await vi.advanceTimersByTimeAsync(500);
			expect(loadData).toHaveBeenCalledTimes(1);
		} finally {
			vi.useRealTimers();
			wrapper.unmount();
		}
	});

	it('未开启搜索时不调用 loadData，也不沿用之前的文字', async () => {
		const data = ref<any[]>([]);
		const loadData = vi.fn(() => Promise.resolve());
		const wrapper = mount(() => (
			<Select modelValue="2" data={data.value} loadData={loadData} />
		), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();
		expect(loadData).not.toHaveBeenCalled();

		data.value = cityList;
		await nextTick();
		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('London');
		data.value = [];
		await nextTick();
		expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');

		wrapper.unmount();
	});

	it('远程搜索：还没有数据时直接输入而打开，只按输入的关键词搜索', async () => {
		vi.useFakeTimers();
		const loadData = vi.fn<(keyword: string) => Promise<void>>(() => Promise.resolve());
		const wrapper = mount(() => (
			<Select data={[]} searchable loadData={loadData} />
		), { attachTo: document.body });
		try {
			await nextTick();
			typeInto(wrapper.find('input').element as HTMLInputElement, 'Lon');
			await vi.advanceTimersByTimeAsync(250);
			expect(loadData.mock.calls.map(args => args[0])).toEqual(['Lon']);
		} finally {
			vi.useRealTimers();
			wrapper.unmount();
		}
	});

	it('远程搜索：已选项不在新的搜索结果里时，单选回显沿用上次见到的文字', async () => {
		vi.useFakeTimers();
		const data = ref<any[]>(cityList);
		const value = ref<any>('2');
		const onChange = vi.fn();
		// 按关键词过滤，结果里不一定有已选项
		const loadData = vi.fn<(keyword: string) => Promise<void>>(async (keyword) => {
			data.value = cityList.filter(item => item.label.includes(keyword));
		});
		const wrapper = mount(() => (
			<Select v-model={value.value} data={data.value} searchable loadData={loadData} onChange={onChange} />
		), { attachTo: document.body });
		try {
			await nextTick();
			const input = wrapper.find('input');
			const element = input.element as HTMLInputElement;
			expect(input.attributes('placeholder')).toBe('London');

			await input.trigger('click');
			await nextTick();
			typeInto(element, 'Par');
			await vi.advanceTimersByTimeAsync(250);
			expect(Array.from(getOptions()).map(o => o.textContent)).toEqual(['Paris']);
			expect(input.attributes('placeholder')).toBe('London');

			// 搜索无结果、数据为空时也保留
			typeInto(element, 'zzz');
			await vi.advanceTimersByTimeAsync(250);
			expect(getOptions().length).toBe(0);
			expect(input.attributes('placeholder')).toBe('London');

			// 换选之后记的是新选的一项
			typeInto(element, 'Par');
			await vi.advanceTimersByTimeAsync(250);
			(getOptions()[0] as HTMLElement).click();
			await vi.advanceTimersByTimeAsync(500);
			expect(onChange).toHaveBeenLastCalledWith('5', ['Paris']);
			typeInto(element, 'Syd');
			await vi.advanceTimersByTimeAsync(250);
			expect(input.attributes('placeholder')).toBe('Paris');
		} finally {
			vi.useRealTimers();
			wrapper.unmount();
		}
	});

	it('远程搜索：多选标签的文字不随搜索结果变空，change 带出的文字完整', async () => {
		vi.useFakeTimers();
		const data = ref<any[]>(cityList);
		const value = ref<any[]>(['1', '2']);
		const onChange = vi.fn();
		const loadData = vi.fn<(keyword: string) => Promise<void>>(async (keyword) => {
			data.value = cityList.filter(item => item.label.includes(keyword));
		});
		const wrapper = mount(() => (
			<Select v-model={value.value} data={data.value} max={5} maxTagLines={0} searchable loadData={loadData} onChange={onChange} />
		), { attachTo: document.body });
		try {
			await nextTick();
			const getTags = () => wrapper.findAll('.vc-select-tags > .vc-tag').map(tag => tag.text());
			expect(getTags()).toEqual(['New York', 'London']);

			const input = wrapper.find('input');
			await input.trigger('click');
			await nextTick();
			typeInto(input.element as HTMLInputElement, 'Par');
			await vi.advanceTimersByTimeAsync(250);
			expect(getTags()).toEqual(['New York', 'London']);

			(getOptions()[0] as HTMLElement).click();
			await vi.advanceTimersByTimeAsync(0);
			expect(onChange).toHaveBeenLastCalledWith(['1', '2', '5'], ['New York', 'London', 'Paris']);
			expect(getTags()).toEqual(['New York', 'London', 'Paris']);

			// 移除后不再保留它的文字
			value.value = ['5'];
			await nextTick();
			value.value = ['5', '1'];
			await nextTick();
			expect(getTags()).toEqual(['Paris', '']);
		} finally {
			vi.useRealTimers();
			wrapper.unmount();
		}
	});

	it('本地数据：数据里没有的值没有文字，不沿用之前的', async () => {
		const data = ref<any[]>(cityList);
		const wrapper = mount(() => (
			<Select modelValue="2" data={data.value} searchable />
		), { attachTo: document.body });
		await nextTick();
		expect(wrapper.find('input').attributes('placeholder')).toBe('London');

		data.value = cityList.filter(item => item.value !== '2');
		await nextTick();
		expect(wrapper.find('input').attributes('placeholder')).toBe('请选择');

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

			typeInto(wrapper.find('input').element, 'foo');

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

describe('Select 弹层滚动', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('搜索在固定区，选项由 Popover 内置的 Scroller 限高滚动，弹层内只有一个滚动容器', async () => {
		const wrapper = mount(() => (<Select data={cityList} searchable="popover" />), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();

		const popup = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		expect(popup.querySelector('.vc-popover-wrapper__header > .vc-select-search')).not.toBeNull();
		const options = popup.querySelector('.vc-popover-wrapper__content') as HTMLElement;
		expect(options.classList.contains('vc-select__options')).toBe(true);
		expect(options.style.maxHeight).toBe('200px');
		expect(options.querySelector('.vc-select-search')).toBeNull();
		expect(options.querySelectorAll('.vc-select-option').length).toBeGreaterThan(0);
		expect(popup.querySelectorAll('.vc-scroller')).toHaveLength(1);

		wrapper.unmount();
	});

	it('不可搜索、内联搜索时不渲染固定区；内联多选出现全选时才渲染，关键词清空后移除', async () => {
		const searchable = ref(false);
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} searchable={searchable.value} />
		), { attachTo: document.body });
		onTestFinished(() => wrapper.unmount());
		await nextTick();
		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper__header')).toBeNull();

		await wrapper.trigger('click');
		await flush();
		searchable.value = true;
		await nextTick();
		const input = wrapper.find('input');
		await input.trigger('click');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper__header')).toBeNull();

		// 弹层打开期间才出现的插槽也会渲染
		typeInto(input.element as HTMLInputElement, 'a');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper__header .vc-select-all')).not.toBeNull();

		typeInto(input.element as HTMLInputElement, '');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper__header')).toBeNull();
	});
});

describe('Select 内联搜索', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const keydown = (el: Element, key: string, options: KeyboardEventInit = {}) => {
		el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }));
	};

	it('searchable 只接受布尔值、inline、popover', () => {
		const { validator } = (Select as any).props.searchable;
		expect([true, false, 'inline', 'popover'].every(validator)).toBe(true);
		expect(validator('other')).toBe(false);
	});

	it('不可搜索与 popover 搜索时触发器只读，回显文字是输入框的值', async () => {
		const searchable = ref<any>(false);
		const wrapper = mount(() => (
			<Select modelValue="1" data={cityList} searchable={searchable.value} />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input');
		expect(input.attributes('readonly')).toBeDefined();
		expect((input.element as HTMLInputElement).value).toBe('New York');

		searchable.value = 'popover';
		await nextTick();
		expect(input.attributes('readonly')).toBeDefined();
		expect((input.element as HTMLInputElement).value).toBe('New York');

		wrapper.unmount();
	});

	it.each([[true], ['inline']])('单选（searchable = %s）：输入框的值是搜索词，回显文字走 placeholder', async (searchable) => {
		const wrapper = mount(() => (
			<Select modelValue="1" data={cityList} searchable={searchable} searchPlaceholder="搜索" />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input');
		const trigger = wrapper.find('.vc-select-trigger');
		expect(input.attributes('readonly')).toBeUndefined();
		expect((input.element as HTMLInputElement).value).toBe('');
		expect(input.attributes('placeholder')).toBe('New York');
		// 未打开时按正常文字显示；is-active 只在弹层打开时出现（光标只在此时显示）
		expect(trigger.classes()).toContain('is-value');
		expect(trigger.classes()).not.toContain('is-active');
		expect(wrapper.find('.vc-select-trigger__icon').classes()).toContain('is-arrow');

		await input.trigger('click');
		await flush();
		// 打开后回到占位色，聚焦输入框，后缀为搜索图标
		expect(trigger.classes()).not.toContain('is-value');
		expect(trigger.classes()).toContain('is-active');
		expect(trigger.classes()).toContain('is-focus');
		expect(input.attributes('placeholder')).toBe('New York');
		expect(document.activeElement).toBe(input.element);
		expect(wrapper.find('.vc-select-trigger__icon').classes()).not.toContain('is-arrow');

		wrapper.unmount();
	});

	it('单选未选中时：打开后显示 searchPlaceholder', async () => {
		const wrapper = mount(() => (
			<Select data={cityList} searchable searchPlaceholder="搜索" />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input');
		expect(input.attributes('placeholder')).toBe('请选择');
		expect(wrapper.find('.vc-select-trigger').classes()).not.toContain('is-value');

		await input.trigger('click');
		await flush();
		expect(input.attributes('placeholder')).toBe('搜索');

		wrapper.unmount();
	});

	it('打开后点击输入区不关闭，点击后缀图标关闭；关闭时重置搜索词', async () => {
		const wrapper = mount(() => (
			<Select data={cityList} searchable />
		), { attachTo: document.body, ...realTransition });
		await nextTick();

		const input = wrapper.find('input');
		await input.trigger('click');
		await flush();
		expect(getOptions().length).toBe(cityList.length);

		typeInto(input.element as HTMLInputElement, 'New');
		await flush();
		expect(getOptions().length).toBe(1);

		await input.trigger('click');
		await flush();
		expect(getOptions().length).toBe(1);

		await wrapper.find('.vc-select-trigger__icon').trigger('click');
		await flush();
		// 输入框立即显示回显；弹层淡出期间内容保持关闭前的样子，不变回完整列表
		expect((input.element as HTMLInputElement).value).toBe('');
		expect(getOptions().length).toBe(1);

		await flushLeave();
		await input.trigger('click');
		await flush();
		expect(getOptions().length).toBe(cityList.length);

		wrapper.unmount();
	});

	it('弹层关闭但已聚焦时，输入即打开并通知 visible-change', async () => {
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<Select data={cityList} searchable onVisibleChange={onVisibleChange} />
		), { attachTo: document.body });
		await nextTick();

		typeInto(wrapper.find('input').element as HTMLInputElement, 'Lon');
		await flush();

		expect(onVisibleChange).toHaveBeenCalledTimes(1);
		expect(onVisibleChange).toHaveBeenCalledWith(true);
		expect(Array.from(getOptions()).map(o => o.textContent)).toEqual(['London']);

		wrapper.unmount();
	});

	it('禁用时输入不打开，回显文字沿用占位色', async () => {
		const wrapper = mount(() => (
			<Select modelValue="1" data={cityList} searchable disabled />
		), { attachTo: document.body });
		await nextTick();

		expect(wrapper.find('input').attributes('placeholder')).toBe('New York');
		expect(wrapper.find('.vc-select-trigger').classes()).not.toContain('is-value');

		typeInto(wrapper.find('input').element as HTMLInputElement, 'Lon');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();

		wrapper.unmount();
	});

	it('单选选中后关闭，焦点留在输入框，回显新选中的文字', async () => {
		const value = ref<any>('1');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} searchable />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input');
		await input.trigger('click');
		await flush();
		typeInto(input.element as HTMLInputElement, 'Lon');
		await flush();

		// 点击选项时不转移焦点
		const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		getOptions()[0].dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);

		(getOptions()[0] as HTMLElement).click();
		await flush();

		expect(value.value).toBe('2');
		expect((input.element as HTMLInputElement).value).toBe('');
		expect(input.attributes('placeholder')).toBe('London');
		expect(wrapper.find('.vc-select-trigger').classes()).toContain('is-value');
		expect(document.activeElement).toBe(input.element);

		wrapper.unmount();
	});

	it('多选：输入框跟在标签之后，打开时为它预留宽度', async () => {
		const value = ref<any[]>(['1', '2']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} searchable />
		), { attachTo: document.body });
		await nextTick();

		const tags = wrapper.findComponent({ name: 'vc-select-tags' });
		const input = wrapper.find('.vc-select-tags__suffix input');
		expect(input.exists()).toBe(true);
		// 有标签时不显示占位文字
		expect(input.attributes('placeholder')).toBe('');
		expect(tags.props('reserve')).toBe(0);

		await wrapper.find('.vc-tag').trigger('click');
		await flush();
		expect(tags.props('reserve')).toBe(64);
		expect((wrapper.find('.vc-select-tags__suffix').element as HTMLElement).style.flexBasis).toBe('64px');
		expect(document.activeElement).toBe(input.element);

		// 打开后点击标签区不关闭
		await wrapper.find('.vc-tag').trigger('click');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper')).not.toBeNull();
		expect(tags.props('reserve')).toBe(64);

		wrapper.unmount();
	});

	it('多选无标签时输入框显示 placeholder', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} searchable />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('.vc-select-tags__suffix input');
		expect(input.attributes('placeholder')).toBe('请选择');

		// 首个标签出现后仍是同一个输入框（不丢焦点）
		await input.trigger('click');
		await flush();
		(getOptions()[0] as HTMLElement).click();
		await flush();
		expect(value.value).toEqual(['1']);
		expect(wrapper.find('.vc-select-tags__suffix input').element).toBe(input.element);
		expect(document.activeElement).toBe(input.element);

		wrapper.unmount();
	});

	it('多选：输入为空时退格移除最后一个，输入非空、长按、输入法组合中不移除', async () => {
		const value = ref<any[]>(['1', '2', '3']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} searchable />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('.vc-select-tags__suffix input').element as HTMLInputElement;
		keydown(input, 'Backspace', { repeat: true });
		keydown(input, 'Backspace', { isComposing: true });
		keydown(input, 'Enter');
		await flush();
		expect(value.value).toEqual(['1', '2', '3']);

		keydown(input, 'Backspace');
		await flush();
		expect(value.value).toEqual(['1', '2']);

		typeInto(input, 'a');
		await flush();
		keydown(input, 'Backspace');
		await flush();
		expect(value.value).toEqual(['1', '2']);

		wrapper.unmount();
	});

	it('多选不可搜索时没有输入框，无标签时沿用只读输入框', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={cityList} max={5} />
		), { attachTo: document.body });
		await nextTick();
		expect(wrapper.find('.vc-select-tags').exists()).toBe(false);
		expect(wrapper.find('input').attributes('readonly')).toBeDefined();

		value.value = ['1'];
		await nextTick();
		expect(wrapper.find('.vc-select-tags').exists()).toBe(true);
		expect(wrapper.find('.vc-select-tags__suffix').exists()).toBe(false);
		expect(wrapper.find('input').exists()).toBe(false);

		wrapper.unmount();
	});

	it('popover 搜索：打开后自动聚焦搜索栏', async () => {
		const wrapper = mount(() => (
			<Select data={cityList} searchable="popover" searchPlaceholder="搜索" />
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		const search = getSearchInput();
		expect(search.getAttribute('placeholder')).toBe('搜索');
		expect(document.activeElement).toBe(search);

		wrapper.unmount();
	});
});

describe('Select 键盘', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	// 统一的 Keyboard 在 document 的捕获阶段分发
	const press = (key: string, options: KeyboardEventInit = {}, el: Element = document.body) => {
		const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
		el.dispatchEvent(event);
		return event;
	};
	const getActive = () => document.querySelector('.vc-select-option[data-active]')?.textContent;
	// 关闭后的弹层在离场动画结束前仍在节点中（display: none）
	const isOpen = () => {
		return Array.from(document.querySelectorAll<HTMLElement>('.vc-popover-wrapper')).some(el => el.style.display !== 'none');
	};
	const data = [
		{ value: '1', label: 'New York' },
		{ value: '2', label: 'London', disabled: true },
		{ value: '3', label: 'Sydney' },
		{ value: '4', label: 'Ottawa' }
	];

	it('触发器聚焦且弹层关闭时回车打开；未聚焦、禁用时不响应', async () => {
		const onVisibleChange = vi.fn();
		const disabled = ref(false);
		const wrapper = mount(() => (
			<Select data={data} disabled={disabled.value} onVisibleChange={onVisibleChange} />
		), { attachTo: document.body });
		await nextTick();

		expect(press('Enter').defaultPrevented).toBe(false);
		await flush();
		expect(isOpen()).toBe(false);

		const input = wrapper.find('input').element;
		input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		await nextTick();
		disabled.value = true;
		await nextTick();
		expect(press('Enter', {}, input).defaultPrevented).toBe(false);

		disabled.value = false;
		await nextTick();
		expect(press('Enter', {}, input).defaultPrevented).toBe(true);
		await flush();
		expect(isOpen()).toBe(true);
		expect(onVisibleChange).toHaveBeenCalledWith(true);

		// 关闭且失焦后不再订阅
		press('Escape');
		await flush();
		input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
		await nextTick();
		expect(press('Enter').defaultPrevented).toBe(false);

		wrapper.unmount();
	});

	it('↑ ↓ 在可选的选项间移动（跳过禁用，首尾循环），回车选中并关闭', async () => {
		const value = ref<any>();
		const wrapper = mount(() => (
			<Select v-model={value.value} data={data} />
		), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();

		// 只有禁用的选项带 disabled 属性
		expect(Array.from(getOptions()).map(option => option.getAttribute('disabled'))).toEqual([null, 'disabled', null, null]);

		// 没有已选项时默认高亮第一项
		expect(getActive()).toBe('New York');
		expect(press('ArrowDown').defaultPrevented).toBe(true);
		expect(getActive()).toBe('Sydney');
		press('ArrowDown');
		expect(getActive()).toBe('Ottawa');
		press('ArrowDown');
		expect(getActive()).toBe('New York');
		press('ArrowUp');
		expect(getActive()).toBe('Ottawa');
		expect(document.querySelectorAll('[data-active]').length).toBe(1);

		expect(press('Enter').defaultPrevented).toBe(true);
		await flush();
		expect(value.value).toBe('4');
		expect(isOpen()).toBe(false);

		wrapper.unmount();
	});

	it('默认高亮：打开时为已选项，搜索词变化后为第一个匹配项；鼠标移入共用同一个高亮', async () => {
		const value = ref<any>('3');
		const wrapper = mount(() => (
			<Select v-model={value.value} data={data} searchable />
		), { attachTo: document.body });
		await nextTick();
		await wrapper.find('input').trigger('click');
		await flush();
		expect(getActive()).toBe('Sydney');

		typeInto(wrapper.find('input').element as HTMLInputElement, 'o');
		await flush();
		// 禁用的 London 不参与
		expect(getActive()).toBe('New York');

		const last = getOptions()[getOptions().length - 1];
		last.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		expect(getActive()).toBe('Ottawa');
		// 禁用项不高亮
		getOptions()[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		expect(getActive()).toBe('Ottawa');

		press('Enter');
		await flush();
		expect(value.value).toBe('4');

		wrapper.unmount();
	});

	it('多选：回车切换选中且不关闭', async () => {
		const value = ref<any[]>(['1']);
		const wrapper = mount(() => (
			<Select v-model={value.value} data={data} max={5} />
		), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();

		press('ArrowDown');
		press('Enter');
		await flush();
		expect(value.value).toEqual(['1', '3']);
		press('Enter');
		await flush();
		expect(value.value).toEqual(['1']);
		expect(isOpen()).toBe(true);

		wrapper.unmount();
	});

	it('Esc 关闭并消费按键，Tab 关闭但不消费；输入法组合、带修饰键时不处理', async () => {
		// 页面上的其他监听（如 Modal 的 Esc 关闭）
		const outside = vi.fn();
		document.addEventListener('keydown', outside);
		onTestFinished(() => document.removeEventListener('keydown', outside));

		const wrapper = mount(() => (
			<Select data={data} searchable />
		), { attachTo: document.body });
		await nextTick();
		const input = wrapper.find('input');
		await input.trigger('click');
		await flush();

		expect(press('Escape', { isComposing: true }).defaultPrevented).toBe(false);
		expect(press('ArrowDown', { ctrlKey: true }).defaultPrevented).toBe(false);
		// 没有可左右移动的内容时，左右键不处理；其他按键不处理
		expect(press('ArrowLeft').defaultPrevented).toBe(false);
		expect(press('a').defaultPrevented).toBe(false);
		await flush();
		expect(isOpen()).toBe(true);
		outside.mockClear();

		expect(press('Escape').defaultPrevented).toBe(true);
		await flush();
		expect(outside).not.toHaveBeenCalled();
		expect(isOpen()).toBe(false);
		// 焦点交还给触发器
		expect(document.activeElement).toBe(input.element);

		await input.trigger('click');
		await flush();
		expect(press('Tab').defaultPrevented).toBe(false);
		await flush();
		expect(outside).toHaveBeenCalledTimes(1);
		expect(isOpen()).toBe(false);

		wrapper.unmount();
	});

	it('卸载后不再订阅', async () => {
		const wrapper = mount(() => (<Select data={data} />), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();
		wrapper.unmount();
		expect(press('Escape').defaultPrevented).toBe(false);
	});

	it('keepFocus：点击可输入文字的节点以外不转移焦点', () => {
		const fire = (el: HTMLElement) => {
			document.body.appendChild(el);
			const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
			el.addEventListener('mousedown', keepFocus);
			el.dispatchEvent(event);
			return event.defaultPrevented;
		};
		const create = (tag: string, type?: string) => {
			const el = document.createElement(tag);
			type && el.setAttribute('type', type);
			return el;
		};
		expect(fire(create('div'))).toBe(true);
		expect(fire(create('input', 'checkbox'))).toBe(true);
		expect(fire(create('input', 'text'))).toBe(false);
		expect(fire(create('textarea'))).toBe(false);
	});

	it('scrollIntoScroller：只调整所在 Scroller 的滚动位置', () => {
		const scroller = document.createElement('div');
		scroller.className = 'vc-scroller';
		const item = document.createElement('div');
		scroller.appendChild(item);
		document.body.appendChild(scroller);
		const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;
		vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue(rect(100, 300));
		Object.defineProperty(scroller, 'clientHeight', { value: 200 });
		const spy = vi.spyOn(item, 'getBoundingClientRect');

		scroller.scrollTop = 50;
		spy.mockReturnValue(rect(80, 110));
		scrollIntoScroller(item);
		expect(scroller.scrollTop).toBe(30);

		spy.mockReturnValue(rect(290, 320));
		scrollIntoScroller(item);
		expect(scroller.scrollTop).toBe(50);

		spy.mockReturnValue(rect(150, 180));
		scrollIntoScroller(item);
		expect(scroller.scrollTop).toBe(50);

		// 不在 Scroller 内、节点为空时不处理
		scrollIntoScroller(document.body);
		scrollIntoScroller(null);
	});

	it('useColumnNavigate：列内上下移动跳过禁用项，左右回到父级 / 进入子级', async () => {
		const tree = [
			{ value: 'a', children: [{ value: 'a1', disabled: true }, { value: 'a2' }] },
			{ value: 'b', disabled: true },
			{ value: 'c' }
		];
		let path: string[] = [];
		const getColumns = () => {
			const columns: any[][] = [tree];
			path.forEach((v, i) => columns.push(columns[i].find(item => item.value === v)?.children || []));
			return columns;
		};
		const hover = vi.fn((item: any, columnIndex: number) => {
			path = [...path.slice(0, columnIndex), item.value];
		});
		const getItem = vi.fn();
		const enter = vi.fn();
		const isSearching = ref(false);
		const create = (options: any) => useColumnNavigate({
			getItem,
			enter,
			isSearching: () => isSearching.value,
			getView: () => ({ offsetWidth: 300 }) as HTMLElement,
			...options
		});
		const { paths, searchWidth, navigator } = create({ getPath: () => path, getColumns, hover });
		const move = navigator.move!;
		const shift = navigator.shift!;

		// 无路径时不进入子级
		shift(1);
		expect(path).toEqual([]);
		move(1);
		expect(path).toEqual(['a']);
		move(1);
		expect(path).toEqual(['c']);
		move(1);
		expect(path).toEqual(['a']);
		move(-1);
		expect(path).toEqual(['c']);
		// 没有子级时不动
		shift(1);
		expect(path).toEqual(['c']);

		move(-1);
		shift(1);
		expect(path).toEqual(['a', 'a2']);
		move(1);
		expect(path).toEqual(['a', 'a2']);
		shift(-1);
		expect(path).toEqual(['a']);
		// 已在第一列时不动
		shift(-1);
		expect(path).toEqual(['a']);

		await nextTick();
		expect(getItem).toHaveBeenCalled();

		// 无路径时向上从最后一项开始；整列都禁用、列为空时不动
		path = [];
		move(-1);
		expect(path).toEqual(['c']);
		const calls = hover.mock.calls.length;
		const disabled = create({ getPath: () => [], getColumns: () => [[{ value: 'x', disabled: true }]], hover });
		disabled.navigator.move!(1);
		create({ getPath: () => [], getColumns: () => [], hover }).navigator.move!(1);
		expect(hover.mock.calls.length).toBe(calls);

		// 回车：不在搜索时交给调用方
		navigator.enter!();
		expect(enter).toHaveBeenCalledTimes(1);

		// 搜索时方向键与回车交给搜索结果列表，宽度沿用列视图
		expect(searchWidth.value).toBe(240);
		isSearching.value = true;
		await nextTick();
		expect(searchWidth.value).toBe(300);
		// 列表尚未挂载时不处理
		navigator.move!(1);
		paths.value = { move: vi.fn(), enter: vi.fn() };
		navigator.move!(1);
		navigator.enter!();
		expect(paths.value.move).toHaveBeenCalledWith(1);
		expect(paths.value.enter).toHaveBeenCalledTimes(1);
		expect(enter).toHaveBeenCalledTimes(1);
		expect(hover.mock.calls.length).toBe(calls);
	});
});

describe('SelectPaths', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const tree = [
		{
			value: 'a',
			label: '分组 A',
			children: [
				{ value: 'a1', label: '条目 A1' },
				{ value: 'a2', label: '条目 A2', disabled: true }
			]
		},
		{ value: 'b', label: '分组 B', children: [{ value: 'b1', label: '条目 B1' }] }
	];
	const getItems = () => Array.from(document.querySelectorAll('.vc-select-paths__item'));
	const getTexts = () => getItems().map(item => item.textContent);

	it('getPathsWidth 限制在 [240, 360]', () => {
		expect(getPathsWidth()).toBe(240);
		expect(getPathsWidth({ offsetWidth: 300 } as HTMLElement)).toBe(300);
		expect(getPathsWidth({ offsetWidth: 600 } as HTMLElement)).toBe(360);
	});

	it('默认只按节点自身的 label 匹配，列出完整路径并高亮最后一级', async () => {
		const wrapper = mount(() => (
			<SelectPaths data={tree} regex={createSearchRegex('A')} width={260} />
		), { attachTo: document.body });
		await flush();

		expect(getTexts()).toEqual(['分组 A', '分组 A / 条目 A1', '分组 A / 条目 A2']);
		expect((wrapper.element as HTMLElement).style.width).toBe('260px');
		// 路径上的上级不高亮
		expect(getItems()[1].querySelectorAll('.vc-select-highlight').length).toBe(1);
		expect(getItems()[1].querySelector('.vc-select-paths__label')!.getAttribute('title')).toBe('分组 A / 条目 A1');

		wrapper.unmount();
	});

	it('path：路径上任一级命中即列出并高亮；selectable 限定可作为结果的节点', async () => {
		const wrapper = mount(() => (
			<SelectPaths data={tree} regex={createSearchRegex('分组 B1')} path selectable={(item: any) => !item.children} />
		), { attachTo: document.body });
		await flush();

		// 两个词分别落在不同的层级上
		expect(getTexts()).toEqual(['分组 B / 条目 B1']);
		expect(Array.from(getItems()[0].querySelectorAll('.vc-select-highlight')).map(el => el.textContent)).toEqual(['分组', 'B1']);
		expect((wrapper.element as HTMLElement).style.width).toBe('');

		wrapper.unmount();
	});

	it('remote：数据已由调用方过滤，全部列出；没有结果时显示 emptyText', async () => {
		const data = ref<any[]>(tree);
		const wrapper = mount(() => (
			<SelectPaths data={data.value} regex={/zzz/i} remote emptyText="暂无匹配数据" />
		), { attachTo: document.body });
		await flush();
		expect(getItems().length).toBe(5);

		data.value = [];
		await flush();
		expect(document.querySelector('.vc-select-paths__empty')!.textContent).toBe('暂无匹配数据');

		wrapper.unmount();
	});

	it('点击选中并带出路径；禁用项不可选；checked、prefix 插槽', async () => {
		const onSelect = vi.fn();
		const wrapper = mount(() => (
			<SelectPaths
				data={tree}
				regex={createSearchRegex('条目 A')}
				checked={(data: any) => data.item.value === 'a1'}
				onSelect={onSelect}
			>
				{{ prefix: ({ item }: any) => (<i class="prefix">{ item.value }</i>) }}
			</SelectPaths>
		), { attachTo: document.body });
		await flush();

		const [first, second] = getItems() as HTMLElement[];
		expect(first.classList.contains('is-checked')).toBe(true);
		expect(second.classList.contains('is-disabled')).toBe(true);
		expect(first.querySelector('.prefix')!.textContent).toBe('a1');

		second.click();
		expect(onSelect).not.toHaveBeenCalled();
		first.click();
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect.mock.calls[0][0]).toMatchObject({ labels: ['分组 A', '条目 A1'], values: ['a', 'a1'] });

		wrapper.unmount();
	});

	it('键盘：默认高亮第一项，上下移动跳过禁用项，回车选中；结果变化后回到第一项', async () => {
		const regex = ref(createSearchRegex('条目'));
		const onSelect = vi.fn();
		const wrapper = mount(() => (
			<SelectPaths data={tree} regex={regex.value} onSelect={onSelect} />
		), { attachTo: document.body });
		await flush();
		const paths = (wrapper.findComponent(SelectPaths).vm as any).$.exposed;
		const getActive = () => document.querySelector('.vc-select-paths__item[data-active]')?.textContent;

		expect(getActive()).toBe('分组 A / 条目 A1');
		paths.move(1);
		expect(getActive()).toBe('分组 B / 条目 B1');
		paths.move(1);
		expect(getActive()).toBe('分组 A / 条目 A1');
		paths.move(-1);
		paths.enter();
		expect(onSelect.mock.calls[0][0].values).toEqual(['b', 'b1']);

		regex.value = createSearchRegex('分组');
		await flush();
		expect(getActive()).toBe('分组 A');

		// 鼠标移入共用同一个高亮
		getItems()[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		expect(getActive()).toBe('分组 B');

		// 没有结果时不处理
		regex.value = createSearchRegex('zzz');
		await flush();
		paths.move(1);
		paths.enter();
		expect(onSelect).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});
});
