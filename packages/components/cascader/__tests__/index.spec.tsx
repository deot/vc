// @vitest-environment jsdom

import { Cascader, MCascader, Popover, VcInstance } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { CascaderView } from '../cascader-view';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi, onTestFinished } from 'vitest';
import * as Dom from '@deot/helper-dom';

vi.mock('@deot/helper-dom', { spy: true });

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const fireMouse = (
	el: Element,
	type: 'mouseenter' | 'mousemove' | 'mouseleave' | 'mousedown' | 'mouseup' | 'click'
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

	it('portal=false 时下拉挂到组件根节点内，点击下拉内部不会关闭', async () => {
		const wrapper = mount(() => (<Cascader data={options} portal={false} />), { attachTo: document.body });
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

	it('scrolls to the default selection using the rendered row height', async () => {
		const rowHeight = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(60);
		const scroll = vi.mocked(Dom.scrollIntoView).mockImplementation(async () => {});
		const wrapper = mount(() => (
			<Cascader modelValue={['zhejiang', 'hangzhou', 'binjiang']} data={options} />
		), { attachTo: document.body });
		try {
			await wrapper.trigger('click');
			await flush();
			expect(scroll).toHaveBeenCalledWith(getCols()[2].firstChild, { to: 60 });
		} finally {
			wrapper.unmount();
			scroll.mockRestore();
			rowHeight.mockRestore();
		}
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

	it('cell mousemove highlights and click syncs value', async () => {
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
		fireMouse(target, 'mousemove');
		await flush();
		expect(getCells(2)[1].className).toContain('is-select');

		(target as HTMLElement).click();
		await flush();
		expect(value.value[2]).toBe('binjiang');

		wrapper.unmount();
	});

	it('选项只响应真实的指针移动：内容在静止的指针下平移时补发的 mouseenter 不改变路径', async () => {
		const wrapper = mount(() => (
			<Cascader data={options} />
		), { attachTo: document.body });
		// 断言失败时也卸载，不影响后续用例
		onTestFinished(() => wrapper.unmount());
		await nextTick();

		await wrapper.trigger('click');
		await flush();
		expect(getCols().length).toBe(1);

		// 只有 mouseenter（布局变化后浏览器补发，没有 mousemove）：不展开
		fireMouse(getCells(0)[0], 'mouseenter');
		await flush();
		expect(getCols().length).toBe(1);
		expect(getCells(0)[0].className).not.toContain('is-select');

		// 指针在选项上移动：展开下一级
		fireMouse(getCells(0)[0], 'mousemove');
		await flush();
		expect(getCols().length).toBe(2);
		expect(getCells(0)[0].className).toContain('is-select');
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
		fireMouse(cellInCol0, 'mousemove');
		await flush();
		cellInCol0.click();
		await flush();

		const cellInCol1 = getCells(1)[0] as HTMLElement; // hangzhou
		fireMouse(cellInCol1, 'mousemove');
		await flush();
		cellInCol1.click();
		await flush();

		const cellInCol2 = getCells(2)[0] as HTMLElement; // xihu (leaf)
		fireMouse(cellInCol2, 'mousemove');
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
		fireMouse(cell, 'mousemove');
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

	it('clearable: click clear icon empties value and emits clear before the model update', async () => {
		const calls: string[] = [];
		const value = ref([...selectedValue]);
		const wrapper = mount(() => (
			<Cascader
				v-model={value.value}
				data={options}
				clearable
				onClear={() => calls.push('clear')}
				onChange={() => calls.push('change')}
			/>
		), { attachTo: document.body });
		await nextTick();

		// 清空图标始终在节点中，由样式在悬停时显示
		const icon = wrapper.find('.vc-select-trigger__clear');
		expect(icon.exists()).toBe(true);
		await icon.trigger('click');
		await flush();

		expect(calls).toEqual(['clear', 'change']);
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
		fireMouse(cell, 'mousemove');

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
		fireMouse(cell, 'mousemove');
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

describe('Cascader 弹层滚动', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('弹层不内置滚动；各列用 Scroller 滚动，列容器为横向的 Scroller', async () => {
		const wrapper = mount(() => (<Cascader data={options} />), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();

		const popup = document.querySelector('.vc-popover-wrapper') as HTMLElement;
		const content = popup.querySelector('.vc-popover-wrapper__content') as HTMLElement;
		expect(content.classList.contains('is-unscrollable')).toBe(true);
		expect(content.classList.contains('vc-scroller')).toBe(false);
		const columns = content.querySelector(':scope > .vc-scroller.vc-cascader__columns')!;
		expect(columns.querySelector(':scope > .vc-cascader__content > .vc-cascader-column')).not.toBeNull();
		const list = getCols()[0].firstElementChild as HTMLElement;
		expect(list.matches('.vc-scroller.vc-cascader-column__wrapper')).toBe(true);
		expect(getCells(0).length).toBe(options.length);
		expect(getCells(0)[0].closest('.vc-scroller')).toBe(list);

		wrapper.unmount();
	});
});

describe('Cascader 搜索与键盘', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const typeInto = (input: HTMLInputElement, value: string) => {
		input.value = value;
		input.dispatchEvent(new Event('input', { bubbles: true }));
	};
	// 统一的 Keyboard 在 document 的捕获阶段分发
	const press = (key: string) => {
		const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		document.body.dispatchEvent(event);
		return event;
	};
	const getPaths = () => Array.from(document.querySelectorAll<HTMLElement>('.vc-select-paths__item'));
	const getTexts = () => getPaths().map(item => item.textContent);
	const getSelected = () => Array.from(getCols()).map(column => column.querySelector('.is-select')?.textContent || '');
	const isOpen = () => {
		return Array.from(document.querySelectorAll<HTMLElement>('.vc-popover-wrapper')).some(el => el.style.display !== 'none');
	};

	it('ready、close 各只触发一次；关闭动画结束后才重置搜索词，淡出期间结果列表不变', async () => {
		const onReady = vi.fn();
		const onClose = vi.fn();
		const wrapper = mount(() => (
			<Cascader data={options} searchable onReady={onReady} onClose={onClose} />
		), {
			attachTo: document.body,
			// @vue/test-utils 默认把 Transition 换成桩，弹层的离场回调（close）不会触发
			global: { stubs: { transition: false } }
		});
		const input = wrapper.find('input');
		await input.trigger('click');
		await sleep(350);
		expect(onReady).toHaveBeenCalledTimes(1);

		typeInto(input.element as HTMLInputElement, 'West');
		await flush();
		expect(getTexts()).toEqual(['Zhejiang / Hangzhou / West Lake']);

		press('Escape');
		await flush();
		// 输入框立即显示回显，弹层淡出期间仍是搜索结果
		expect((input.element as HTMLInputElement).value).toBe('');
		expect(getTexts()).toEqual(['Zhejiang / Hangzhou / West Lake']);
		expect(onClose).not.toHaveBeenCalled();

		await sleep(250);
		await flush();
		expect(onClose).toHaveBeenCalledTimes(1);

		// 再打开是级联列
		await input.trigger('click');
		await flush();
		expect(getPaths().length).toBe(0);
		expect(getCols().length).toBeGreaterThan(0);

		wrapper.unmount();
	});

	it('内联搜索：按整条路径匹配，只列出末级并高亮；点击后写入路径、提交并关闭', async () => {
		const onChange = vi.fn();
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} searchable onChange={onChange} />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input');
		expect(input.attributes('readonly')).toBeUndefined();
		await input.trigger('click');
		await flush();
		expect(getCols().length).toBe(1);

		typeInto(input.element as HTMLInputElement, 'hangzhou');
		await flush();
		expect(getTexts()).toEqual(['Zhejiang / Hangzhou / West Lake', 'Zhejiang / Hangzhou / Bin Jiang']);
		expect(getCols().length).toBe(0);
		expect(getPaths()[0].querySelector('.vc-select-highlight')!.textContent).toBe('Hangzhou');

		// 点击结果时焦点留在输入框
		const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		getPaths()[1].dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);

		getPaths()[1].click();
		await flush();
		expect(value.value).toEqual(['zhejiang', 'hangzhou', 'binjiang']);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange.mock.calls[0][1]).toEqual(['Zhejiang', 'Hangzhou', 'Bin Jiang']);
		expect(isOpen()).toBe(false);
		// 关闭后重置搜索词，回显走 placeholder
		expect((input.element as HTMLInputElement).value).toBe('');
		expect(input.attributes('placeholder')).toBe('Zhejiang / Hangzhou / Bin Jiang');

		// 再次搜索时，当前值按已选中显示
		typeInto(input.element as HTMLInputElement, 'hangzhou');
		await flush();
		expect(getPaths().map(item => item.classList.contains('is-checked'))).toEqual([false, true]);

		wrapper.unmount();
	});

	it('changeOnSelect：任意一级可选', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} searchable changeOnSelect />
		), { attachTo: document.body });
		await nextTick();

		const input = wrapper.find('input');
		await input.trigger('click');
		await flush();
		typeInto(input.element as HTMLInputElement, 'ningbo');
		await flush();
		expect(getTexts()).toEqual(['Zhejiang / NingBo', 'Zhejiang / NingBo / Jiang Bei', 'Zhejiang / NingBo / Jiang Dong']);

		getPaths()[0].click();
		await flush();
		expect(value.value).toEqual(['zhejiang', 'ningbo']);
		expect(isOpen()).toBe(false);

		wrapper.unmount();
	});

	it('待加载子节点的节点不可选，搜索不调用 loadData；没有匹配时的提示跟随语言', async () => {
		const locale = VcInstance.options.locale;
		const loadData = vi.fn(() => Promise.resolve([]));
		const data = [
			{ value: 'a', label: 'Alpha', children: [] },
			{ value: 'b', label: 'Beta' }
		];
		const wrapper = mount(() => (
			<Cascader data={data} searchable loadData={loadData} />
		), { attachTo: document.body });
		try {
			VcInstance.configure({ locale: zhCN });
			await nextTick();
			const input = wrapper.find('input');
			await input.trigger('click');
			await flush();

			typeInto(input.element as HTMLInputElement, 'a');
			await flush();
			await sleep(300);
			expect(getTexts()).toEqual(['Beta']);
			expect(loadData).not.toHaveBeenCalled();

			typeInto(input.element as HTMLInputElement, 'zzz');
			await flush();
			expect(document.querySelector('.vc-select-paths__empty')!.textContent).toBe('暂无匹配数据');
			VcInstance.configure({ locale: enUS });
			await nextTick();
			expect(document.querySelector('.vc-select-paths__empty')!.textContent).toBe('No matching data');
		} finally {
			wrapper.unmount();
			VcInstance.configure({ locale });
		}
	});

	it('searchable="popover"：触发器只读，搜索栏在弹层顶部并自动聚焦', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} searchable="popover" searchPlaceholder="搜索" />
		), { attachTo: document.body });
		await nextTick();
		expect(wrapper.find('input').attributes('readonly')).toBeDefined();

		await wrapper.trigger('click');
		await flush();
		const search = document.querySelector('.vc-popover-wrapper__header .vc-select-search input') as HTMLInputElement;
		expect(search.getAttribute('placeholder')).toBe('搜索');
		expect(document.activeElement).toBe(search);

		typeInto(search, 'nanjing');
		await flush();
		expect(getTexts()).toEqual(['Jiangsu / Nanjing / Zhong Hua Men']);

		wrapper.unmount();
	});

	it('自定义触发区：内联搜索改用弹层搜索栏', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} searchable>
				{{ default: ({ label }: any) => (<div class="custom-trigger">{ label.join('/') }</div>) }}
			</Cascader>
		), { attachTo: document.body });
		await nextTick();
		expect(wrapper.find('input').exists()).toBe(false);

		await wrapper.find('.custom-trigger').trigger('click');
		await flush();
		const search = document.querySelector('.vc-select-search input') as HTMLInputElement;
		expect(search).not.toBeNull();

		typeInto(search, 'west');
		await flush();
		getPaths()[0].click();
		await flush();
		expect(value.value).toEqual(['zhejiang', 'hangzhou', 'xihu']);
		expect(wrapper.find('.custom-trigger').text()).toBe('Zhejiang/Hangzhou/West Lake');

		wrapper.unmount();
	});

	it('不可搜索时没有搜索栏', async () => {
		const wrapper = mount(() => (<Cascader data={options} />), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vc-popover-wrapper__header')).toBeNull();
		expect(wrapper.find('input').attributes('readonly')).toBeDefined();
		wrapper.unmount();
	});

	it('键盘：↑ ↓ 在当前列内移动，← → 回到父级 / 进入子级，回车提交', async () => {
		const value = ref<any[]>([...selectedValue]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} />
		), { attachTo: document.body });
		await nextTick();
		await wrapper.trigger('click');
		await flush();
		expect(getSelected()).toEqual(['Zhejiang', 'Hangzhou', 'West Lake']);

		expect(press('ArrowDown').defaultPrevented).toBe(true);
		await flush();
		expect(getSelected()).toEqual(['Zhejiang', 'Hangzhou', 'Bin Jiang']);
		press('ArrowDown');
		await flush();
		expect(getSelected()).toEqual(['Zhejiang', 'Hangzhou', 'West Lake']);

		expect(press('ArrowLeft').defaultPrevented).toBe(true);
		await flush();
		press('ArrowDown');
		await flush();
		expect(getSelected()).toEqual(['Zhejiang', 'NingBo', '']);

		// 未到末级时回车不提交
		press('Enter');
		await flush();
		expect(value.value).toEqual(selectedValue);
		expect(isOpen()).toBe(true);

		press('ArrowRight');
		await flush();
		expect(getSelected()).toEqual(['Zhejiang', 'NingBo', 'Jiang Bei']);
		press('Enter');
		await flush();
		expect(value.value).toEqual(['zhejiang', 'ningbo', 'jiangbei']);
		expect(isOpen()).toBe(false);

		wrapper.unmount();
	});

	it('键盘：没有路径时回车不处理；搜索时回车选中高亮的结果', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<Cascader v-model={value.value} data={options} searchable />
		), { attachTo: document.body });
		await nextTick();
		const input = wrapper.find('input');
		await input.trigger('click');
		await flush();

		press('Enter');
		await flush();
		expect(value.value).toEqual([]);
		expect(isOpen()).toBe(true);

		typeInto(input.element as HTMLInputElement, 'jiang');
		await flush();
		const getActive = () => document.querySelector('.vc-select-paths__item[data-active]')?.textContent;
		expect(getActive()).toBe('Zhejiang / Hangzhou / West Lake');
		// 有搜索词时左右键用于移动光标
		expect(press('ArrowRight').defaultPrevented).toBe(false);
		press('ArrowDown');
		expect(getActive()).toBe('Zhejiang / Hangzhou / Bin Jiang');
		press('Enter');
		await flush();
		expect(value.value).toEqual(['zhejiang', 'hangzhou', 'binjiang']);
		expect(isOpen()).toBe(false);

		wrapper.unmount();
	});

	// 触发器在视口（1024 宽）中的位置：左缘 x、宽 120
	const placeTrigger = (el: Element, x: number) => {
		(el as any).getBoundingClientRect = () => ({
			x, y: 0, width: 120, height: 32, left: x, right: x + 120, top: 0, bottom: 32, toJSON: () => ({})
		});
	};
	// 列宽：方向按根列宽度 × 数据层级估算所需宽度
	const mockColumnWidth = (selector: string, width: number) => {
		const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')!;
		Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
			configurable: true,
			get(this: HTMLElement) {
				return this.matches(selector) ? width : original.get!.call(this);
			}
		});
		onTestFinished(() => {
			Object.defineProperty(HTMLElement.prototype, 'offsetWidth', original);
		});
	};
	const isReverse = () => !!document.querySelector('.vc-cascader__columns.is-reverse');
	const getPopoverProp = (wrapper: any, key: string) => wrapper.findComponent(Popover as any).props(key);
	const getPlacement = (wrapper: any) => getPopoverProp(wrapper, 'placement');

	it('expandDirection 默认 right：向右展开，弹层方向不变', async () => {
		const wrapper = mount(() => (
			<Cascader data={options} />
		), { attachTo: document.body });
		onTestFinished(() => wrapper.unmount());
		await nextTick();
		await wrapper.trigger('click');
		await flush();
		expect(isReverse()).toBe(false);
		expect(getPlacement(wrapper)).toBe('bottom-left');
		expect(getPopoverProp(wrapper, 'keepEdge')).toBe('start');
	});

	it('expandDirection="left"：列向左展开，弹层与触发器右对齐（方向里的 left / right 互换），← 进入下一级、→ 回到上一级', async () => {
		const wrapper = mount(() => (
			<Cascader data={options} expandDirection="left" placement="top-left" />
		), { attachTo: document.body });
		onTestFinished(() => wrapper.unmount());
		await nextTick();
		await wrapper.trigger('click');
		await flush();
		expect(isReverse()).toBe(true);
		expect(getPlacement(wrapper)).toBe('top-right');
		// 内容靠右排：弹层变窄时保持右缘
		expect(getPopoverProp(wrapper, 'keepEdge')).toBe('end');

		press('ArrowDown');
		await flush();
		expect(getSelected()).toEqual(['Zhejiang', '']);
		expect(press('ArrowLeft').defaultPrevented).toBe(true);
		await flush();
		expect(getSelected()).toEqual(['Zhejiang', 'Hangzhou', '']);
		expect(press('ArrowRight').defaultPrevented).toBe(true);
		await flush();
		expect(getSelected()).toEqual(['Zhejiang', '']);
	});

	it('expandDirection="auto"：右侧放得下（根列宽 × 层级）时向右，放不下时选空间更大的一侧', async () => {
		// 3 级 × 150 = 450
		mockColumnWidth('.vc-cascader-column', 150);
		const open = async (x: number) => {
			const wrapper = mount(() => (
				<Cascader data={options} expandDirection="auto" />
			), { attachTo: document.body });
			// 断言失败时也卸载
			onTestFinished(() => {
				!wrapper.vm.$.isUnmounted && wrapper.unmount();
			});
			await nextTick();
			placeTrigger(wrapper.element, x);
			await wrapper.trigger('click');
			await flush();
			return wrapper;
		};

		// 靠左：右侧 1024 - 8 - 20 = 996，放得下
		let wrapper = await open(20);
		expect(isReverse()).toBe(false);
		expect(getPlacement(wrapper)).toBe('bottom-left');
		wrapper.unmount();
		await flush();

		// 靠右：右侧 1024 - 8 - 900 = 116 放不下，左侧 1020 - 8 = 1012 更大
		wrapper = await open(900);
		expect(isReverse()).toBe(true);
		expect(getPlacement(wrapper)).toBe('bottom-right');
		wrapper.unmount();
	});

	it('expandDirection="auto"：有 loadData（层级未知）时选空间更大的一侧', async () => {
		mockColumnWidth('.vc-cascader-column', 150);
		const loadData = () => Promise.resolve([]);
		const open = async (x: number) => {
			const wrapper = mount(() => (
				<Cascader data={options} loadData={loadData} expandDirection="auto" />
			), { attachTo: document.body });
			// 断言失败时也卸载
			onTestFinished(() => {
				!wrapper.vm.$.isUnmounted && wrapper.unmount();
			});
			await nextTick();
			placeTrigger(wrapper.element, x);
			await wrapper.trigger('click');
			await flush();
			return wrapper;
		};

		// 右侧 1024 - 8 - 300 = 716 > 左侧 420 - 8 = 412
		let wrapper = await open(300);
		expect(isReverse()).toBe(false);
		wrapper.unmount();
		await flush();

		// 右侧 416 < 左侧 712
		wrapper = await open(600);
		expect(isReverse()).toBe(true);
		wrapper.unmount();
	});
});
