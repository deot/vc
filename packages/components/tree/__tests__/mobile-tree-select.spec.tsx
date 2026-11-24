// @vitest-environment jsdom

import { MTreeSelect, MForm, MFormItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const buildData = () => [
	{
		value: '1',
		label: '分组 1',
		children: [
			{ value: '1-1', label: '条目 1-1' },
			{ value: '1-2', label: '条目 1-2' }
		]
	},
	{
		value: '2',
		label: '分组 2',
		children: [
			{ value: '2-1', label: '条目 2-1' },
			{ value: '2-2', label: '条目 2-2', disabled: true }
		]
	},
	{ value: '3', label: '条目 3' }
];

const getRows = () => Array.from(document.querySelectorAll<HTMLElement>('.vcm-tree-select-panel .vc-tree-node'));
const getRow = (label: string) => {
	const el = getRows().find(row => row.querySelector(':scope > .vc-tree-node__content .vc-tree-node__label')?.textContent === label);
	expect(el, label).toBeTruthy();
	return el!;
};
const clickRow = async (label: string) => {
	getRow(label).querySelector<HTMLElement>(':scope > .vc-tree-node__content')!.click();
	await flush();
};
const clickExpand = async (label: string) => {
	getRow(label).querySelector<HTMLElement>(':scope > .vc-tree-node__content .vc-tree-node__expand-icon')!.click();
	await flush();
};
const check = async (label: string, checked = true) => {
	const input = getRow(label).querySelector<HTMLInputElement>(':scope > .vc-tree-node__content .vcm-checkbox input')!;
	input.checked = checked;
	input.dispatchEvent(new Event('change', { bubbles: true }));
	await flush();
};
const getLeft = () => document.querySelector('.vcm-picker-popup__item.is-left') as HTMLElement | null;
const getRight = () => document.querySelector('.vcm-picker-popup__item.is-right') as HTMLElement | null;
const getFooterButtons = () => Array.from(document.querySelectorAll<HTMLElement>('.vcm-picker-popup__footer .vcm-picker-popup__button'));

describe('MTreeSelect', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('plaintext：只渲染已选项的文字，没有 MListItem，点击不打开；空值不显示占位文字', async () => {
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<MTreeSelect
				plaintext
				max={0}
				modelValue={['1-1', '9', '3']}
				data={buildData()}
				label="条目"
				class="custom"
				onVisibleChange={onVisibleChange}
			/>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.element.tagName).toBe('SPAN');
		expect(wrapper.classes()).toEqual(['vcm-tree-select-plaintext', 'custom']);
		expect(wrapper.text()).toBe('分组 1 / 条目 1-1, 条目 3');
		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vcm-tree-select-panel')).toBeNull();
		expect(onVisibleChange).not.toHaveBeenCalled();
		wrapper.unmount();

		const empty = mount(() => (<MTreeSelect plaintext data={buildData()} />));
		expect(empty.text()).toBe('');
		empty.unmount();

		const extra = mount(() => (<MTreeSelect plaintext modelValue="9" data={buildData()} extra="-" />));
		expect(extra.text()).toBe('-');
		extra.unmount();
	});

	it('默认单选：MListItem 显示占位，弹层里是 MTree、没有复选框；点节点即提交并关闭，选中的节点打勾', async () => {
		const value = ref<any>();
		const onChange = vi.fn();
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<MTreeSelect
				v-model={value.value}
				data={buildData()}
				label="分类"
				title="选择分类"
				onChange={onChange}
				onVisibleChange={onVisibleChange}
			/>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.classes()).toContain('vcm-tree-select');
		expect(wrapper.find('.vcm-list-item').exists()).toBe(true);
		expect(wrapper.text()).toContain('请选择');

		await wrapper.trigger('click');
		await flush();
		expect(onVisibleChange).toHaveBeenCalledWith(true);
		expect(document.querySelector('.vcm-popup__title')!.textContent).toBe('选择分类');
		const tree = document.querySelector('.vcm-tree-select-panel .vc-tree')!;
		expect(tree.classList).toContain('vcm-tree');
		expect(tree.classList).toContain('is-single');
		expect(document.querySelector('.vcm-tree-select-panel .vcm-checkbox')).toBeNull();
		// 单选且不可清空：没有汇总栏
		expect(document.querySelector('.vcm-select-summary')).toBeNull();

		// 点父节点选中、不展开；展开点图标
		await clickExpand('分组 1');
		await clickRow('条目 1-2');
		expect(value.value).toBe('1-2');
		expect(onChange).toHaveBeenCalledWith('1-2', ['分组 1 / 条目 1-2']);
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);
		expect(wrapper.text()).toContain('分组 1 / 条目 1-2');

		// 再次打开：已选节点及其祖先展开，行尾打勾
		await wrapper.trigger('click');
		await flush();
		const row = getRow('条目 1-2');
		expect(row.classList).toContain('is-checked');
		expect(row.querySelector('.vc-tree-node__checked-icon')).not.toBeNull();
		wrapper.unmount();
	});

	it('单选 + checkStrategy child：点父节点只展开，叶子才能选中', async () => {
		const onOk = vi.fn();
		const leaf = MTreeSelect.open({ data: buildData(), checkStrategy: 'child', onOk });
		await flush();
		await clickRow('分组 2');
		expect(onOk).not.toHaveBeenCalled();
		expect(getRow('分组 2').classList).toContain('is-expanded');
		await clickRow('条目 2-1');
		expect(onOk).toHaveBeenCalledWith('2-1', ['分组 2 / 条目 2-1']);
		leaf.destroy();
	});

	it('多选：顶部工具栏，汇总栏显示数量与上限，确定提交，取消丢弃；不可清空时一项都没选不能确定', async () => {
		const value = ref<any[]>([]);
		const onCancel = vi.fn();
		const wrapper = mount(() => (
			<MTreeSelect
				v-model={value.value}
				data={buildData()}
				max={2}
				checkStrategy="child"
				onCancel={onCancel}
				formatter={(labels: string[]) => labels.join('、')}
			/>
		), { attachTo: document.body });
		await flush();
		await wrapper.trigger('click');
		await flush();

		expect(getRight()!.classList).toContain('is-disabled');
		expect(document.querySelector('.vcm-select-summary__count')!.textContent).toContain('0');
		await check('条目 3');
		expect(getRight()!.classList).not.toContain('is-disabled');

		getLeft()!.click();
		await flush();
		expect(onCancel).toHaveBeenCalled();
		expect(value.value).toEqual([]);

		await wrapper.trigger('click');
		await flush();
		// 重新打开时回到已提交的值
		expect(getRow('条目 3').classList).not.toContain('is-checked');
		await clickExpand('分组 1');
		await check('条目 1-1');
		await check('条目 3');
		// 选满：未勾选的节点不可勾选
		expect(getRow('条目 1-2').querySelector('.vcm-checkbox')!.classList).toContain('is-disabled');
		expect(document.querySelector('.vcm-select-summary__count')!.textContent).toMatch(/2.*2/);
		getRight()!.click();
		await flush();
		expect(value.value).toEqual(['1-1', '3']);
		expect(wrapper.text()).toContain('分组 1 / 条目 1-1、条目 3');
		wrapper.unmount();
	});

	it('字符串值按分隔符解析与输出', async () => {
		const value = ref<any>('1-1,3');
		const wrapper = mount(() => (
			<MTreeSelect v-model={value.value} data={buildData()} max={0} checkStrategy="child" />
		), { attachTo: document.body });
		await flush();
		expect(wrapper.text()).toContain('分组 1 / 条目 1-1, 条目 3');
		await wrapper.trigger('click');
		await flush();
		await check('条目 3', false);
		getRight()!.click();
		await flush();
		expect(value.value).toBe('1-1');
		wrapper.unmount();
	});

	it('搜索：按节点文字过滤，命中的祖先展开，无结果时提示', async () => {
		const leaf = MTreeSelect.open({ data: buildData(), max: 0, searchable: true, searchPlaceholder: '搜索分类' });
		await flush();
		const input = document.querySelector<HTMLInputElement>('.vcm-tree-select-panel__search input')!;
		expect(input.placeholder).toBe('搜索分类');

		input.value = '2-1';
		input.dispatchEvent(new Event('input'));
		await flush();
		await sleep(50);
		const visible = getRows().filter(row => row.offsetParent !== null || row.style.display !== 'none').map(row => row.textContent);
		expect(visible).toEqual(['分组 2', '条目 2-1']);
		expect(getRow('条目 2-1').querySelector('.vc-select-highlight')).not.toBeNull();

		input.value = '没有的';
		input.dispatchEvent(new Event('input'));
		await flush();
		expect(document.querySelector('.vcm-tree-select-panel .vc-tree__empty-text')!.textContent).toBe('暂无匹配数据');
		leaf.destroy();
	});

	it('virtualized：打开时滚到已选节点（尚未渲染），搜索后回到顶部', async () => {
		// jsdom 不加载组件样式：列表按原生滚动的容器识别
		const style = document.createElement('style');
		style.textContent = '.vcm-tree-select-panel__options { overflow-y: auto; }';
		document.head.appendChild(style);
		const data = Array.from({ length: 300 }, (_, i) => ({
			value: `${i}`,
			label: `分组 ${i}`,
			children: [{ value: `${i}-0`, label: `条目 ${i}-0` }]
		}));
		const leaf = MTreeSelect.open({ data, modelValue: '250-0', virtualized: true, searchable: true });
		await flush();
		await sleep(50);
		await flush();
		const list = document.querySelector<HTMLElement>('.vcm-tree-select-panel__options')!;
		expect(list.querySelector('.vcm-recycle-list')).toBeTruthy();
		expect(getRows().length).toBeLessThan(300);
		expect(list.scrollTop).toBeGreaterThan(0);

		const input = document.querySelector<HTMLInputElement>('.vcm-tree-select-panel__search input')!;
		input.value = '分组';
		input.dispatchEvent(new Event('input'));
		await flush();
		expect(list.scrollTop).toBe(0);
		leaf.destroy();
		style.remove();
	});

	it('clearable 单选：汇总栏「清空」即提交空值并关闭', async () => {
		const value = ref<any>('3');
		const onClear = vi.fn();
		const wrapper = mount(() => (
			<MTreeSelect v-model={value.value} data={buildData()} clearable onClear={onClear} />
		), { attachTo: document.body });
		await flush();
		expect(wrapper.text()).toContain('条目 3');
		await wrapper.trigger('click');
		await flush();
		(document.querySelector('.vcm-select-summary__clear') as HTMLElement).click();
		await flush();
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(value.value).toBe(undefined);
		expect(wrapper.text()).toContain('请选择');
		wrapper.unmount();
	});

	it('confirm 为 bottom：底部为清空 / 确定，清空只清弹层内的值', async () => {
		const onOk = vi.fn();
		const leaf = MTreeSelect.open({
			modelValue: ['1-1', '3'],
			data: buildData(),
			max: 0,
			checkStrategy: 'child',
			confirm: 'bottom',
			clearable: true,
			onOk
		});
		await flush();
		expect(document.querySelector('.vcm-tree-select-popup')!.classList).toContain('is-bottom');
		expect(document.querySelector('.vcm-select-summary__clear')).toBeNull();

		const [clear, ok] = getFooterButtons();
		expect(clear.textContent).toBe('清空');
		clear.click();
		await flush();
		expect(onOk).not.toHaveBeenCalled();
		expect(document.querySelectorAll('.vcm-tree-select-panel .vcm-checkbox.is-checked').length).toBe(0);
		ok.click();
		await sleep(300);
		await flush();
		expect(onOk).toHaveBeenCalledWith([], []);
		leaf.destroy();
	});

	it('confirm=true：单选也由确定提交', async () => {
		const onOk = vi.fn();
		const leaf = MTreeSelect.open({ value: '3', data: buildData(), confirm: true, onOk });
		await flush();
		await clickRow('分组 1');
		expect(onOk).not.toHaveBeenCalled();
		expect(getRow('分组 1').classList).toContain('is-checked');
		expect(getRow('条目 3').classList).not.toContain('is-checked');
		getRight()!.click();
		await flush();
		expect(onOk).toHaveBeenCalledWith('1', ['分组 1']);
		// 关闭动画结束后 await 得到 onOk 的参数组成的对象（测试环境的 Transition 为桩，直接发出 close）
		(document.querySelector('.vcm-picker-popup') as any).__vueParentComponent.emit('close');
		await expect(leaf).resolves.toEqual({ value: '1', labels: ['分组 1'] });
		leaf.destroy();
	});

	it('disabled 不打开；默认插槽替换触发区，参数为 { label, value }', async () => {
		const wrapper = mount(() => (
			<MTreeSelect modelValue="3" data={buildData()} disabled>
				{{ default: ({ label, value }: any) => (<span class="trigger">{ `${label.join('')}:${value}` }</span>) }}
			</MTreeSelect>
		), { attachTo: document.body });
		await flush();
		expect(wrapper.find('.trigger').text()).toBe('条目 3:3');
		await wrapper.trigger('click');
		await flush();
		expect(document.querySelector('.vcm-tree-select-panel')).toBeNull();
		wrapper.unmount();
	});

	it('在 MFormItem 内：提交后通知表单校验', async () => {
		const model = ref({ value: '' as any });
		const onValidate = vi.fn();
		const wrapper = mount(() => (
			<MForm model={model.value} rules={{ value: [{ required: true, message: '必填' }] }} onValidate={onValidate}>
				<MFormItem prop="value" label="分类">
					<MTreeSelect v-model={model.value.value} data={buildData()} />
				</MFormItem>
			</MForm>
		), { attachTo: document.body });
		await flush();
		await wrapper.find('.vcm-tree-select').trigger('click');
		await flush();
		await clickRow('条目 3');
		await sleep(50);
		expect(model.value.value).toBe('3');
		expect(wrapper.text()).not.toContain('必填');
		wrapper.unmount();
	});
});
